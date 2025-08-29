#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <unistd.h>
#include <sys/socket.h>
#include <linux/netlink.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/time.h>
#include "cjson/cJSON.h"

#define NETLINK_USER 31
#define MAX_PAYLOAD 8192

typedef struct {
    char **values;
    int count;
    char *type;
    char *mode;
} IPRule;

typedef struct {
    char cmd;           // 'A'=Add, 'D'=Delete, 'C'=Clear
    char rule_type;     
    uint32_t ip_addr;   
    uint16_t port;      
} KernelRule;

int send_to_kernel(KernelRule *rule) {
    struct sockaddr_nl src_addr, dest_addr;
    struct nlmsghdr *nlh = NULL;
    int sock_fd;

    sock_fd = socket(PF_NETLINK, SOCK_RAW, NETLINK_USER);
    if (sock_fd < 0) {
        printf("[ERROR] failed to create netlink socket\n");
        return -1;
    }

    struct timeval tv = { .tv_sec = 2, .tv_usec = 0 };
    setsockopt(sock_fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    memset(&src_addr, 0, sizeof(src_addr));
    src_addr.nl_family = AF_NETLINK;
    src_addr.nl_pid = getpid();

    if (bind(sock_fd, (struct sockaddr*)&src_addr, sizeof(src_addr)) < 0) {
        perror("bind");
        close(sock_fd);
        return -1;
    }

    memset(&dest_addr, 0, sizeof(dest_addr));
    dest_addr.nl_family = AF_NETLINK;
    dest_addr.nl_pid = 0;    // kernel
    dest_addr.nl_groups = 0; // unicast

    nlh = (struct nlmsghdr *)malloc(NLMSG_SPACE(sizeof(KernelRule)));
    memset(nlh, 0, NLMSG_SPACE(sizeof(KernelRule)));
    nlh->nlmsg_len = NLMSG_LENGTH(sizeof(KernelRule));
    nlh->nlmsg_pid = getpid();
    nlh->nlmsg_flags = 0;

    memcpy(NLMSG_DATA(nlh), rule, sizeof(KernelRule));

    struct iovec siov = { .iov_base = (void *)nlh, .iov_len = nlh->nlmsg_len };
    struct msghdr smsg = {
        .msg_name = (void *)&dest_addr,
        .msg_namelen = sizeof(dest_addr),
        .msg_iov = &siov,
        .msg_iovlen = 1
    };

    printf("[NETLINK] Sending rule to kernel: cmd=%c, type=%c\n", rule->cmd, rule->rule_type);
    if (sendmsg(sock_fd, &smsg, 0) < 0) {
        perror("sendmsg");
        free(nlh);
        close(sock_fd);
        return -1;
    }

    char rbuf[256] = {0};
    struct sockaddr_nl raddr;
    struct iovec riov = { .iov_base = rbuf, .iov_len = sizeof(rbuf) };
    struct msghdr rmsg = {
        .msg_name = &raddr,
        .msg_namelen = sizeof(raddr),
        .msg_iov = &riov,
        .msg_iovlen = 1
    };

    int n = recvmsg(sock_fd, &rmsg, 0);
    if (n < 0) {
        perror("recvmsg");
        printf("[NETLINK ERROR!] No acknowledgment from kernel\n");
    } else {
        struct nlmsghdr *in = (struct nlmsghdr *)rbuf;
        int pay = NLMSG_PAYLOAD(in, 0);  
        if (pay < 0) pay = 0;
        printf("[NETLINK] Kernel acknowledged: %.*s\n", pay, (char*)NLMSG_DATA(in));
    }

    close(sock_fd);
    free(nlh);
    return 0;
}


uint32_t ip_to_int(const char *ip) {
    struct in_addr addr;
    inet_aton(ip, &addr);
    return addr.s_addr;
}

void free_rule(IPRule *rule) {
    if (!rule) return;
    for (int i = 0; i < rule->count; i++) {
        free(rule->values[i]);
    }
    free(rule->values);
    free(rule->type);
    free(rule->mode);
}

bool parse_rule(const char *json_str, IPRule *rule) {
    cJSON *json = cJSON_Parse(json_str);
    if (!json) {
        printf("[ERROR] Invalid JSON\n");
        return false;
    }
    
    cJSON *type = cJSON_GetObjectItem(json, "type");
    if (type && cJSON_IsString(type)) {
        rule->type = strdup(type->valuestring);
    }
    
    cJSON *mode = cJSON_GetObjectItem(json, "mode");
    if (mode && cJSON_IsString(mode)) {
        rule->mode = strdup(mode->valuestring);
    }
    
    cJSON *values = cJSON_GetObjectItem(json, "values");
    if (values && cJSON_IsArray(values)) {
        rule->count = cJSON_GetArraySize(values);
        rule->values = (char**)malloc(rule->count * sizeof(char*));
        
        for (int i = 0; i < rule->count; i++) {
            cJSON *ip = cJSON_GetArrayItem(values, i);
            if (cJSON_IsString(ip)) {
                rule->values[i] = strdup(ip->valuestring);
            }
        }
    }
    
    cJSON_Delete(json);
    return true;
}

// Temporary function to "primitively" print the rule content
void print_rule(const IPRule *rule) {
    printf("Type: %-29s \n", rule->type);
    printf("Mode: %-29s \n", rule->mode);
    printf("IPs:  %-29d \n", rule->count);
    
    for (int i = 0; i < rule->count && i < 5; i++) {
        printf("%d %-31s \n", i+1, rule->values[i]);
    }
}

void send_rules_to_kernel(const IPRule *rule) {
    KernelRule kernel_rule;
    
    char rule_type = 'S'; 
    if (strcmp(rule->mode, "blacklist") == 0) {
        kernel_rule.cmd = 'A'; 
    } else {
        kernel_rule.cmd = 'W';
        return;
    }
    
    for (int i = 0; i < rule->count; i++) {
        kernel_rule.rule_type = rule_type;
        kernel_rule.ip_addr = ip_to_int(rule->values[i]);
        kernel_rule.port = 0;
        send_to_kernel(&kernel_rule);
    }
}

void handle_new_rule(const char *json_data) {
    IPRule rule = {0};
    
    printf("\n[POLICY_CLIENT] Received new rule\n"); //primitive print
    
    if (parse_rule(json_data, &rule)) {
        print_rule(&rule);
        send_rules_to_kernel(&rule);
        free_rule(&rule);
        printf("\n[SUCCESS] Rule processed and sent to kernel\n"); //primitive print
    }
    else {
        printf("[ERROR] Failed to process rule\n");
    }
}

void start_server() {
    int server_fd, client_fd;
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    char buffer[MAX_PAYLOAD] = {0};
    
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("Socket failed");
        exit(1);
    }
    
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(9999);
    
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("Bind failed");
        exit(1);
    }
    
    if (listen(server_fd, 3) < 0) {
        perror("Listen failed");
        exit(1);
    }
    
    while (1) {
        client_fd = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen);
        
        if (client_fd < 0) {
            perror("Accept failed");
            continue;
        }
        
        memset(buffer, 0, sizeof(buffer));
        int bytes_read = read(client_fd, buffer, sizeof(buffer));
        
        if (bytes_read > 0) {            
            char *json_start = strstr(buffer, "{");
            if (json_start) {
                handle_new_rule(json_start);
            }
        }
        
        const char *response = "OK\n";
        send(client_fd, response, strlen(response), 0);
        close(client_fd);
    }
}

int main(int argc, char *argv[]) {
    if (argc > 1) {
        handle_new_rule(argv[1]);
        return 0;
    }

    start_server();
    return 0;
}
