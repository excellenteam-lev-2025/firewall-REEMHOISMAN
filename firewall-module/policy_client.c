#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "cjson/cJSON.h"

// מבנה חוק IP list
typedef struct {
    char **values;     // מערך של IP addresses
    int count;         // כמות IPs
    char *type;        // "ip"
    char *mode;        // "blacklist" או "whitelist"
} IPRule;

// שחרור זיכרון
void free_rule(IPRule *rule) {
    if (!rule) return;
    
    for (int i = 0; i < rule->count; i++) {
        free(rule->values[i]);
    }
    free(rule->values);
    free(rule->type);
    free(rule->mode);
}

// פרסור JSON לחוק
bool parse_rule(const char *json_str, IPRule *rule) {
    cJSON *json = cJSON_Parse(json_str);
    if (!json) {
        printf("[ERROR] Invalid JSON\n");
        return false;
    }
    
    // פרסור type
    cJSON *type = cJSON_GetObjectItem(json, "type");
    if (type && cJSON_IsString(type)) {
        rule->type = strdup(type->valuestring);
    }
    
    // פרסור mode
    cJSON *mode = cJSON_GetObjectItem(json, "mode");
    if (mode && cJSON_IsString(mode)) {
        rule->mode = strdup(mode->valuestring);
    }
    
    // פרסור values (מערך IP-ים)
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

// הדפסת חוק
void print_rule(const IPRule *rule) {
    printf("\n╔════════════════════════════════════════════╗\n");
    printf("║           NEW RULE FROM BACKEND            ║\n");
    printf("╠════════════════════════════════════════════╣\n");
    printf("║ Type: %-37s ║\n", rule->type);
    printf("║ Mode: %-37s ║\n", rule->mode);
    printf("║ Total IPs: %-32d ║\n", rule->count);
    printf("╠════════════════════════════════════════════╣\n");
    printf("║                IP LIST                     ║\n");
    printf("╠════════════════════════════════════════════╣\n");
    
    for (int i = 0; i < rule->count; i++) {
        printf("║ [%3d] %-37s ║\n", i+1, rule->values[i]);
    }
    
    printf("╚════════════════════════════════════════════╝\n");
    
    // סיכום
    if (strcmp(rule->mode, "blacklist") == 0) {
        printf("\n⚠️  BLACKLIST: These %d IPs will be BLOCKED\n", rule->count);
    } else {
        printf("\n✅ WHITELIST: Only these %d IPs will be ALLOWED\n", rule->count);
    }
}

// טיפול בחוק חדש
void handle_new_rule(const char *json_data) {
    IPRule rule = {0};
    
    printf("\n[BACKEND] Received new IP rule\n");
    
    if (parse_rule(json_data, &rule)) {
        print_rule(&rule);
        
        // כאן אפשר להוסיף לוגיקה נוספת
        // למשל: שמירה לקובץ, עדכון iptables, וכו'
        
        free_rule(&rule);
        printf("\n[SUCCESS] Rule processed successfully\n");
    } else {
        printf("[ERROR] Failed to process rule\n");
    }
}

// Server שמאזין לחיבורים
void start_server() {
    int server_fd, client_fd;
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    char buffer[8192] = {0};
    
    // יצירת socket
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("Socket failed");
        exit(1);
    }
    
    // הגדרות
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(9999);
    
    // Bind
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("Bind failed");
        exit(1);
    }
    
    // Listen
    if (listen(server_fd, 3) < 0) {
        perror("Listen failed");
        exit(1);
    }
    
    printf("[SERVER] Listening on port 9999...\n");
    printf("════════════════════════════════════\n");
    
    // לולאה אינסופית - ממתין לחיבורים
    while (1) {
        client_fd = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen);
        
        if (client_fd < 0) {
            perror("Accept failed");
            continue;
        }
        
        // קריאת נתונים
        memset(buffer, 0, sizeof(buffer));
        int bytes_read = read(client_fd, buffer, sizeof(buffer));
        
        if (bytes_read > 0) {
            printf("\n[CONNECTION] Received %d bytes\n", bytes_read);
            
            // חיפוש תחילת ה-JSON
            char *json_start = strstr(buffer, "{");
            if (json_start) {
                handle_new_rule(json_start);
            }
        }
        
        // שליחת אישור
        const char *response = "OK\n";
        send(client_fd, response, strlen(response), 0);
        
        close(client_fd);
    }
}

int main(int argc, char *argv[]) {
    // אם יש ארגומנט - חד פעמי
    if (argc > 1) {
        handle_new_rule(argv[1]);
        return 0;
    }
    
    // אחרת - הפעל server
    printf("╔════════════════════════════════════╗\n");
    printf("║     FIREWALL RULE HANDLER - C      ║\n");
    printf("╚════════════════════════════════════╝\n\n");
    
    start_server();
    return 0;
}