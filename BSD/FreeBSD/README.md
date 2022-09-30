# 把FreeBSD当桌面环境使用

[FreeBSD 从入门到跑路](https://book.bsdcn.org)记得去看

安装很简单，但尤其要注意，不要在这里配置网卡，可以跳过。
ufs可以多系统，zfs也可以但有点难。

安装好后再配置网络

`sysctl net.wlan0.devices`假设你显示了`ath0`

`vi /etc/wpa_supplicant.conf`

```
network={
ssid="myssid"#ssid为你的wifi名称
psk="mypsk"#你的wifi密码

}
```

`vi /etc/rc.conf`

```
wlans_ath0="wlan0"
ifconfig_wlan0="WPA SYNCDHCP"
```

`service netif restart`

### 源

`mkdir -p /usr/local/etc/pkg/repos`
`vi /usr/local/etc/pkg/repos/nju.conf`

```
nju: {  
url: "pkg+https://mirrors.nju.edu.cn/freebsd-pkg/${ABI}/latest",  
mirror_type: "srv",  
signature_type: "none",  
fingerprints: "/usr/share/keys/pkg",  
enabled: yes
}
FreeBSD: { enabled: no }
```

`vi /etc/portsnap.conf`

将`SERVERNAME=portsnap.FreeBSD.org` 修改为 `SERVERNAME=freebsd-portsnap.mirror.bjtulug.org`

`portsnap auto`
然后就可以安装一些东西了

`pkg install neovim`

若要获取滚动更新的包,请将 `quarterly` 修改为 `latest`。请注意, `CURRENT` 版本只有 `latest`.

> 若要使用 https,请先安装 `security/ca_root_nss` ,并将 http 修改为 https,最后使用命令 `pkg update -f` 刷新缓存即可,下同。

请无视上面的话因为ca\_root\_nss已经在13.1内置了。直接上https就对了。

> FreeBSD配置文件的路径会有所不同，比如：jwm的配置文件在linux上是 /etc/system.jwmrc 而FreeBSD则是/usr/local/etc/system.jwmrc 仅此而已。

### Xorg

`pkg install xorg-minimal xrdb dbus`

如果你`startx`报错了，很有可能是显卡驱动没有安装上（以我为例iris xe）

> 报错日志在/var/log/Xorg.0.log

先把用户添加进video和wheel组
`pw groupmod video -m user`
`pw groupmod wheel -m user`

`pkg install xf86-video-intel`
`pkg install drm-kmod`安装好后会有提示的。添加到rc.conf即可
`nvim /etc/rc.conf`

`reboot`

假如你黑屏了那就进去单用户模式
`mount -a`不要问为什么在使用这个命令前，root用户没权限，用了就可以了。
`nvim /etc/rc.conf`把i915kms删掉
再次进入系统
卸载之前的drm-kmod
`pkg info | grep ^drm`
把出现的包全删了`pkg delete`

`cd /usr/ports/graphics/drm-510-kmod`
`make && make install`

如果你有不可言说的原因导致你要重新编译一遍drm-510-kmod，那么在重新编译有很大几率在使用`make && make install`的时候没有任何输出。
解决方法：

`portsnap fetch && portsnap extract && portsnap update`

`cd /usr/ports/graphics/drm-510-kmod`

`make && make install`

假使你安装drm-510-kmod还黑屏那就只能用通用驱动（只用iris xe测试过，连亮度都不能调）

> 尤其要注意，如果你在rc.conf添加drm驱动。必须保证/usr/local/etc/X11/xorg.conf.d/没有任何东西，要不然进不去Xorg

`nvim /usr/local/etc/X11/xorg.conf.d/intel-driver.conf`

```
Section "Device"
Identifier "Card0"
Driver  "scfb"
EndSection
```

`startx`




### 其它

中文字体
`pkg install noto-sc`

调节亮度
`backlight 20`

电源显示
`apm -l`如果你的笔记本不支持则会显示255。

关于非正常重启导致进不去FreeBSD的解决方法
直接在报错界面打`fsck -y`

`reboot`

进入系统后
`nvim /etc/rc.conf`

`fsck_y_enable="YES"` 开机自动fsck -y只会在找不到硬盘的条件才会自动使用



非root账户使用fcitx5
`pkg install fcitx5 fcitx5-qt zh-fcitx5-chinese-addons fcitx5-configtool`

`nvim /etc/rc.conf`

`dbus_enable="YES"`(简单来说fcitx5通过dbus来调用)

`pkg delete fcitx5-gtk`必须卸载，反正我卸载后fcitx5才正常

`reboot`

`nvim /etc/login.conf`

```
default:\
[...]
 :setenv=BLOCKSIZE=K,GTK_IM_MODULE=fcitx,QT_IM_MODULE=fcitx,XMODIFIERS=@im=fcitx:\
[...]
```

`cap_mkdb /etc/login.conf`
返回tty，重新登陆一次帐号

> 其实root用户能用fcitx5,而普通用户不能用fcitx5,就是因为shell不同。

普通用户的默认 shell 一般不是 csh，为了方便配置，需要把默认 shell 改成 csh。然后其余配置方法同上所述。

先看看现在的 shell 是什么: `echo $0`，如果输出不是 csh，尝试修改成 csh：

`chsh -s /bin/csh`
退出当前账号，重新登录，查看 shell 是否变为 csh：

`echo $0`
如果输出csh，代表配置成功。然后其余环境变量配置方法就用setenv。

声音
随便进去一个网站测下声音就行，默认声音很大。假如没有就有下面的指令

`sysrc snd_hda="YES"`

`cat /dev/sndstat`会输出一些东西

```
Installed devices:
pcm0: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm1: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm2: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm3: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm4: <Realtek ALC892 (Rear Analog 5.1/2.0)> (play/rec) default
pcm5: <Realtek ALC892 (Front Analog)> (play/rec)
pcm6: <Realtek ALC892 (Rear Digital)> (play)
No devices installed from userspace.
```

后面带有 default 是 oss 默认设备。如果软件的音频使用的 oss 且输出是默认的，音频就会从这个设备输出。

下列命令可以永久修改输出的设备。最后的数字是对应的pcm后面的数字。
`/etc/sysctl.conf`
`hw.snd.default_unit=5`

改声音
`mixer -s pcm 50`

FreeBSD 大部分软件的音频输出驱动为 oss。有些默认是 pulseaudio ，这些软件的设置看最后的提示。

自定义jwm

`<Key mask="CA" key="e">exec:wezterm</Key>`

> CA=Ctrl+Alt exec:是必须要的

初次jwm按alt加方向键没有用先随便开个窗口，把鼠标移到打开的窗口，窗口会变蓝，然后点restart，就好了。

不要在Xorg中用reboot，我上次用nvim修改rc.conf保存之后用了reboot,结果rc.conf里面的东西全没了，虽说nvim有类似“断电保护数据”的机制，只不过没用。要在tty里用。

挂载ext系统
请注意：这里应该安装 fusefs-ext2（同时支持EXT2/3/4）而非 fusefs-ext4fuse ，因为后者是只读且被废弃的。

安装 fusefs-ext2
`pkg install fusefs-ext2`
加载

打开/etc/rc.conf，在 kld\_list一栏里添加 ext2fs ，结果可能如 kld\_list="ext2fs i915kms"

重启后，挂载。

用vm-bhyve管理bhyve [1](https://github.com/churchers/vm-bhyve)

`pkg install bhyve-firmware grub2-bhyve vm-bhyve`

`nvim /etc/rc.conf`

```
vm_enable="YES"
vm_dir="/home/123/vm"  #设置你虚拟机存放的路径
```

`vm init`

`cp /usr/local/share/examples/vm-bhyve/* /home/123/vm/.templates/`

`vm create -t debian -s 50G testvm`

> -t 是选择哪个模板 -s 是磁盘大小

然后你的vm目录下就有了一个testvm文件夹，在这里修改属于testvm的模板，后缀名为conf

```
loader="uefi"
cpu=3
memory=1256M
graphics="yes"
xhci_mouse="yes"  #更好的鼠标
graphics_listen="0.0.0.0"  #监听地址就用这个，反正你设置好live cd后用vm list看vnc下面有没有你设置的地址，没有的话就用0.0.0.0吧。
graphics_port="5900"
graphics_res="1600x900"
graphics_wait="yes" #设置为yes,那就在你打开vnc之前都会保持在grub界面
```

`vm install testvm debian-live-11.5.0-amd64-xfce.iso` 设置live cd

`vncviewer :5900`

uefi支持的分辨率

```
1920x1200
1920x1080
1600x1200
1600x900
1280x1024
1280x720
1024x768
800x600
640x480

```

重新启动时报错：bdsdex-failed-to-load-boot0001-uefi-bhyve-sata-disk [1](https://record99.blogspot.com/2021/12/bdsdex-failed-to-load-boot0001-uefi-bhyve-sata-disk.html)

在报错界面等一会就可以自动进入一个UEFI的shell
`exit` 你就来到了bhyve面板
-->Boot Maintenance Manager
-->Boot From File
选择你安装的盘按回车就可以看到EFI
-->kali
-->grubx64.efi
进入系统后`cd /boot/efi` kali会提示cd用不了，那就用图形化界面操作吧。

`mkdir -p EFI/BOOT`

`cp kali/grubx64.efi EFI/BOOT/bootx64.efi`

`vm stop kali`

> 你也可以在首次安装linux时就把这件事做好

bhyve虚拟机的网络配置
有三种
- 桥接
- Nat转发
- 直通

我只讲nat转发 [1](https://github.com/churchers/vm-bhyve/wiki/NAT-Configuration)   [2](https://www.foxk.it/blog/2018-09-08_vm-bhyve/)

`nvim /etc/rc.conf`
```
gateway_enable="yes"
dnsmasq_enable="yes"
pf_enable="yes"
```
`pkg install dnsmasq`

`nvim /etc/pf.conf`

`nat on em0 from {192.168.8.0/24} to any -> (em0)`ip地址照抄

`sysctl net.inet.ip.forwarding=1`

`/usr/local/etc/dnsmasq.conf` 这里也是全部照抄
```
port=0
domain-needed
no-resolv
except-interface=lo0
bind-interfaces
local-service
dhcp-authoritative

interface=vm-public
dhcp-range=192.168.8.10,192.168.8.254

```
`reboot`

`service pf start`

`service dnsmasq start`

`vm start kali`

进去之后你就可以看到你的网卡有ip地址子网掩码等信息。但这时还不能上网，因为你还没填写DNS服务器。
`vim /etc/resolv.conf`

`nameserver 8.8.8.8` 要想知道DNS有没有被墙，ping一下域名就是了
>每次主机重启或关机都需要`service pf start` `service dnsmasq start`


bhyve移动文件和共享剪贴板
syncthing




设置默认打开方式
https://vermaden.wordpress.com/2021/04/22/freebsd-desktop-part-24-configuration-universal-file-opener/
https://forums.freebsd.org/threads/setting-a-default-application.79226/


jwm设置自启动
`nvim ~/.jwmrc`

`<StartupCommand>fcitx5</StartupCommand>`


虚拟机进入全局tor模式
你会发现tails os或者是whonix想用bhyve虚拟化很难。（我一直不推荐libvirt）
且对FreeBSD一点都不友好。
tails os硬是不让你安装到硬盘里，whonix就只有qcow2。
于是我们只能使用debian或arch之类了，虚拟机就是用来装垃圾的（systemd或windows）。
- parrot os

有一个工具可以全局tor叫anonsurf 
一般情况tor cli版连前置代理（geph）都是在`/etc/tor/torrc`添加
`HTTPSProxy 127.0.0.1:9910`
>HTTPProxy已被弃用

而它则是`/etc/anonsurf/torrc.base`

>源用北外语的，南大会报错

`apt install resolvconf` 修复torDNS

如果是用其他的debian或arch发行版，就用下面两个吧

[kalitorify](https://github.com/brainfucksec/kalitorify)


[archtorify](https://github.com/brainfucksec/archtorify)


