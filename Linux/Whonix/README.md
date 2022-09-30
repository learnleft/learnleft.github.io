## 如果看到“确定‘libvirtd' 守护进程正在运行”的字眼
请使用`chmod 777 /var/run/libvirt/libvirt-sock`



## 怎么用qemu+libvirt安装whonix
[去这里下镜像](https://www.whonix.org/wiki/KVM)
把镜像移动到/opt中 `mv whonix.xz /opt` （假设名字叫whonix.xz）
解压`tar -xvf Whonix.xz`（解压完后gateway和workstation都是100多G,但是我的linux硬盘没有这么大，但又解压成功了会不会出bug了？这不是bug哦，这是一项较新的技术，所以只能用指令来操作。）

`nano Whonix-Gateway*.xml`
`nano Whonix-Workstation*.xml`
要改，有 
```
<source file=' 
```
  
这行，把里面的路径改成/opt/Whonix-Workstation-XFCE-16.0.3.qcow2
**gateway对应gateway,不要搞混了。Workstation也一样**，下面就是个例子。
```
<source file='/opt/Whonix-Workstation-XFCE-16.0.3.qcow2'/>
```



之后在终端中按顺序输入一下命令

`sudo virsh -c qemu:///system net-define Whonix_external*.xml`

`sudo virsh -c qemu:///system net-define Whonix_internal*.xml`

`sudo virsh -c qemu:///system net-autostart Whonix-External`

`sudo virsh -c qemu:///system net-start Whonix-External`

`sudo virsh -c qemu:///system net-autostart Whonix-Internal`

`sudo virsh -c qemu:///system net-start Whonix-Internal`

`brctl show` 看有没有virbr0、virbr1、virbr2,如果没有，重复后面四个命令。

`sudo virsh -c qemu:///system define Whonix-Gateway*.xml`

`sudo virsh -c qemu:///system define Whonix-Workstation*.xml` 这两个命令是告诉kvm虚拟机你的镜像位置在哪，如果你在这之后又修改文件位置，那么不仅要用nano修改xml文件，还要再次输入这两个命令，虚拟机才知道你换了位置。


## 为什么要把镜像移动到opt文件夹？
避免报错。

## 为什么我的gateway是命令行的界面呢？
还不是因为你太小气了，但凡多给点内存也不至于变成这样！具体的位置在编辑
、虚拟机详细找到第二行的第二个点它就可以增加内存了（我设置的是1024MB）

##基础操作（先连好迷雾通打开监听所有网络接口）
```
先进入gateway
点击“Understood/Verstanden”，然后再点击“Next”。
点finish
点Configure
在“I need Tor bridges to bypass the Tor censorship”前面打勾，选择“Connect with provided bridges”，再点击“Next”。（网桥选obsf4）
Use proxy before connecting to the Tor network前面打勾，
`ifconfig`把你网卡的ip地址写好 （迷雾通的http端口为9910,socks5为9909）
再进入workstation
点击“Understood/Verstanden”，然后再点击“Next”。
在浏览器上打开check.torproject.org，验证Tor连接。如果出现绿色的洋葱，就说明已经连接Tor成功。

我重启之后ip地址会变，进去gateway系统后还可以再次修改代理的配置文件吗？
可以，名字叫tor-control-panel 点configure就可以改了


```



## 在workstation开启hidpi
appearance、fonts、Custom DPI setting 默认是96 我是开1.5倍的缩放所以就是96乘以1.5=144。

## 在workstation开启共享剪贴板
警告：SPICE 允许加速图形和剪贴板共享。 出于安全原因，剪贴板默认禁用：
**防止将匿名访问的网站的链接意外复制到非匿名主机浏览器（反之亦然）。
阻止 Whonix ™ Workstation 中的恶意软件窃取剪贴板中的敏感信息。**


`nano /etc/libvirt/qemu/Whonix-Workstation.xml`

```
 <clipboard copypaste='no'/> 改为yes就行
```
`virsh`
`define /etc/libvirt/qemu/Whonix-Workstation.xml`重启就可以了。

#### 3.1.1.6在workstation开启共享文件夹
警告：删除共享文件夹中的文件会将它们移动到名为 .Trash-1000 的隐藏子目录中。 确保在主机上显示并及时将其删除，以避免不同 VM 会话之间的数据泄漏。

`mkdir /opt/shared` 

添加硬件→文件系统→（驱动程序选virtio-9p、源路径为`/opt/shared`  目标路径为shared）
模式选择为：mapped 点xml就可以看到
在workstation里的共享文件夹的路径在`/mnt/shared`


## 安装中文字符
`sudo apt-get update`(默认密码changeme)

`sudo apt-get install fonts-arphic-gbsn00lp fonts-arphic-bsmi00lp fonts-arphic-uming fonts-wqy-zenhei xfonts-intl-chinese xfonts-intl-chinese-big`     


## 安装中文输入法：
`sudo apt install fcitx5-chinese-addons fcitx5` (记得重启)
重启之后，打开fcitx5 configuration 把Pinyin移动过来就可以打中文。（快捷键为ctrl+空格）

## 我下载了一个软件，它能自动连上gateway的代理吗？
如果软件可以设置代理就把它设置为`127.0.0.1：9050`（socks5端口）
没有设置代理的地方，就用终端打开它。（不要用root用户）

我在多说几句，敏感操作请不要使用主机上的tor browser 请在whonix里的workstation完成。请不要开启硬件直通。

## 怎么使用gateway来使用三重代理呢？（vpn-tor-vpn）
首先下载另一个linux系统（我选择的parrot os，好处是自带火狐）
打开kvm,选择导入现有磁盘映像，选择你下载镜像的路径，安装的操作系统（你所下载的linux系统基于哪个就选哪个，我选的是debian11），在安装前自定义配置打勾，选择网络为“虚拟网络‘whonix-internal‘：隔离的网络”然后在弹出的界面选择添加硬件，直接点完成。之后就是安装了，安装完成之后记得把引导盘删掉。
`ifconfig` 只有两个一个是lo,还有一个就是你网卡的名字。

`nano /etc/network/interfaces`

```
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

# The loopback network interface, leave as it is
auto lo
iface lo inet loopback

auto eth0
#iface eth0 inet dhcp
iface eth0 inet static
# increment last octet of IP address on additional workstations
       address 10.152.152.12
       netmask 255.255.192.0
       #network 10.152.152.0
       #broadcast 10.152.152.255
       gateway 10.152.152.10
	   
```
把eth0换成你网卡的名字 #后面是注释，系统不会读它的。




`nano /etc/resolv.conf`
把里面的东西全删掉然后添加
`nameserver 10.152.152.10` 重启
之后就是进入火狐了，首先看有没有连上tor
`https://check.torproject.org/`
连上之后就去火狐的官方扩展商店去下vpn我下的是叫Touch VPN 连上后再次打开
`https://check.torproject.org/`发现“没连上”tor那就可以了。
进gateway 打开tor-control-panel 点stop tor 发现parrot os中的火狐没网，过一会点restart tor 欸，火狐又有网了，那就没问题。


## 开启多个workstation
> 警告：每个额外的 Whonix-Workstation ™ VM 必须有自己的 MAC 地址和内部 LAN IP 地址。

KVM：右键原来的workstation就可以看到克隆。

 kvm可以实现mac地址的自动分配
 
 `nano /etc/libvirt/qemu/Whonix-Workstation.xml`
 默认的名字是`Whonix-Internal` 把它改为`Whonix-Internal1`如果你要开启多个那就照着葫芦画瓢改为`Whonix-Internal2` 、`Whonix-Internal3`
 
 `virsh`
 
 `define /etc/libvirt/qemu/Whonix-Workstation-clone.xml`
 
 修改新克隆的workstation配置文件，把网卡改成隔离的网络，再进入新的workstation打开终端输入：
 
 `sudoedit /etc/network/interfaces.d/30_non-qubes-whonix`
 
把`address 10.152.152.11` 改为`address 10.152.152.12`

`reboot`

## 使用qemu来打开whonix[原链接](https://solveforum.com/forums/threads/how-to-manually-setup-whonix-networks-for-qemu.92695/)

~~~
ip link add virbr1 type bridge
ip link set virbr1 type bridge stp_state 1
ip link set virbr1 up
ip tuntap add dev vnet0 mode tap user ttt #ttt改为你的用户名
ip link set vnet0 master virbr1
ip link set vnet0 up
ip link add virbr2 type bridge
ip link set virbr2 type bridge stp_state 1
ip link set virbr2 up
ip tuntap add dev vnet1 mode tap user ttt #同理
ip link set vnet1 master virbr2
ip link set vnet1 up
ip tuntap add dev vnet2 mode tap user ttt #同理
ip link set vnet2 master virbr2
ip link set vnet2 up

~~~


增加iptables规则
~~~
iptables -N WHONIX_FORWARD
iptables -A WHONIX_FORWARD -s 10.0.2.0/24 -j ACCEPT -i virbr1
iptables -A WHONIX_FORWARD -d 10.0.2.0/24 -j ACCEPT -o virbr1 -m state --state RELATED,ESTABLISHED
iptables -A FORWARD -j WHONIX_FORWARD
iptables -t nat -N WHONIX_POSTROUTING
iptables -t nat -A WHONIX_POSTROUTING -s 10.0.2.0/24 ! -d 10.0.2.0/24 -j MASQUERADE
iptables -t nat -A POSTROUTING -j WHONIX_POSTROUTING
sysctl -wq net.ipv4.ip_forward=1

~~~

开启gateway
`qemu-system-x86_64 -hda Whonix-Gateway-XFCE-16.0.5.3.Intel_AMD64.qcow2 -m 1024 -enable-kvm -device virtio-net-pci,id=net0,netdev=hostnet0,bus=pci.0,addr=0x5,mac=MAC -netdev tap,id=hostnet0,ifname=vnet0,script=no,downscript=no -device virtio-net-pci,id=net1,netdev=hostnet1,bus=pci.0,addr=0x6,mac=MAC -netdev tap,id=hostnet1,ifname=vnet1,script=no,downscript=no`

开启workstation
`qemu-system-x86_64 -hda Whonix-Workstation-XFCE-16.0.3.7.Intel_AMD64-clone.qcow2 -m 3000 -device virtio-net-pci,id=net0,netdev=hostnet0,bus=pci.0,addr=0x5,mac=MAC -netdev tap,id=hostnet0,ifname=vnet2,script=no,downscript=no -enable-kvm`

记得修改mac地址，mac地址可以胡乱的配置，但是要遵循mac地址的协议。

Quickgui 是一个简单的QEMU GUI，具有VirtualBox的风格，用于在一个环境中快速创建和管理虚拟机，如果您是新手，可以试试这个。

▫️运行不需要提升权限
▫️默认情况下，主机/访客剪贴板共享
▫️支持USB设备从主机/访客到虚拟机的切换
▫️支持网络端口重定向
以及更多...
[下载地址](https://github.com/quickemu-project/quickgui)

