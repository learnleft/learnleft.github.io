# 建立能够日常使用zfs文件系统和伪全盘加密的Gentoo




## 一.“最小化”系统


### 什么是过度工程化？

过度工程是设计产品或以精细或复杂的方式为问题提供解决方案的行为，其中可以证明更简单的解决方案存在与原始设计。

过度工程通常被认为是增加安全系数、增加功能或克服大多数用户会接受的感知设计缺陷的设计变更。当安全或性能至关重要时（例如在航空航天器和豪华公路车辆中），或者需要极其广泛的功能时（例如诊断和医疗工具、产品的高级用户），它可能是可取的，但它通常在价值方面受到批评过度工程浪费资源，如材料、时间和金钱。

作为一种设计理念，它与“少即是多”（或：“越差越好”）的极简主义精神背道而驰，也是对 KISS 原则的不服从。

过度工程通常发生在高端产品或专业市场。在一种形式中，产品被过度建造并且性能远远超过预期的正常运行（可以以 300 公里/小时的速度行驶的城市汽车，或预计使用寿命为 100 年的家用录像机），因此价格更高，体积更大，并且比必要的更重。或者，它们可能会变得过于复杂——额外的功能可能是不必要的，并且可能会通过压倒经验不足和技术知识渊博的最终用户来降低产品的可用性，例如Feature creep。

> 特征蔓延（Feature creep）是指一产品（像计算机软件）的功能持续膨胀或增加的情形。产品基本功能以外的扩充功能，会使产品比原始设计要更复杂。长时间来看，额外或不需要的功能慢慢的进入系统中，使系统超出原来设定的目标。特征蔓延是产品成本及时间增加的常见原因之一。特征蔓延会造成危害，甚至可能会结束一个产品及专案。


（本人：所以使用gentoo就是按需分配）

### 为什么要用Gentoo？
比如有100万人正在使用ubuntu22.04,因为ubuntu是点几下就可以安装成功的，能改的地方很少，最多也就桌面环境不一样。而Gentoo就不一样了它是“从零构建”linux,可以改的地方非常多，那么100万人使用Gentoo被入侵成功的可能性远远小于100万人使用ubuntu。

镜像站我推荐南京大学镜像站

[Etcher](https://etcher.io/)（经过我的测试不会出现失败的）这个是刷livegui镜像
[下载地址](https://mirror.nju.edu.cn/gentoo/releases/amd64/autobuilds/current-livegui-amd64/)差不多会有5个G


### 怎么选择stage3的profile？

- openrc: 带此单词表示，其默认的初始化程序为 openrc

- systemd: 带此单词表示，其默认的初始化程序为 systemd，而不带该单词所有 profile ，默认初始化程序都是 openrc （即 Gentoo Linux 官方默认）

- nomultilib: 带此单词表示，其不包含 32 位的系统库文件，即无法执行 32 位程序

- selinux: 带此单词表示，其默认包含 SELinux 相关配置，启用 SELinux

- hardened: 带此单词表示，其默认包含强化安全性相关的配置

> selinux的主要作用是最大限度的减小系统中服务进程可访问的资源


openrc 是 Gentoo Linux 官方维护且默认的初始化程序所以我就选current-stage3-amd64-openrc

我写的gentoo教程很多都是照搬[这个](https://bitbili.net/gentoo-linux-installation-and-usage-tutorial.html#%E6%97%A0%E7%BA%BF)和[这个](https://www.bilibili.com/video/BV1HS4y1g7En) 因为每个人的机子不一样，不可盲目照抄。也记得看看他们的。

>比我强的人你也可以试试openrc，nomultilib，selinux，hardened缝合怪版的profile，我也只试了一次最大的问题是很多缺依赖，我也是缝合别人的教程已经有太多坑了，如果再加上这个简直找虐。

### 基本准备

我是UEFI引导的，如果是传统BIOS不要照抄。
进入livegui
打开终端
`sudo su`
`passwd` 输入新的root密码这里设置的密码要必须要求字母加数字加字符。
改东八区（不改有几率编译失败）



### 硬盘分区
分区使用两个命令`parted`和`lsblk`

我们需要给gentoo分两个区
- efi（注意win也有一个efi分区但是win不能识别zfs所以只好再创建一个）
- rootfs
假设你有sda1——windows、sda2——efi、sda3——用来凑数

那么你新的efi分区叫sda4 ，根分区叫sda5

磁盘 /dev/sda：532156MiB

|编号| 起始点      | 结束点 | 大小     |  文件系统 |   名称|
|---| :---        |    :----:   |          ---: |      ----:            |    -----|
 |  2   | 1MiB     | 278MiB       | 277MiB       |  fat32|EFI System Partition|
 |  1   | 278MiB   | 216598       |216321MiB  |ntfs|Basic data partition|
  |  3 |       531132MiB   |       532156MiB     |  1024MiB  |ntfs   |Basic data partition|

```
parted -a optimal /dev/sda
unit mib
print
set 2 boot off
mkpart primary A B
name 4 efi
mkpart primary X Y
name 5 rootfs
set 4 boot on
print
quit

mkfs.vfat -F 32  /dev/sda4
mkfs.xfs -f /dev/sda5

```

> 注意A，B,X,Y所填写的数字不能用已经用过的，根据上表
A=279 B=1303 B-A=1024 也就是sda4的大小。
同理X=1304 Y=531131   Y-X=529827 也就是sda5的大小



~~~
MOUNT=/mnt/gentoo
ZPOOL=zroot
STAGE3=https://mirror.nju.edu.cn/gentoo/releases/amd64/autobuilds/current-livegui-amd64/stage3-amd64-desktop-openrc-20220814T170533Z.tar.xz#记得更新链接
~~~



### 创建zpool池
~~~
zpool create -f \
-o ashift=12 \
-o cachefile=/etc/zfs/zpool.cache \
-O normalization=formD \
-O compression=lz4 \
-O acltype=posixacl \
-O relatime=on \
-O encryption=on \
-O keyformat=passphrase \
-O atime=off \
-O xattr=sa \
-m none -R ${MOUNT} ${ZPOOL} /dev/sda5
~~~
> 如果提示/sbin/modprobe zfs之类的，就在终端输入
 `/sbin/modprobe zfs`




### 创建dataset
~~~
zfs create -o mountpoint=none -o canmount=off ${ZPOOL}/ROOT
zfs create -o mountpoint=none -o canmount=off ${ZPOOL}/data
zfs create -o mountpoint=/ ${ZPOOL}/ROOT/default
zfs create -o mountpoint=/home ${ZPOOL}/data/home
zfs create -o mountpoint=/var/db/repos ${ZPOOL}/data/ebuild
zfs create -o mountpoint=/var/cache/distfiles ${ZPOOL}/data/distfiles
zfs create -o mountpoint=/var/cache/ccache ${ZPOOL}/data/ccache
~~~

`zpool set bootfs=${ZPOOL}/ROOT/default ${ZPOOL}`




#### 挂载分区
`mkdir -p ${MOUNT}/boot/efi`

`mount /dev/sda4 ${MOUNT}/boot/efi`



#### 复制zfs缓存
`mkdir -p ${ZPOOL}/etc/zfs`

`cp /etc/zfs/zpool.cache ${ZPOOL}/etc/zfs/zpool.cache`


#### 校验系统时间(需要网络)
`ntpd -q -g`
`date`


#### 下载stage3到/mnt/gentoo下
`cd ${MOUNT}`

`wget ${STAGE3}`

`tar xvf stage3-*.tar.xz --xattrs-include='*.*' --numeric-owner`

#### 挂载必要的其他文件系统
~~~
mount --types proc /proc ${MOUNT}/proc
mount --rbind /sys ${MOUNT}/sys
mount --rbind /dev ${MOUNT}/dev
mount --bind /run ${MOUNT}/run
~~~

####  复制DNS信息到新系统下
`cp --dereference /etc/resolv.conf ${MOUNT}/etc/`




#### 进入chroot环境
~~~
chroot ${MOUNT} /bin/bash
source /etc/profile
export PS1="(chroot) $PS1"


~~~



###  配置portage参数
`nano /etc/portage/make.conf`
~~~
COMMON_FLAGS="-O2 -march=znver2 -pipe"
CHOST="x86_64-pc-linux-gnu"
CPU_FLAGS_X86="aes avx avx2 f16c fma3 mmx mmxext pclmul popcnt rdrand sha sse sse2 sse3 sse4_1 sse4_2 sse4a ssse3" # CPU指令集，按照自己CPU的实际情况填写
MAKEOPTS="-j13" #这是同时编译的线程数。建议改为你的cpu线程数减2
EMERGE_DEFAULT_OPTS="--keep-going --with-bdeps=y --autounmask-write=y --jobs=2 -l"  #l后面的数字为你的cpu线程数+1,jobs的数字为你的cpu线程数
AUTO_CLEAN="yes"
GENTOO_MIRRORS="https://mirrors.nju.edu.cn/gentoo"
#FEATURES="${FEATURES} -userpriv -usersandbox -sandbox"  #如果编译时提示sandbox等字眼就把注释符号“#”去掉
GRUB_PLATFORMS="efi-64"
ACCEPT_KEYWORDS="amd64"
ACCEPT_LICENSE="*"  # 接受所有许可证的软件


#Ccache
#FEATURES="parallel-fetch ccache"  # 使用ccache来大大提高重新编译时的速度，等后面安装并设置ccache之后取消注释
 #CCACHE_DIR="/var/cache/ccache"            # ccache使用的目录
#CCACHE_SIZE="10G"

~~~

`COMMON_FLAGS="-O2 -march=znver2 -pipe"` 这里-march=填你的cpu架构我是icelake所以就改为
`COMMON_FLAGS="-O2 -march=icelake -pipe"`
不知道就填`native`




#### 同步镜像站中最新的软件快照
`emerge-webrsync`

####  配置git方式来同步ebuild数据库
~~~
emerge -av dev-vcs/git dev-util/ccache app-portage/cpuid2cpuflags
export CCACHE_DIR="/var/cache/ccache"
mkdir -p /etc/portage/repos.conf/
nano /etc/portage/repos.conf/gentoo.conf
~~~
把gentoo.conf文件添加以下内容
>[DEFAULT]
main-repo = gentoo
[gentoo]
location = /var/db/repos/gentoo
sync-type = git
sync-uri = https://mirrors.nju.edu.cn/git/gentoo-portage.git
sync-depth = 1
auto-sync = yes

- 在rm -rf之前打个`git`试试看是否成功安装了，要不然只能重来。

`cpuid2cpuflags` 出现的就是你cpu的指令集。


`rm -rf /var/db/repos/gentoo`

`emerge --sync`

#### 配置内核
~~~

echo "=sys-fs/zfs-9999 **" >> /etc/portage/package.accept_keywords/zfs
echo "sys-fs/zfs-kmod ~amd64" >> /etc/portage/package.accept_keywords/zfs
echo "=sys-fs/zfs-kmod-9999 **" >> /etc/portage/package.accept_keywords/zfs
echo "options zfs zfs_arc_min=268435456" > /etc/modprobe.d/zfs.conf
echo "options zfs zfs_arc_max=536870912" >> /etc/modprobe.d/zfs.conf
~~~


> 如果没有/etc/modprobe.d路径就自己新建一个，因为这是挂载了/mnt/gentoo所以，所以真实路径是/mnt/gentoo/etc/modprobe.d
> 没有zfs.conf自己也建立一个。以后碰到这种情况要学会灵活运用。



### 安装固件、内核及引导

先创建一个文件夹，以便于管理
`mkdir -p /etc/portage/package.license`
再创建文件以同意对应协议
~~~
echo 'sys-kernel/linux-firmware linux-fw-redistributable no-source-code' >/etc/portage/package.license/linux-firmware
emerge -vj linux-firmware
~~~
`emerge -av sys-kernel/genkernel sys-kernel/gentoo-sources`

`eselect kernel list`

`eselect kernel set 1`

`eselect kernel list`（选中会有一个蓝色的星号在后面）

`cd /usr/src/linux`

`make localmodconfig` (这里遇到什么东西直接回车)

`make menuconfig`

~~~
去：https://wiki.gentoo.org/wiki/Iptables
把Kernel settings for client需要的内核都安装上（关于M和*的区别我都是按的y键）找的到就安装找不到就算了。
（必须按顺序来，因为有些内核是隐藏在其他内核的子目录之中。所以如果你跳着来那么就会找不到。）

Linux Kernel Configuration
└─>File systems 
     └─>DOS/FAT/EXFAT/NT Filesystems
	      └─> <*>NTFS file system support
		  └─> <*>NFFS write support
└─>Device Drives
     └─>VHOST drives
	      └─> <*>Host kernel accelerator for virtro net
└─>Networking support
     └─>Networking options
           └─> <*>802.1d Ethernet Bridging
	       └─>Network packet filtering framework (Netfilter)
		       └─>Core Netfilter Configuration
                     └─> <*>nfmark target and match support
					 └─> <*>MASQUERADE target support
					 └─> <*>TCPMSS target support
                     └─> <*>"owner" match support
			   └─>IP:Netfilter Configuration
			         └─> <*>IP tables support (required for filtering/masq/NAT)
					     └─> <*>ip tables NAT support
			   └─>IPv6:Netfilter Configuration
			         └─> <*>IPv6 tables support (required for filtering)
					 └─> <*>Packet filtering



然后退出到最开始的目录下，保存，保存之后不会自动退出，再按下exit即可
 
~~~

>在menuconfig中选择m和 y的区别：

   >y: 模块驱动编译到内核中，启动时自动加载

  >m：模块会被编译，但是不会被编译到内核中，只是生成.o文件，然后用modprobe实现加载内核。


`make -j8`  （有多少线程就给它多少不要吝啬）

`make modules_install`

`make install`



`emerge -av  zfs-kmod`（记得挂代理要不然会编译失败）

`emerge -av zfs`   

>安装zfs时必须先安装zfs-kmod，再安装zfs不可交换顺序。


如果编译失败用`rm -rf /usr/portage/distfiles/egit-src/zfs.git`

`rm -rf /etc/hostid && zgenhostid`

> 在编译zfs中有几率只会安装3个包，但实际上只有安装了4个包才能走下一步，遇到这种情况，重新输入一遍指令直到显示终端重新安装包为止
还有一种方式是当你使用了这个指令的时候
`rm -rf /etc/hostid && zgenhostid`
只要没出现任何东西就行了
~~~
nano /etc/genkernel.conf #用ctrl+w搜索zfs然后把no改为yes并去掉注释符号'#'
genkernel initramfs --compress-initramfs --kernel-config=/usr/src/linux/.config --makeopts=-j`nproc`
~~~


#### 本地化配置
~~~
echo "Asia/Shanghai" > /etc/timezone
rm -rf /etc/localtime
emerge --config sys-libs/timezone-data
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
echo "zh_CN.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
eselect locale set en_US.UTF-8
env-update && source /etc/profile && export PS1="(chroot) $PS1"
~~~


 #### 配置fstab 
 注意替换下述命令中的设备名
 ~~~
# 如果是配置 UEFI 启动记录，那么记录 EFI 分区的 UUID 值到 fstab 文件
blkid /dev/sda4 >>/etc/fstab

#因为zfs能够自行管理dataset，不需要在fstab中指定挂载选项，之后需要删除zfs文件系统的相关段落
~~~

`nano /etc/fstab`


根据之前添加进去的顺序，依次配置到如下值：
~~~

# EFI 分区
UUID="XXXX-XXXX"         /boot/efi   vfat  rw,noatime,errors=remount-ro 0 2

根分区不需要配置，聪明得很。
~~~

#### 配置主机名
`nano /etc/conf.d/hostname`

#### 配置网络
`emerge -av dhcpcd`

`rc-update add dhcpcd default`

`emerge --ask dev-qt/qtgui sys-apps/portage`

`emerge --ask net-wireless/wpa_supplicant`


#### 配置hosts
`nano /etc/hosts`
~~~
127.0.0.1 localhost
::1 localhost
127.0.1.1 hostname.localdomain

~~~


#### 安装一些必要工具
`emerge -av doas cronie eix zsh lsd gentoolkit dosfstools parted neofetch ntfs3g bpytop xorg-drivers xorg-server xinit xrandr libXinerama`

`emerge --ask app-admin/sudo x11-wm/openbox`这个是桌面



#### 启用服务
~~~
rc-update add zfs-import sysinit
rc-update add zfs-mount sysinit
rc-update add elogind boot
rc-update add dbus default
~~~

#### 配置引导程序
~~~
emerge --ask --verbose sys-boot/refind
refind-install --usedefault /dev/sda4


~~~




然后去[这个网站](https://github.com/zbm-dev/zfsbootmenu/releases)
下zfsbootmenu-release-vmlinuz-x86_64-v*.EFI
之后把zfsbootmenu-release-vmlinuz-x86_64-v*.EFI重命名为bootx64.efi


再替换/mnt/gentoo/boot/efi/EFI/BOOT中的bootx64.efi


因为zfsbootmenu本身就是一个小型的linux系统，所以i8042.dumbkbd用户就有点麻烦。
去[这个网站](https://github.com/zbm-dev/zfsbootmenu/blob/master/bin/zbm-efi-kcl)把代码复制
`nano kcl`把代码复制到这里
`./kcl  -e /path/to/your/zfsbootmenu.efi -k i8042.dumbkbd -o bootx64.efi`

>-e  ZFSBootMenu EFI 文件
     -f  用文件内容替换内核命令行
     -k 用引用的参数替换内核命令行
     -o  输出文件； 如果未指定原来的文件将被替换

使用这个新生成的efi文件就好。因为我用refind代替grub2,所以关于在renfind添加i8042.dumbkbd我会在后面补充。



#### 新建用户
设置 root 用户密码，执行

`passwd root`

后根据提示，设置好 root 用户密码（如果你是第一次在 Linux 下输入密码，不要奇怪为何输入时无任何字符提示，这是正常的）。

设置普通用户
~~~
useradd -mG users,wheel,portage,usb,input,audio,video,sys,adm,tty,disk,lp,mem,news,console,cdrom,sshd,kvm,render,lpadmin,cron,crontab -s /bin/zsh jaus
passwd jaus
echo "permit keepenv :wheel" > /etc/doas.conf
~~~

>这里可能有一个关于 mail 文件夹不存在的提醒
Creating mailbox file: No such file or directory
忽略即可

#### 使用zfs snapshot创建新系统快照
`zfs snapshot zroot/ROOT/default@install`




重启
~~~
exit
umount /mnt/gentoo/boot/efi
umount -Rl /mnt/gentoo/{dev,proc,sys,run,}
zfs umount -a
zpool export -f zroot#如果提示pool is busy直接无视   
reboot

~~~
手动进入bios把EFI hard drive放到第一位（你应该清楚新来的启动项是谁）

等刷屏完成
`shell`

`zpool import -f -d  /dev/sda5 -R /newroot zroot -N`

`exit`

## 二.日常使用

语法科普[详细](http://www.jinbuguo.com/pkgmanager/gentoo/emerge.html)

`emerge -unmerge`
>  --unmerge (-C)
              删除所有匹配的软件包，且不检查依赖关系，因此这个动作可能会删除关键的包！
              可以将 --depclean 或 --prune 视为可以检查依赖关系的 --unmerge 版本。


首次进入zfs的gentoo键盘都是可以识别的。
你总会进入那个10秒倒计时的界面，在这时按Esc键输入密码，Ctrl+E就可以添加i8042.dumbkbd了，按两次回车搞定！


当我们使用sudo命令切换用户的时候会遇到提示以下错误：XXX is not in the sudoers file.

~~~
#切换到root用户

#编辑配置文件
nano /etc/sudoers
#增加配置, 在打开的配置文件中，找到root ALL=(ALL) ALL, 在下面添加一行
#其中xxx是你要加入的用户名称
xxx ALL=(ALL) ALL
~~~

#### 连接网络

`ifconfig` w开头一般是无线网卡
> 这里假设你的无线网卡为wlpXsX
> 

`ip link set wlpXsX up`

WPA/WPA2/WPA3 认证的无线网络（如今常用的认证方式），执行如下命令连接
`wpa_supplicant -i wlpXsX -c <(wpa_passphrase 「SSID」 「密码」) -B`

>记得输入命令时把「」删了我只是为了显眼。


`nano /etc/resolv.conf`
把`nameserver 114.114.114.114`照着排版打上去。

`ping bing.com`


#### 设置ccache
`nano /etc/portage/make.conf`

`CCACHE_SIZE="10G"`

>记得删除注释符号“#”


如果你想安装一些较麻烦的软件，而你有不懂openbox时
那你直接安装openbox鼠标右键菜单里的软件吧。
`emerge -av x11-terms/xterm `



#### 安装中文字体

`emerge -vj media-fonts/noto-cjk`
用这个命令会下1G左右。你也可以自行去[这里下](https://github.com/googlefonts/noto-cjk/releases)
然后把下载的字体移动到`~/.local/share/fonts`
`fc-cache -fv`




#### 1.设置openbox[我参考的教程](https://www.eaimty.com/2020/09/use-openbox-to-create-your-own-desktop-environment.html#4-anchor)
`echo "exec openbox-session" >> ~/.xinitrc`
> 由于每个用户都有自己的 .xinitrc 文件，因此请确保以普通用户而非 root 用户身份发出 startx 命令。

`startx`你就可以看到鼠标和纯黑的面板

`mkdir -p ~/.config/openbox/`

`cp /etc/xdg/openbox/* ~/.config/openbox/`

#### 设置hidpi
`nano ~/.Xresources`
`Xft.dpi: 144`

>我告诉你这个144怎么来的，假如你在win10的缩放是1.5，那么在这里就设置为96x1.5=144。如果你在win10的缩放是2,那么就是96x2=192。


`nano ~/.xinitrc`

~~~
xrdb -merge ~/.Xresources
exec openbox-session
~~~

绝不可以调换顺序！
可以使95%的软件进行缩放，其余的完全就是开发者不用心。

#### 编辑 Openbox 的右键菜单
`emerge -av menumaker`
`mmaker -vf OpenBox3`


#### 关于设置USE的问题
假如你安装软件时，遇到了类似的指令时：
~~~
The following USE changes are necessary to proceed:
#required by app-text/happypackage-2.0, required by happypackage (argument)
>=app-text/feelings-1.0.0 test
~~~

在最后一行数字后面（也就是1.0.0）有一个英文单词，把这个加入到USE中去就可以了具体语法如下：
`vim /etc/portage/portage.use/XXX`
`app-text/feelings-1.0.0 test`

>XXX随意起名字，但是你要记得它是什么。

不要去make.conf改全局USE除非是禁用。



#### 去掉USE的括号
比如doas的persist的USE就是带括号的，那么就不能按之前的操作来，首先得去括号
`vim /etc/portage/profile/package.use.mask`

`app-admin/doas -persist`
>persist前面的减号是用来去括号的（大概）

之后就和以前一样
`vim /etc/portage/portage.use/XXX`

`app-admin/doas persist`


#### 换掉之前的垃圾终端
`emerge -av x11-term/sakura`

#### 设置系统托盘

我选择的是tint2

#### 设置随着openbox的开启其他软件也随着启动
`nano ~/.config/openbox/autostart`

`tint2 &`

#### 怎么知道openbox设置软件的名字会随着openbox的开启也跟着自启动呢？
比如：tint2的完整包名为：x11-misc/tint2
又比如：firefox-bin的完整包名为：www-client/firefox-bin
那么把这两个软件都设置为自启动的名字为它们各自完整包名斜杠后面的名字。
具体设置如下：
~~~
tint2 &
firefox-bin &

~~~

#### firefox和firefox-bin的区别
没有bin的编译时间长达一个多小时，有bin的编译时间速度很快。其他软件也是一样的，照着葫芦画瓢就行。

#### 电源和调节亮度
`emerge -av mate-power-manager`

`nano ~/.config/openbox/autostart`

`mate-power-manager &`

然后fn的调节亮度就能自动使用了。

#### 迷雾通
`emerge -av dev-libs/nss`安装了这个才能打开迷雾通
打开全局vpn然后迅速关了，看看终端报错是不是和下面一样
~~~
iptables: No chain/target/match by that name.
iptables: No chain/target/match by that name.
RTNETLINK answers: No such file or directory
iptables: No chain/target/match by that name.
iptables: No chain/target/match by that name.
iptables: No chain/target/match by that name.
iptables: No chain/target/match by that name.
ip6tables: Bad rule (does a matching rule exist in that chain?).
ip6tables: No chain/target/match by that name.


~~~

是一样的就证明iptables和需要的内核都已经安装好了。

#### fcitx5输入法
~~~
# 如果你选择 ::gentoo-zh 这个仓库的话，因为包名和依赖不同，所以安装命令为（自行删除命令前注释符）
# 先安装必要的工具
#emerge -vj app-eselect/eselect-repository
# 然后启用仓库
#eselect repository enable gentoo-zh
# 之后获取仓库（如若卡同步，开代理）
#emerge --sync gentoo-zh
# 添加关键字用于安装
#echo "app-i18n/*::gentoo-zh" >>/etc/portage/package.accept_keywords/fcitx5
#echo "x11-libs/xcb-imdkit::gentoo-zh" >>/etc/portage/package.accept_keywords/fcitx5
# 再安装
#emerge -vj app-i18n/fcitx-meta:5
# 这个仓库的会默认安装上 fcitx-chinese-addons:5 ，里面包含有中文输入法
~~~
以普通用户编辑 ~/.xsession 文件,添加以下内容
~~~
export XMODIFIERS="@im=fcitx"
export QT_IM_MODULE=fcitx
export GTK_IM_MODULE=fcitx
export SDL_IM_MODULE=fcitx
~~~

>注意在添加自启动时名字为fcitx5 &而不是fcitx-meta:5 &


#### 声音

你先看看在livecd中能识别出来的吗？

- 1.能识别，但在安装完成gentoo后又不识别。
[去看这个](http://blog.ataboydesign.com/2020/02/16/getting-sound-alsa-working-on-gentoo/)




- 2.不能识别
tigerlake：和添加i8042.dumbkbd一样，这次的代码是
`snd_sda_intel.dmic_detect=0`


文件管理器
我选择的是nemo




#### 编译内核是一锤子买卖吗？
不是，还可以改的
`cd /usr/src/linux`
`make menuconfig`

#### gentoo的内核有那么复杂，我怎么才知道我要安装的内核在那个目录下呢？

[去这里看](https://www.kernelconfig.io/index.html)









#### 自定义键盘快捷键

所有的键绑定必须添加到 ~/.config/openbox/rc.xml 文件中，并且在 <!-- Keybindings for running aplications --> 标题下方。尽管此处提供了简要概述，但可以在 openbox.org 上找到对键绑定的更深入解释。
`nano ~/.config/openbox/rc.xml`

~~~

  <!-- 窗口与工作区相关 -->
    <keybind key="W-a">
        <action name="ToggleShowDesktop"/>
    </keybind>
    <keybind key="A-Left">
        <action name="PreviousWindow"/>
    </keybind>
    <keybind key="A-Right">
        <action name="NextWindow"/>
    </keybind>
    <keybind key="C-Left">
        <action name="DesktopLeft">
            <dialog>no</dialog>
            <wrap>no</wrap>
        </action>
    </keybind>
    <keybind key="C-Right">
        <action name="DesktopRight">
            <dialog>no</dialog>
            <wrap>no</wrap>
        </action>
    </keybind>
    <keybind key="C-A-Left">
        <action name="SendToDesktopLeft">
            <dialog>no</dialog>
            <wrap>no</wrap>
        </action>
    </keybind>
    <keybind key="C-A-Right">
        <action name="SendToDesktopRight">
            <dialog>no</dialog>
            <wrap>no</wrap>
        </action>
    </keybind>
   <keybind key="C-A-a">
        <action name="Execute">
            <command>flameshot gui</command>
        </action>
    </keybind>
~~~

S: Shift
C: Control
A: Alt
W: Super(键盘带有windows图标的键)
M: Meta
H: Hyper (If it is bound to something)

#### 全盘加密的局限[原链接](https://hack1ng4fun.github.io/2019/11/18/Linux%E3%80%8C%E7%A3%81%E7%9B%98%E5%8A%A0%E5%AF%86%E3%80%8D%E5%AE%8C%E5%85%A8%E6%8C%87%E5%8D%97/)
>但仍然可能受到 BIOS/UEFI 固件篡改、冷启动攻击、硬件键盘记录器等攻击手段的威胁。

#### 回滚快照
zfs有快照功能，简单地说和游戏的初始存档一样，用了这个之后可以回到你装好系统的瞬间。（毫无疑问你要装好系统之后就要设置，而不是等到使用了几天才默然的回过头来设置快照。）这样的话就可以防病毒，因为病毒是悄无声息地进去你的系统从而窃取重要的机密文件，同时也要记住病毒也可以渗透到快照文件中，所以也要把快照给换了。
（毋庸置疑的是使用“存档”的次数是大于更换快照的次数，）



#### 解决XXX command not found
[去这里](https://command-not-found.com)把XXX打上去，知道包名后，去startpage搜XXX gentoo。

#### Gentoo升级系统的标准步骤[原链接](https://www.jianshu.com/p/7e466eaf0cf3)
~~~
emerge --sync //升级整个portage目录
emerge portage //如果不是最新的portage，需要按提示执行此操作
emerge -avuDN world //按照 /var/lib/portage/world 文件下的包，重新构建整个系统
emerge -av --depclean //清除不需要（孤立）的软件包
revdep-rebuild 
~~~






#### 安装好qemu和libvirt后执行
`rc-update add libvirtd default`

`rc-service libvirtd start`



## 比gentoo还要安全的系统。
- bedrock linux

缺点是要花过多的时间学习多种linux/BSD（取决于你要缝合多少种）

- openbsd

基本上想搞openbsd至少也要32GB的内存和十几个核心的cpu。因为bsd生态比linux还要糟糕，要开许多的虚拟机。然而自带的虚拟机不能模拟图形化界面，虽说有qemu但是没有kvm。
