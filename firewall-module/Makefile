obj-m += kernel_module.o

all: module userspace

module:
	$(MAKE) -C /lib/modules/$(shell uname -r)/build M=$(CURDIR) modules

userspace:
	gcc -Wall -Wextra -O2 -g policy_client.c -o policy_client -lcjson

clean:
	$(MAKE) -C /lib/modules/$(shell uname -r)/build M=$(CURDIR) clean
	rm -f policy_client
