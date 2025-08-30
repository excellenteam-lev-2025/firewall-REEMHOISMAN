#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <linux/skbuff.h>
#include <linux/inet.h>
#include <linux/netlink.h>
#include <net/sock.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Re'em Hoisman");
MODULE_DESCRIPTION("netfilter firewall controlled via netlink");

#define MAX_RULES      2000
#define NETLINK_USER   31

/* netlink message types */
#define NLMSG_RULE_ADD 0x10
#define NLMSG_RULE_DEL 0x11
#define NLMSG_RULE_CLR 0x12

/* payload from userspace */
typedef struct {
    char     rule_type;   /* 'S' = src ip, 'D' = dst ip, 'P' = port */
    uint32_t ip_addr;     /* network byte order */
    uint16_t port;        /* network byte order */
} kernel_rule_t;

/* global tables */
static uint32_t src_ips[MAX_RULES];  int src_ip_count;
static uint32_t dst_ips[MAX_RULES];  int dst_ip_count;
static uint16_t src_ports[MAX_RULES];int src_port_count; /* host order */
static uint16_t dst_ports[MAX_RULES];int dst_port_count; /* host order */

static struct sock *nl_sock;

/* ------------------------------------------------------------
 * helpers: add / delete with logging
 * ------------------------------------------------------------ */

static void add_src_ip(uint32_t ip_nbo) {
    int i;
    for (i=0; i<src_ip_count; i++)
        if (src_ips[i] == ip_nbo) {
            printk(KERN_INFO "[FW] add src ip skipped duplicate: %pI4\n", &ip_nbo);
            return;
        }
    if (src_ip_count >= MAX_RULES) {
        printk(KERN_INFO "[FW] add src ip skipped full: %pI4\n", &ip_nbo);
        return;
    }
    src_ips[src_ip_count++] = ip_nbo;
    printk(KERN_INFO "[FW] add src ip: %pI4 (total %d)\n", &ip_nbo, src_ip_count);
}

static void add_dst_ip(uint32_t ip_nbo) {
    int i;
    for (i=0; i<dst_ip_count; i++)
        if (dst_ips[i] == ip_nbo) {
            printk(KERN_INFO "[FW] add dst ip skipped duplicate: %pI4\n", &ip_nbo);
            return;
        }
    if (dst_ip_count >= MAX_RULES) {
        printk(KERN_INFO "[FW] add dst ip skipped full: %pI4\n", &ip_nbo);
        return;
    }
    dst_ips[dst_ip_count++] = ip_nbo;
    printk(KERN_INFO "[FW] add dst ip: %pI4 (total %d)\n", &ip_nbo, dst_ip_count);
}

static void add_port(uint16_t port_host) {
    int i;
    for (i=0; i<src_port_count; i++)
        if (src_ports[i] == port_host) {
            printk(KERN_INFO "[FW] add port skipped duplicate: %u\n", port_host);
            return;
        }
    if (src_port_count >= MAX_RULES || dst_port_count >= MAX_RULES) {
        printk(KERN_INFO "[FW] add port skipped full: %u\n", port_host);
        return;
    }
    src_ports[src_port_count++] = port_host;
    dst_ports[dst_port_count++] = port_host;
    printk(KERN_INFO "[FW] add port: %u (totals %d/%d)\n",
           port_host, src_port_count, dst_port_count);
}

static void del_src_ip(uint32_t ip_nbo) {
    int i;
    for (i=0; i<src_ip_count; i++) {
        if (src_ips[i] == ip_nbo) {
            src_ips[i] = src_ips[src_ip_count-1];
            src_ip_count--;
            printk(KERN_INFO "[FW] del src ip: %pI4 (total %d)\n", &ip_nbo, src_ip_count);
            return;
        }
    }
    printk(KERN_INFO "[FW] del src ip not found: %pI4\n", &ip_nbo);
}

static void del_dst_ip(uint32_t ip_nbo) {
    int i;
    for (i=0; i<dst_ip_count; i++) {
        if (dst_ips[i] == ip_nbo) {
            dst_ips[i] = dst_ips[dst_ip_count-1];
            dst_ip_count--;
            printk(KERN_INFO "[FW] del dst ip: %pI4 (total %d)\n", &ip_nbo, dst_ip_count);
            return;
        }
    }
    printk(KERN_INFO "[FW] del dst ip not found: %pI4\n", &ip_nbo);
}

static void del_port(uint16_t port_host) {
    int i;
    for (i=0; i<src_port_count; i++) {
        if (src_ports[i] == port_host) {
            src_ports[i] = src_ports[src_port_count-1];
            src_port_count--;
        }
    }
    for (i=0; i<dst_port_count; i++) {
        if (dst_ports[i] == port_host) {
            dst_ports[i] = dst_ports[dst_port_count-1];
            dst_port_count--;
        }
    }
    printk(KERN_INFO "[FW] del port: %u (totals %d/%d)\n",
           port_host, src_port_count, dst_port_count);
}

/* ------------------------------------------------------------
 * packet hooks
 * ------------------------------------------------------------ */

static unsigned int hook_ip(void *priv, struct sk_buff *skb,
                            const struct nf_hook_state *state) {
    const struct iphdr *iph = ip_hdr(skb);
    int i;
    if (!iph) return NF_ACCEPT;

    for (i=0; i<src_ip_count; i++)
        if (iph->saddr == src_ips[i]) {
            printk(KERN_INFO "[FW] drop src ip packet: %pI4\n", &iph->saddr);
            return NF_DROP;
        }

    for (i=0; i<dst_ip_count; i++)
        if (iph->daddr == dst_ips[i]) {
            printk(KERN_INFO "[FW] drop dst ip packet: %pI4\n", &iph->daddr);
            return NF_DROP;
        }

    return NF_ACCEPT;
}

static unsigned int hook_port(void *priv, struct sk_buff *skb,
                              const struct nf_hook_state *state) {
    const struct iphdr *iph = ip_hdr(skb);
    if (!iph) return NF_ACCEPT;

    if (iph->protocol == IPPROTO_TCP) {
        const struct tcphdr *th = tcp_hdr(skb);
        if (!th) return NF_ACCEPT;

        uint16_t s = ntohs(th->source);
        uint16_t d = ntohs(th->dest);

        for (int i=0; i<src_port_count; i++)
            if (s == src_ports[i]) {
                printk(KERN_INFO "[FW] drop src tcp port: %u\n", s);
                return NF_DROP;
            }
        for (int i=0; i<dst_port_count; i++)
            if (d == dst_ports[i]) {
                printk(KERN_INFO "[FW] drop dst tcp port: %u\n", d);
                return NF_DROP;
            }
    }

    else if (iph->protocol == IPPROTO_UDP) {
        const struct udphdr *uh = udp_hdr(skb);
        if (!uh) return NF_ACCEPT;

        uint16_t s = ntohs(uh->source);
        uint16_t d = ntohs(uh->dest);

        for (int i=0; i<src_port_count; i++)
            if (s == src_ports[i]) {
                printk(KERN_INFO "[FW] drop src udp port: %u\n", s);
                return NF_DROP;
            }
        for (int i=0; i<dst_port_count; i++)
            if (d == dst_ports[i]) {
                printk(KERN_INFO "[FW] drop dst udp port: %u\n", d);
                return NF_DROP;
            }
    }

    return NF_ACCEPT;
}

/* ------------------------------------------------------------
 * netlink receive
 * ------------------------------------------------------------ */

static void nl_recv(struct sk_buff *skb) {
    struct nlmsghdr *nlh = nlmsg_hdr(skb);
    kernel_rule_t rule;

    if (nlmsg_len(nlh) < sizeof(rule))
        return;

    memcpy(&rule, nlmsg_data(nlh), sizeof(rule));

    switch (nlh->nlmsg_type) {
    case NLMSG_RULE_ADD:
        if (rule.rule_type == 'S')
            add_src_ip(rule.ip_addr);
        else if (rule.rule_type == 'D')
            add_dst_ip(rule.ip_addr);
        else if (rule.rule_type == 'P')
            add_port(ntohs(rule.port));
        break;

    case NLMSG_RULE_DEL:
        if (rule.rule_type == 'S')
            del_src_ip(rule.ip_addr);
        else if (rule.rule_type == 'D')
            del_dst_ip(rule.ip_addr);
        else if (rule.rule_type == 'P')
            del_port(ntohs(rule.port));
        break;

    case NLMSG_RULE_CLR:
        if (rule.rule_type == 'S') {
            src_ip_count = 0;
            printk(KERN_INFO "[FW] clear src ip table\n");
        }
        else if (rule.rule_type == 'D') {
            dst_ip_count = 0;
            printk(KERN_INFO "[FW] clear dst ip table\n");
        }
        else if (rule.rule_type == 'P') {
            src_port_count = 0;
            dst_port_count = 0;
            printk(KERN_INFO "[FW] clear port tables\n");
        }
        break;
    }
}

/* ------------------------------------------------------------
 * module init/exit
 * ------------------------------------------------------------ */

static struct nf_hook_ops hook_src_ip  = { .hook=hook_ip,   .pf=PF_INET, .hooknum=NF_INET_PRE_ROUTING,  .priority=NF_IP_PRI_FIRST };
static struct nf_hook_ops hook_dst_ip  = { .hook=hook_ip,   .pf=PF_INET, .hooknum=NF_INET_POST_ROUTING, .priority=NF_IP_PRI_FIRST };
static struct nf_hook_ops hook_src_prt = { .hook=hook_port, .pf=PF_INET, .hooknum=NF_INET_PRE_ROUTING,  .priority=NF_IP_PRI_FIRST };
static struct nf_hook_ops hook_dst_prt = { .hook=hook_port, .pf=PF_INET, .hooknum=NF_INET_POST_ROUTING, .priority=NF_IP_PRI_FIRST };

static struct netlink_kernel_cfg cfg = { .input = nl_recv };

static int __init fw_init(void) {
    nl_sock = netlink_kernel_create(&init_net, NETLINK_USER, &cfg);
    if (!nl_sock)
        return -ENOMEM;

    nf_register_net_hook(&init_net, &hook_src_ip);
    nf_register_net_hook(&init_net, &hook_dst_ip);
    nf_register_net_hook(&init_net, &hook_src_prt);
    nf_register_net_hook(&init_net, &hook_dst_prt);

    printk(KERN_INFO "[FW] module loaded\n");
    return 0;
}

static void __exit fw_exit(void) {
    nf_unregister_net_hook(&init_net, &hook_src_ip);
    nf_unregister_net_hook(&init_net, &hook_dst_ip);
    nf_unregister_net_hook(&init_net, &hook_src_prt);
    nf_unregister_net_hook(&init_net, &hook_dst_prt);

    if (nl_sock)
        netlink_kernel_release(nl_sock);

    printk(KERN_INFO "[FW] module unloaded\n");
}

module_init(fw_init);
module_exit(fw_exit);
