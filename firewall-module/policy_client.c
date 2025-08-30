// firewall_client.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <stdint.h>
#include <errno.h>
#include <sys/socket.h>
#include <linux/netlink.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "cjson/cJSON.h"

#define NETLINK_USER   31
#define SERVER_PORT    9999
#define BUFFER_SIZE    8192

/* Netlink message types */
#define NLMSG_RULE_ADD   0x10
#define NLMSG_RULE_DEL   0x11
#define NLMSG_RULE_CLR   0x12

typedef struct {
    char     rule_type;   /* 'S' src IP, 'D' dst IP, 'P' port */
    uint32_t ip_addr;     /* NBO */
    uint16_t port;        /* NBO */
} KernelRule;

typedef struct {
    char  *type;      /* "ip" | "port" */
    char  *mode;      /* "blacklist"   */
    char  *action;    /* "add" | "delete" | "clear" */
    char  *target;    /* "src" | "dst" (default "src") */
    char **values;
    int    count;
} Rule;

/* ================= Netlink ================= */
static int netlink_socket = -1;

static int init_netlink(void){
    if (netlink_socket >= 0)
        return 0;

    struct sockaddr_nl addr;
    memset(&addr, 0, sizeof(addr));

    netlink_socket = socket(PF_NETLINK, SOCK_RAW, NETLINK_USER);
    if (netlink_socket < 0) {
        perror("socket");
        return -1;
    }

    addr.nl_family = AF_NETLINK;
    addr.nl_pid    = getpid();

    if (bind(netlink_socket, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(netlink_socket);
        netlink_socket = -1;
        return -1;
    }

    return 0;
}

static void drain_netlink_ack(void){
    if (netlink_socket < 0)
        return;

    char buf[NLMSG_SPACE(256)];
    struct iovec iov = { .iov_base = buf, .iov_len = sizeof(buf) };
    struct sockaddr_nl sa;
    struct msghdr msg = {
        .msg_name    = &sa,
        .msg_namelen = sizeof(sa),
        .msg_iov     = &iov,
        .msg_iovlen  = 1
    };

    (void)recvmsg(netlink_socket, &msg, MSG_DONTWAIT);
}

static int send_rule(uint16_t nl_type, const KernelRule *rule)
{
    if (init_netlink() < 0)
        return -1;

    struct sockaddr_nl dest = { .nl_family = AF_NETLINK, .nl_pid = 0 };

    struct nlmsghdr *nlh = calloc(1, NLMSG_SPACE(sizeof(KernelRule)));
    if (!nlh) {
        perror("calloc");
        return -1;
    }

    nlh->nlmsg_len   = NLMSG_LENGTH(sizeof(KernelRule));
    nlh->nlmsg_pid   = getpid();
    nlh->nlmsg_flags = NLM_F_REQUEST | NLM_F_ACK;
    nlh->nlmsg_type  = nl_type;

    memcpy(NLMSG_DATA(nlh), rule, sizeof(*rule));

    struct iovec iov = { .iov_base = nlh, .iov_len = nlh->nlmsg_len };
    struct msghdr msg = {
        .msg_name    = &dest,
        .msg_namelen = sizeof(dest),
        .msg_iov     = &iov,
        .msg_iovlen  = 1
    };

    printf("[NL] type=0x%x rule_type=%c\n", nl_type, rule->rule_type);

    if (sendmsg(netlink_socket, &msg, 0) < 0) {
        perror("sendmsg");
        free(nlh);
        return -1;
    }

    free(nlh);
    drain_netlink_ack();
    return 0;
}

/* ================= JSON ================= */
static Rule *parse_json(const char *json_str){
    Rule *r = calloc(1, sizeof(*r));
    if (!r) {
        perror("calloc");
        return NULL;
    }

    cJSON *j = cJSON_Parse(json_str);
    if (!j) {
        fprintf(stderr, "[ERROR] invalid json\n");
        free(r);
        return NULL;
    }

    cJSON *action = cJSON_GetObjectItem(j, "action");
    r->action = strdup((action && cJSON_IsString(action)) ? action->valuestring : "add");

    cJSON *target = cJSON_GetObjectItem(j, "target");
    r->target = strdup((target && cJSON_IsString(target)) ? target->valuestring : "src");

    cJSON *type = cJSON_GetObjectItem(j, "type");
    if (!(type && cJSON_IsString(type))) {
        fprintf(stderr, "[ERROR] missing/invalid 'type'\n");
        cJSON_Delete(j);
        free(r->action); free(r->target); free(r);
        return NULL;
    }
    r->type = strdup(type->valuestring);

    cJSON *mode = cJSON_GetObjectItem(j, "mode");
    if (!(mode && cJSON_IsString(mode))) {
        fprintf(stderr, "[ERROR] missing/invalid 'mode'\n");
        cJSON_Delete(j);
        free(r->action); free(r->target); free(r->type); free(r);
        return NULL;
    }
    r->mode = strdup(mode->valuestring);

    cJSON *values = cJSON_GetObjectItem(j, "values");
    if (values && cJSON_IsArray(values)) {
        r->count  = cJSON_GetArraySize(values);
        r->values = calloc(r->count, sizeof(char*));
        if (!r->values) {
            perror("calloc");
            cJSON_Delete(j);
            free(r->action); free(r->target); free(r->type); free(r->mode); free(r);
            return NULL;
        }
        for (int i = 0; i < r->count; i++) {
            cJSON *it = cJSON_GetArrayItem(values, i);
            if (cJSON_IsString(it))
                r->values[i] = strdup(it->valuestring);
            else if (cJSON_IsNumber(it)) {
                /* המרה לבטוחה למחרוזת */
                char tmp[32];
                /* פורטים עד 65535, אבל גם אם יגיע מספר גדול – לא יקרוס */
                snprintf(tmp, sizeof(tmp), "%.0f", it->valuedouble);
                r->values[i] = strdup(tmp);
            }
        }
    }
    else {
        r->count = 0; /* תקין ל-clear */
    }

    cJSON_Delete(j);
    return r;
}

static void free_Rule(Rule *r){
    if (!r) return;
    for (int i=0; i<r->count; i++) free(r->values[i]);
    free(r->values);
    free(r->type);
    free(r->mode);
    free(r->action);
    free(r->target);
    free(r);
}

/* ================= Process rule ================= */
static void process_rule(const char *json_data){
    Rule *r = parse_json(json_data);
    if (!r) return;

    if (strcmp(r->mode, "blacklist") != 0) {
        free_Rule(r);
        return;
    }

    uint16_t nl_type = NLMSG_RULE_ADD;
    if (strcmp(r->action, "delete") == 0) nl_type = NLMSG_RULE_DEL;
    else if (strcmp(r->action, "clear") == 0) nl_type = NLMSG_RULE_CLR;

    char target_ch = (r->target && strcmp(r->target, "dst") == 0) ? 'D' : 'S';

    if (nl_type == NLMSG_RULE_CLR) {
        KernelRule kr = { .rule_type = (strcmp(r->type, "port")==0) ? 'P' : target_ch };
        (void)send_rule(nl_type, &kr);
        free_Rule(r);
        return;
    }

    if (r->count <= 0) {
        fprintf(stderr, "[WARN] no values provided\n");
        free_Rule(r);
        return;
    }

    for (int i=0; i<r->count; i++) {
        KernelRule kr;
        memset(&kr, 0, sizeof(kr));

        if (strcmp(r->type, "ip") == 0) {
            struct in_addr a;
            if (inet_aton(r->values[i], &a) == 0) {
                fprintf(stderr, "[WARN] bad ip: %s\n", r->values[i]);
                continue;
            }
            kr.rule_type = target_ch;
            kr.ip_addr   = a.s_addr;
        }
        else if (strcmp(r->type, "port") == 0) {
            char *end = NULL;
            long p = strtol(r->values[i], &end, 10);
            kr.rule_type = 'P';
            kr.port      = htons((uint16_t)p);
        } else {
            fprintf(stderr, "[WARN] unknown type: %s\n", r->type);
            continue;
        }

        (void)send_rule(nl_type, &kr);
    }

    free_Rule(r);
}

/* ================= Server ================= */
static void run_server(void){
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        exit(1);
    }

    int opt = 1;
    (void)setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port        = htons(SERVER_PORT);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) { 
        perror("bind"); exit(1); 
    }
    if (listen(server_fd, 5) < 0) { 
        perror("listen"); exit(1); 
    }

    while (1) {
        socklen_t alen = sizeof(addr);
        int cfd = accept(server_fd, (struct sockaddr*)&addr, &alen);
        if (cfd < 0) { perror("accept"); continue; }

        char buf[BUFFER_SIZE];
        memset(buf, 0, sizeof(buf));
        int n = (int)read(cfd, buf, sizeof(buf)-1);
        if (n > 0) {
            char *json = strstr(buf, "{");
            if (json) process_rule(json);
        }

        if (write(cfd, "OK\n", 3) < 0) {
            perror("write");
        }
        close(cfd);
    }
}

int main(void){
    run_server();
    return 0;
}
