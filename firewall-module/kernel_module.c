#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <linux/skbuff.h>
#include <linux/inet.h>
#include <net/sock.h>
#include <linux/netlink.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Re'em Hoisman");
MODULE_DESCRIPTION("Netfilter Kernel Module with Netlink support");

#define MAX_RULES 2000
#define NETLINK_USER 31

typedef struct {
    char cmd;           
    char rule_type;     
    uint32_t ip_addr;   
    uint16_t port;      
} KernelRule;

static unsigned int packet_ip_hook(void *priv, struct sk_buff *skb,
                                   const struct nf_hook_state *state);
static unsigned int packet_port_hook(void *priv, struct sk_buff *skb,
                                     const struct nf_hook_state *state);

static struct nf_hook_ops nfho_src_ip = {
    .hook     = packet_ip_hook,
    .pf       = PF_INET,
    .hooknum  = NF_INET_PRE_ROUTING,
    .priority = NF_IP_PRI_FIRST,
};

static struct nf_hook_ops nfho_dest_ip = {
    .hook     = packet_ip_hook,
    .pf       = PF_INET,
    .hooknum  = NF_INET_POST_ROUTING,
    .priority = NF_IP_PRI_FIRST,
};

static struct nf_hook_ops nfho_src_port = {
    .hook     = packet_port_hook,
    .pf       = PF_INET,
    .hooknum  = NF_INET_PRE_ROUTING,
    .priority = NF_IP_PRI_FIRST,
};

static struct nf_hook_ops nfho_dest_port = {
    .hook     = packet_port_hook,
    .pf       = PF_INET,
    .hooknum  = NF_INET_POST_ROUTING,
    .priority = NF_IP_PRI_FIRST,
};

static struct sock *nl_sk = NULL;

static uint32_t blocked_src_ips[MAX_RULES] = {0};
static int src_ips_num = 0;

static uint32_t blocked_dest_ips[MAX_RULES] = {0};
static int dest_ips_num = 0;

static uint16_t blocked_src_ports[MAX_RULES] = {0};
static int src_port_num = 0;

static uint16_t blocked_dest_ports[MAX_RULES] = {0};
static int dest_port_num = 0;


static bool is_blocked_ip(uint32_t addr, const uint32_t *tbl, int n){
    int i;
    for (i = 0; i < n; i++)
        if (addr == tbl[i]) return true;
    return false;
}

static bool is_blocked_port(uint16_t port, const uint16_t *tbl, int n){
    int i;
    for (i = 0; i < n; i++)
        if (port == tbl[i]) return true;
    return false;
}

static unsigned int packet_ip_hook(void *priv, struct sk_buff *skb, const struct nf_hook_state *state){
    const struct iphdr *ip_header;

    if (!skb) return NF_ACCEPT;
    ip_header = ip_hdr(skb);
    if (!ip_header) return NF_ACCEPT;

    if (is_blocked_ip(ip_header->saddr, blocked_src_ips, src_ips_num)) {
        printk(KERN_INFO "[FIREWALL] Blocked source IP: %pI4\n", &ip_header->saddr);
        return NF_DROP;
    }

    if (is_blocked_ip(ip_header->daddr, blocked_dest_ips, dest_ips_num)) {
        printk(KERN_INFO "[FIREWALL] Blocked dest IP: %pI4\n", &ip_header->daddr);
        return NF_DROP;
    }

    return NF_ACCEPT;
}

static unsigned int packet_port_hook(void *priv, struct sk_buff *skb, const struct nf_hook_state *state){
    const struct iphdr *ip_header;

    if (!skb) return NF_ACCEPT;
    ip_header = ip_hdr(skb);
    if (!ip_header) return NF_ACCEPT;

    if (ip_header->protocol == IPPROTO_TCP) {
        struct tcphdr *tcph = tcp_hdr(skb);
        if (!tcph) return NF_ACCEPT;

        {
            uint16_t sport = ntohs(tcph->source);
            uint16_t dport = ntohs(tcph->dest);

            if (is_blocked_port(sport, blocked_src_ports, src_port_num)) {
                printk(KERN_INFO "[FIREWALL] Blocked source TCP port: %u\n", sport);
                return NF_DROP;
            }
            if (is_blocked_port(dport, blocked_dest_ports, dest_port_num)) {
                printk(KERN_INFO "[FIREWALL] Blocked dest TCP port: %u\n", dport);
                return NF_DROP;
            }
        }
    }
    else if (ip_header->protocol == IPPROTO_UDP) {
        struct udphdr *udph = udp_hdr(skb);
        if (!udph) return NF_ACCEPT;

        {
            uint16_t sport = ntohs(udph->source);
            uint16_t dport = ntohs(udph->dest);

            if (is_blocked_port(sport, blocked_src_ports, src_port_num)) {
                printk(KERN_INFO "[FIREWALL] Blocked source UDP port: %u\n", sport);
                return NF_DROP;
            }
            if (is_blocked_port(dport, blocked_dest_ports, dest_port_num)) {
                printk(KERN_INFO "[FIREWALL] Blocked dest UDP port: %u\n", dport);
                return NF_DROP;
            }
        }
    }

    return NF_ACCEPT;
}

static void netlink_recv_msg(struct sk_buff *skb){
    struct nlmsghdr *nlh;
    struct sk_buff *skb_out;
    KernelRule *rule;
    KernelRule local_rule;
    char response[] = "Rule received";
    int pid, res;

    nlh = nlmsg_hdr(skb);
    if (nlmsg_len(nlh) < sizeof(local_rule)) {
        printk(KERN_ERR "[NETLINK] payload too small: %u\n", nlmsg_len(nlh));
        return;
    }

    memcpy(&local_rule, nlmsg_data(nlh), sizeof(local_rule));
    rule = &local_rule;

    pid = NETLINK_CB(skb).portid;

    printk(KERN_INFO "[NETLINK] received rule: cmd=%c, type=%c\n", rule->cmd, rule->rule_type);
    
    if (rule->cmd == 'A') { 
        if (rule->rule_type == 'S' && src_ips_num < MAX_RULES) {
            blocked_src_ips[src_ips_num++] = rule->ip_addr;
            printk(KERN_INFO "[RULE] added source IP to blacklist: %pI4 (total: %d)\n", 
                   &rule->ip_addr, src_ips_num);
        }
        else if (rule->rule_type == 'D' && dest_ips_num < MAX_RULES) {
            blocked_dest_ips[dest_ips_num++] = rule->ip_addr;
            printk(KERN_INFO "[RULE] added dest IP to blacklist: %pI4 (total: %d)\n", 
                   &rule->ip_addr, dest_ips_num);
        }
        else if (rule->rule_type == 'P') {
            if (rule->port && src_port_num < MAX_RULES) {
                blocked_src_ports[src_port_num++] = rule->port;
                printk(KERN_INFO "[RULE] added port to blacklist: %u\n", ntohs(rule->port));
            }
        }
    }
    else if (rule->cmd == 'D') { 
        printk(KERN_INFO "[RULE] delete not implemented yet\n");
    }
    else if (rule->cmd == 'C') { 
        if (rule->rule_type == 'S') {
            src_ips_num = 0;
            printk(KERN_INFO "[RULE] cleared source IP blacklist\n");
        }
        else if (rule->rule_type == 'D') {
            dest_ips_num = 0;
            printk(KERN_INFO "[RULE] cleared dest IP blacklist\n");
        }
        else if (rule->rule_type == 'P') {
            src_port_num = 0;
            dest_port_num = 0;
            printk(KERN_INFO "[RULE] cleared port blacklists\n");
        }
    }
    
    skb_out = nlmsg_new(strlen(response), 0);
    if (!skb_out) {
        printk(KERN_ERR "[NETLINK] failed to allocate new skb (for response)\n");
        return;
    }
    
    nlh = nlmsg_put(skb_out, 0, 0, NLMSG_DONE, strlen(response), 0);
    NETLINK_CB(skb_out).dst_group = 0;
    strncpy(nlmsg_data(nlh), response, strlen(response));
    
    res = nlmsg_unicast(nl_sk, skb_out, pid);
    if (res < 0)
        printk(KERN_INFO "[NETLINK] error sending response to user\n");
}

static struct netlink_kernel_cfg cfg = {
    .input = netlink_recv_msg,
};

static int __init my_netfilter_init(void){
    printk(KERN_INFO "[MODULE] Initializing Netfilter Module...\n");
    
    nl_sk = netlink_kernel_create(&init_net, NETLINK_USER, &cfg);
    if (!nl_sk) {
        printk(KERN_INFO "[ERROR] create netlink socket failed\n");
        return -ENOMEM;
    }
    printk(KERN_INFO "[NETLINK] netlink socket connection created\n");
    
    nf_register_net_hook(&init_net, &nfho_src_ip);
    nf_register_net_hook(&init_net, &nfho_dest_ip);
    nf_register_net_hook(&init_net, &nfho_src_port);
    nf_register_net_hook(&init_net, &nfho_dest_port);
    
    printk(KERN_INFO "[HOOKS] 4 netfilter hooks registered\n");    
    return 0;
}

static void __exit my_netfilter_exit(void){
    printk(KERN_INFO "\n[MODULE] cleaning up netfilter module...\n");
    
    if (nl_sk) {
        netlink_kernel_release(nl_sk);
        printk(KERN_INFO "[NETLINK] socket released\n");
    }
    
    nf_unregister_net_hook(&init_net, &nfho_src_ip);
    nf_unregister_net_hook(&init_net, &nfho_dest_ip);
    nf_unregister_net_hook(&init_net, &nfho_src_port);
    nf_unregister_net_hook(&init_net, &nfho_dest_port);
    
    printk(KERN_INFO "[HOOKS] Netfilter hooks unregistered\n");
    printk(KERN_INFO "[MODULE] Unloaded\n");
}

module_init(my_netfilter_init);
module_exit(my_netfilter_exit);
