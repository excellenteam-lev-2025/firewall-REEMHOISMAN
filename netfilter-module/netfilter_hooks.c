#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/netfilter.h>   
#include <linux/ip.h>      
#include <linux/tcp.h>
#include <linux/udp.h>          
#include <linux/netfilter_ipv4.h>                

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Re'em Hoisman");
MODULE_DESCRIPTION("Netfilter Kernel Module for blocking packets by IP address");

static unsigned int blocked_src_ips[] = {0x7F000001};
static int blocked_src_ips_size = 1;

static unsigned int blocked_dest_ips[] = {0x08080808};
static int blocked_dest_ips_size = 1;

static unsigned int blocked_src_ports[] = {8080, 1234};
static int blocked_src_ports_size = 2;

static unsigned int blocked_dest_ports[] = {443};
static int blocked_dest_ports_size = 1;

static unsigned int packet_hook(void *priv, struct sk_buff *skb,
                                const struct nf_hook_state *state){
    if (!skb) return NF_ACCEPT;
   
    const struct iphdr *ip_header;

    ip_header = ip_hdr(skb);

    if (!ip_header) return NF_ACCEPT;

    for (int i = 0; i < blocked_src_ips_size; i++) {
        if (ip_header->saddr == htonl(blocked_src_ips[i])) {
            printk(KERN_INFO "The source IP %pI4 is blocked\n", &ip_header->saddr);
            return NF_DROP;
        }
    }

    for (int i = 0; i < blocked_dest_ips_size; i++) {
        if (ip_header->daddr == htonl(blocked_dest_ips[i])) {
            printk(KERN_INFO "The dest IP %pI4 is blocked\n", &ip_header->daddr);
            return NF_DROP;
        }
    }

    if (ip_header->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp_header = tcp_hdr(skb);
        if (!tcp_header) return NF_ACCEPT;

        for (int i = 0; i < blocked_src_ports_size; i++) {
            if (ntohs(tcp_header->source) == blocked_src_ports[i]) {
                printk(KERN_INFO "TCP, The source port %u is blocked\n", ntohs(tcp_header->source));
                return NF_DROP;
            }
        }

        for (int i = 0; i < blocked_dest_ports_size; i++) {
            if (ntohs(tcp_header->dest) == blocked_dest_ports[i]) {
                printk(KERN_INFO "TCP, The dest port %u is blocked\n", ntohs(tcp_header->dest));
                return NF_DROP;
            }
        }
    }
    
    else if (ip_header->protocol == IPPROTO_UDP) {
        struct udphdr *udp_header = udp_hdr(skb);
        if (!udp_header) return NF_ACCEPT;

        for (int i = 0; i < blocked_src_ports_size; i++) {
            if (ntohs(udp_header->source) == blocked_src_ports[i]) {
                printk(KERN_INFO "UDP, source port %u is blocked\n", ntohs(udp_header->source));
                return NF_DROP;
            }
        }

        for (int i = 0; i < blocked_dest_ports_size; i++) {
            if (ntohs(udp_header->dest) == blocked_dest_ports[i]) {
                printk(KERN_INFO "UDP The dest port %u is blocked\n", ntohs(udp_header->dest));
                return NF_DROP;
            }
        }
    }

    return NF_ACCEPT;
}

static struct nf_hook_ops nfho = {
    .hook = packet_hook,
    .pf = PF_INET,
    .hooknum  = NF_INET_PRE_ROUTING, 
    .priority = NF_IP_PRI_FIRST, 
};

static int __init my_netfilter_init(void){
    nf_register_net_hook(&init_net, &nfho);
    printk(KERN_INFO "Netfilter Module: Loaded and hook registered.\n");
    return 0;
}

static void __exit my_netfilter_exit(void){
    nf_unregister_net_hook(&init_net, &nfho);
    printk(KERN_INFO "Netfilter Module: Unloaded and hook unregistered.\n");
}

module_init(my_netfilter_init);
module_exit(my_netfilter_exit);
