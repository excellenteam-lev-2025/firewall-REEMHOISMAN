/* firewall_client.c - Simplified Client Application */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <linux/netlink.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "cjson/cJSON.h"

#define NETLINK_USER 31
#define SERVER_PORT 9999
#define BUFFER_SIZE 8192

/* Rule structure matching kernel */
typedef struct {
    char cmd;           /* A=Add, D=Delete, C=Clear */
    char rule_type;     /* S=Source IP, D=Dest IP, P=Port */
    uint32_t ip_addr;   
    uint16_t port;      
} KernelRule;

/* Parsed JSON rule */
typedef struct {
    char *type;         /* "ip" or "port" */
    char *mode;         /* "blacklist" or "whitelist" */
    char **values;      /* Array of IPs/ports */
    int count;          /* Number of values */
} IPRule;

/* ============= Netlink Communication ============= */

static int netlink_socket = -1;

/* Initialize netlink socket once */
static int init_netlink(void) {
    struct sockaddr_nl addr;
    
    if (netlink_socket >= 0)
        return 0;  /* Already initialized */
    
    netlink_socket = socket(PF_NETLINK, SOCK_RAW, NETLINK_USER);
    if (netlink_socket < 0) {
        perror("socket");
        return -1;
    }
    
    memset(&addr, 0, sizeof(addr));
    addr.nl_family = AF_NETLINK;
    addr.nl_pid = getpid();
    
    if (bind(netlink_socket, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(netlink_socket);
        netlink_socket = -1;
        return -1;
    }
    
    printf("[NL] Netlink socket initialized\n");
    return 0;
}

/* Send rule to kernel */
static int send_rule(KernelRule *rule) {
    struct sockaddr_nl dest_addr;
    struct nlmsghdr *nlh;
    struct iovec iov;
    struct msghdr msg;
    
    if (init_netlink() < 0)
        return -1;
    
    /* Prepare destination */
    memset(&dest_addr, 0, sizeof(dest_addr));
    dest_addr.nl_family = AF_NETLINK;
    dest_addr.nl_pid = 0;  /* Kernel */
    
    /* Allocate message */
    nlh = (struct nlmsghdr *)calloc(1, NLMSG_SPACE(sizeof(KernelRule)));
    nlh->nlmsg_len = NLMSG_LENGTH(sizeof(KernelRule));
    nlh->nlmsg_pid = getpid();
    nlh->nlmsg_flags = NLM_F_REQUEST | NLM_F_ACK;
    
    memcpy(NLMSG_DATA(nlh), rule, sizeof(KernelRule));
    
    /* Send message */
    iov.iov_base = (void *)nlh;
    iov.iov_len = nlh->nlmsg_len;
    
    memset(&msg, 0, sizeof(msg));
    msg.msg_name = (void *)&dest_addr;
    msg.msg_namelen = sizeof(dest_addr);
    msg.msg_iov = &iov;
    msg.msg_iovlen = 1;
    
    printf("[NL] Sending: cmd=%c type=%c", rule->cmd, rule->rule_type);
    if (rule->rule_type != 'P') {
        struct in_addr addr = {.s_addr = rule->ip_addr};
        printf(" ip=%s", inet_ntoa(addr));
    } else {
        printf(" port=%u", ntohs(rule->port));
    }
    printf("\n");
    
    if (sendmsg(netlink_socket, &msg, 0) < 0) {
        perror("sendmsg");
        free(nlh);
        return -1;
    }
    
    free(nlh);
    return 0;
}

/* ============= JSON Parsing ============= */

static IPRule* parse_json(const char *json_str) {
    IPRule *rule = calloc(1, sizeof(IPRule));
    cJSON *json = cJSON_Parse(json_str);
    
    if (!json) {
        printf("[ERROR] Invalid JSON\n");
        free(rule);
        return NULL;
    }
    
    /* Get type and mode */
    cJSON *type = cJSON_GetObjectItem(json, "type");
    if (type && cJSON_IsString(type))
        rule->type = strdup(type->valuestring);
    
    cJSON *mode = cJSON_GetObjectItem(json, "mode");
    if (mode && cJSON_IsString(mode))
        rule->mode = strdup(mode->valuestring);
    
    /* Get values array */
    cJSON *values = cJSON_GetObjectItem(json, "values");
    if (values && cJSON_IsArray(values)) {
        rule->count = cJSON_GetArraySize(values);
        rule->values = calloc(rule->count, sizeof(char*));
        
        for (int i = 0; i < rule->count; i++) {
            cJSON *item = cJSON_GetArrayItem(values, i);
            if (cJSON_IsString(item))
                rule->values[i] = strdup(item->valuestring);
        }
    }
    
    cJSON_Delete(json);
    return rule;
}

static void free_rule(IPRule *rule) {
    if (!rule) return;
    
    for (int i = 0; i < rule->count; i++)
        free(rule->values[i]);
    free(rule->values);
    free(rule->type);
    free(rule->mode);
    free(rule);
}

/* ============= Rule Processing ============= */

static void process_rule(const char *json_data) {
    IPRule *rule;
    KernelRule krule;
    
    printf("\n[CLIENT] Processing new rule\n");
    
    rule = parse_json(json_data);
    if (!rule) {
        printf("[ERROR] Failed to parse rule\n");
        return;
    }
    
    /* Display rule info */
    printf("Type: %s\n", rule->type);
    printf("Mode: %s\n", rule->mode); 
    printf("Values: %d entries\n", rule->count);
    
    /* Only process blacklist rules */
    if (strcmp(rule->mode, "blacklist") != 0) {
        printf("[INFO] Only blacklist mode supported\n");
        free_rule(rule);
        return;
    }
    
    /* Send each value to kernel */
    krule.cmd = 'A';  /* Add */
    krule.rule_type = 'S';  /* Source IP by default */
    
    for (int i = 0; i < rule->count; i++) {
        printf("  [%d] %s\n", i+1, rule->values[i]);
        
        if (strcmp(rule->type, "ip") == 0) {
            struct in_addr addr;
            inet_aton(rule->values[i], &addr);
            krule.ip_addr = addr.s_addr;
            krule.port = 0;
        } else if (strcmp(rule->type, "port") == 0) {
            krule.rule_type = 'P';
            krule.port = htons(atoi(rule->values[i]));
            krule.ip_addr = 0;
        }
        
        send_rule(&krule);
    }
    
    free_rule(rule);
    printf("[SUCCESS] Rules sent to kernel\n");
}

/* ============= Server Mode ============= */
static void run_server(void) {
    int server_fd, client_fd;
    struct sockaddr_in addr;
    char buffer[BUFFER_SIZE];
    
    printf("[SERVER] Starting on port %d\n", SERVER_PORT);
    
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        exit(1);
    }
    
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(SERVER_PORT);
    
    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        exit(1);
    }
    
    /* Listen */
    if (listen(server_fd, 5) < 0) {
        perror("listen");
        exit(1);
    }
    
    printf("[SERVER] Listening for connections from node server...\n");
    
    /* Accept loop */
    while (1) {
        socklen_t addrlen = sizeof(addr);
        client_fd = accept(server_fd, (struct sockaddr *)&addr, &addrlen);
        
        if (client_fd < 0) {
            perror("accept");
            continue;
        }
        
        printf("[SERVER] Client connected\n");
        
        /* Read data */
        memset(buffer, 0, sizeof(buffer));
        int bytes = read(client_fd, buffer, sizeof(buffer) - 1);
        
        if (bytes > 0) {
            /* Find JSON start */
            char *json = strstr(buffer, "{");
            if (json) {
                process_rule(json);
            }
        }
        
        /* Send response */
        if (write(client_fd, "OK\n", 3) < 0) {
            perror("write");
        }
        close(client_fd);
    }
}

/* ============= Main ============= */
int main() {
    run_server();
    return 0;
}