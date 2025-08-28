#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <linux/skbuff.h>
#include <linux/inet.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Re'em Hoisman");
MODULE_DESCRIPTION("Netfilter Kernel Module for blocking packets by IP/Port");

#define MAX_RULES 2000

static uint32_t blocked_src_ips[MAX_RULES] = { htonl(0x07070707) };
static int src_ips_num = 1;

static uint32_t blocked_dest_ips[MAX_RULES] = { htonl(0x08080808) };
static int dest_ips_num = 1;

static uint16_t blocked_src_ports[MAX_RULES] = { htons(8080), htons(1234) };
static int src_port_num = 2;

static uint16_t blocked_dest_ports[MAX_RULES] = { htons(444) };
static int dest_port_num = 1;

static bool is_blocked_ip(uint32_t addr, const uint32_t *tbl, int n)
{
    int i;
    for (i = 0; i < n; i++)
        if (addr == tbl[i]) return true;
    return false;
}

static bool is_blocked_port(uint16_t port, const uint16_t *tbl, int n)
{
    int i;
    for (i = 0; i < n; i++)
        if (port == tbl[i]) return true;
    return false;
}

static unsigned int packet__ip_hook(void *priv, struct sk_buff *skb,
                                    const struct nf_hook_state *state)
{
    const struct iphdr *ip_header;

    if (!skb) return NF_ACCEPT;
    ip_header = ip_hdr(skb);
    if (!ip_header) return NF_ACCEPT;

    if (is_blocked_ip(ip_header->saddr, blocked_src_ips, src_ips_num)) {
        printk(KERN_INFO "Blocked: source IP %pI4\n", &ip_header->saddr);
        return NF_DROP;
    }

    if (is_blocked_ip(ip_header->daddr, blocked_dest_ips, dest_ips_num)) {
        printk(KERN_INFO "Blocked: dest IP %pI4\n", &ip_header->daddr);
        return NF_DROP;
    }

    return NF_ACCEPT;
}

static unsigned int packet_port_hook(void *priv, struct sk_buff *skb,
                                     const struct nf_hook_state *state)
{
    const struct iphdr *ip_header;

    if (!skb) return NF_ACCEPT;
    ip_header = ip_hdr(skb);
    if (!ip_header) return NF_ACCEPT;

    if (ip_header->protocol == IPPROTO_TCP) {
        struct tcphdr *tcph = tcp_hdr(skb);
        if (!tcph) return NF_ACCEPT;

        if (is_blocked_port(tcph->source, blocked_src_ports, src_port_num)) {
            printk(KERN_INFO "Blocked: source TCP port %u\n", ntohs(tcph->source));
            return NF_DROP;
        }
        if (is_blocked_port(tcph->dest, blocked_dest_ports, dest_port_num)) {
            printk(KERN_INFO "Blocked: dest TCP port %u\n", ntohs(tcph->dest));
            return NF_DROP;
        }

    } else if (ip_header->protocol == IPPROTO_UDP) {
        struct udphdr *udph = udp_hdr(skb);
        if (!udph) return NF_ACCEPT;

        if (is_blocked_port(udph->source, blocked_src_ports, src_port_num)) {
            printk(KERN_INFO "Blocked: source UDP port %u\n", ntohs(udph->source));
            return NF_DROP;
        }
        if (is_blocked_port(udph->dest, blocked_dest_ports, dest_port_num)) {
            printk(KERN_INFO "Blocked: dest UDP port %u\n", ntohs(udph->dest));
            return NF_DROP;
        }
    }

    return NF_ACCEPT;
}

static struct nf_hook_ops nfho_src_ip = {
    .hook     = packet__ip_hook,
    .pf       = PF_INET,
    .hooknum  = NF_INET_PRE_ROUTING,
    .priority = NF_IP_PRI_FIRST,
};

static struct nf_hook_ops nfho_dest_ip = {
    .hook     = packet__ip_hook,
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

static int __init my_netfilter_init(void)
{
    nf_register_net_hook(&init_net, &nfho_src_ip);
    nf_register_net_hook(&init_net, &nfho_dest_ip);
    nf_register_net_hook(&init_net, &nfho_src_port);
    nf_register_net_hook(&init_net, &nfho_dest_port);

    printk(KERN_INFO "Netfilter Module: Loaded. 4 hooks registered.\n");
    return 0;
}

static void __exit my_netfilter_exit(void)
{
    nf_unregister_net_hook(&init_net, &nfho_src_ip);
    nf_unregister_net_hook(&init_net, &nfho_dest_ip);
    nf_unregister_net_hook(&init_net, &nfho_src_port);
    nf_unregister_net_hook(&init_net, &nfho_dest_port);

    printk(KERN_INFO "Netfilter Module: Unloaded. Hooks unregistered.\n");
}

module_init(my_netfilter_init);
module_exit(my_netfilter_exit);
