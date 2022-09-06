# 把FreeBSD当桌面环境使用

[FreeBSD 从入门到跑路
](https://book.bsdcn.org) 记得去看





安装很简单，但尤其要注意，不要在这里配置网卡，可以跳过。
ufs可以多系统，zfs也可以但有点难。



`sysctl net.wlan0.devices`假设你显示了`ath0`

`vi /etc/wpa_supplicant.conf`
~~~
network={
ssid="myssid"#ssid为你的wifi名称（不要为中文）
psk="mypsk"#你的wifi密码

}
~~~

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
然后就可以安装一些东西了`pkg install neovim`



若要获取滚动更新的包,请将 `quarterly` 修改为 `latest`。请注意, `CURRENT` 版本只有 `latest`.

>若要使用 https,请先安装 `security/ca_root_nss` ,并将 http 修改为 https,最后使用命令 `pkg update -f` 刷新缓存即可,下同。

请无视上面的话因为ca_root_nss已经在13.1内置了。直接上https就对了。
>FreeBSD配置文件的路径会有所不同，比如：jwm的配置文件在linux上是 /etc/system.jwmrc 而FreeBSD则是/usr/local/etc/system.jwmrc   仅此而已。

### Xorg
如果你`startx`报错了，很有可能是显卡驱动没有安装上（以我为例iris xe）
>报错日志在/var/log/Xorg.0.log

先把用户添加进video和wheel组
`pw groupmod video -m user`
`pw groupmod wheel -m user`

`pkg install xf86-video-intel`
`pkg install drm-kmod`安装好后会有提示的。添加到rc.conf即可
`nvim /etc/rc.conf`
`reboot`

假如你黑屏了那就进去单用户模式
`mount -a`不要问为什么在使用这个命令前，root用户没权限，用了就可以了。
再次进入系统
卸载之前的drm-kmod
`pkg info | grep ^drm`
把出现的包全删了`pkg delete `

`cd /usr/ports/graphics/drm-510-kmod`
`make && make install`

如果你有不可言说的原因导致你要重新编译一遍drm-510-kmod，那么在重新编译有很大几率在使用`make && make install`的时候没有任何输出。
解决方法：
`portsnap fetch && portsnap extract && portsnap update`
`cd /usr/ports/graphics/drm-510-kmod`
`make && make install`


假使你安装drm-510-kmod还黑屏那就只能用通用驱动（只用iris xe测试过，连亮度都不能调）
>尤其要注意，如果你在rc.conf添加drm驱动。必须保证/usr/local/etc/X11/xorg.conf.d/没有任何东西，要不然进不去Xorg

`nvim /usr/local/etc/X11/xorg.conf.d/intel-driver.conf`
~~~
Section "Device"
Identifier "Card0"
Driver  "scfb"
EndSection
~~~

`startx`


### 其它
中文字体
`pkg install wqy-fonts`


调节亮度
`backlight 20`

电源显示
`apm -l`如果你的笔记本不支持则会显示255。


fcitx5
`pkg install fcitx5 fcitx5-qt zh-fcitx5-chinese-addons`
`pkg delete fcitx5-gtk`我卸载后fcitx5就可以正常使用了
`nvim ~/.cshrc`
~~~
setenv QT4_IM_MODULE fcitx
setenv GTK_IM_MODULE fcitx
setenv QT_IM_MODULE fcitx
setenv GTK2_IM_MODULE fcitx
setenv GTK3_IM_MODULE fcitx
setenv XMODIFIERS @im=fcitx
~~~

声音
随便进去一个网站测下声音就行，默认声音很大。假如没有就有下面的指令
`sysrc snd_hda="YES"`

`cat /dev/sndstat`会输出一些东西
~~~
Installed devices:
pcm0: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm1: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm2: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm3: <NVIDIA (0x0083) (HDMI/DP 8ch)> (play)
pcm4: <Realtek ALC892 (Rear Analog 5.1/2.0)> (play/rec) default
pcm5: <Realtek ALC892 (Front Analog)> (play/rec)
pcm6: <Realtek ALC892 (Rear Digital)> (play)
No devices installed from userspace.
~~~
后面带有 default 是 oss 默认设备。如果软件的音频使用的 oss 且输出是默认的，音频就会从这个设备输出。

下列命令可以修改输出的设备。最后的数字是对应的pcm后面的数字。

`sysctl hw.snd.default_unit=5`

改声音
`mixer -s pcm 50`

FreeBSD 大部分软件的音频输出驱动为 oss。有些默认是 pulseaudio ，这些软件的设置看最后的提示。

自定义jwm

`<Key mask="CA" key="e">exec:wezterm</Key>`
>CA=Ctrl+Alt exec:是必须要的

不要在Xorg中用reboot，我上次用nvim修改rc.conf保存之后用了reboot,结果rc.conf里面的东西全没了，虽说nvim有类似“断电保护数据”的机制，只不过没用。要在tty里用。

挂载ext系统
请注意：这里应该安装 fusefs-ext2（同时支持EXT2/3/4）而非 fusefs-ext4fuse ，因为后者是只读且被废弃的。

安装 fusefs-ext2
`pkg install fusefs-ext2`
加载

打开/etc/rc.conf，在 kld_list一栏里添加 ext2fs ，结果可能如 kld_list="ext2fs i915kms"

重启后，挂载。


虚拟化

为了启动 FreeBSD 以外的操作系统，必须首先安装grub2-bhyve，
但是这玩意九年没更新了。freebsd也是能安装kvm的。不过2016年就停更了。

BSD的虚拟化我认为的解决方法是qemu+nvmm
目前只有DragonflyBSD和NetBSD才能用。

