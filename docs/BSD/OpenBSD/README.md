#### 把OpenBSD current当桌面环境


**因为openbsd只在默认情况下才能够出现那么辉煌的成绩，所以能默认使用就默认使用。**
可以去bilibili和youtube关注openbsd中文结社。
[中文结社的官网](https://openbsd-zh-association.github.io/docs-openbsd-zh/)


[镜像下载地址](https://mirrors.bfsu.edu.cn/OpenBSD/snapshots/amd64/)

下载的镜像后缀名是img，不要下载iso,
`lsblk` 看你的u盘叫什么。这里假设你的u盘为sda

`doas dd if=install71.img of=/dev/sda bs=1M`

>if=img路径
>of=刻录到哪个盘
>bs=写入速度

全盘加密
这要往我的磁盘填充随机数据，比格式化还可怕。

如果只有无线网卡而且还是私有驱动在选网卡那里填上`done`
>不要妄想从启动盘里面安装网卡驱动，因为fw_update根本不在这里


记得新建一个普通用户


`Do you expect to run the X Window System?` 填yes


分区
disklable的[man](https://man.openbsd.org/OpenBSD-7.1/disklabel)
要知道这里并不是shell。

先自动分区然后ctrl+c退出再`install`重新来一遍
到了`Use (A)uto layout, (E)dit auto layout,or create (C)ustom layout?`
选`E`
进入自定义分区
要记住自动创建分区挂载的目录不能随意更改。你进入自定义分区唯一修改的变量为磁盘容量，其余的不变。

`/usr`为最大
`/` 为中位数
`/home`最小

`c`为整个物理磁盘就显示unused那个

删除分区
`d a` d是删除 ，a是分区的名字

增加分区
`a a` 第一个a是增加 第二个a是分区的名字
按下回车之后
offset为默认，size可以设置小于等于size的值

`p m` p为输出当前分区列表，可以改单位。`m`为MB,同理`g`为GB

`w` 保存分区
`q` 退出
 

时区选Hongkong
重启之后自己手动进入bios,它的名字也叫EFI hard drive

#### 关于使用无线网卡的不安全性[原链接](https://openbsdrouterguide.net/#the-network)
该指南不涉及任何类型的无线连接。无线芯片固件出了名的漏洞和可利用性，我建议你不要使用任何类型的无线连接。
>注意：目前，据我所知，还没有一个 OpenBSD 无线驱动程序完全没有问题。

挂载硬盘
`mount -t msdos /dev/sd2i /mnt`

`fdisk sd2`
`disklabel sd2`
其中有一个可以看你硬盘分区，sd2后面的i表示它的分区。



安装驱动
你下好的名为.tgz的压缩包不要解压。
`fw_update  /mnt/XXX.tgz`


连接网络更新镜像源
假设网卡叫iwx0
`ifconfig iwx0 up`
`ifconfig iwx scan`
`vi /etc/hostname.iwx0` name.后面是你的网卡名字

~~~
join iphone wpakey 11111111
inet autoconf

~~~

join后面是热点名字，wpakey是密码 最后面的是dhcp。

`vi /etc/installurl`
`https://mirrors.nju.edu.cn/OpenBSD/`




进入图形化界面
rcctl enable xenodm
rcctl start xenodm


ctrl+alt+f2就可以回到tty
ctrl+alt+f5回到x环境


安装和卸载软件
`pkg_add nnn`
`pkg_detele nnn`


openbsd默认的shell是ksh，不是bash也不是zsh更不是fish。


设置hidpi和xterm的默认字体为large
`vi ~/.Xdefaults`
`XTerm*VT100.initialFont: 5`
`Xft.dpi: 144`
`pkg_add badwolf`
下个坏狼就可以知道是否设置成功，虽然OpenBSD自带的X环境支持hidpi但是本身的X环境下的软件却不支持hidpi。害得我担心了好久。



设置jwm的中文环境
`doas pkg_add zh-wqy-zenhei-ttf`
`nvim ~/.xsession`
~~~
export LANG=zh_CN.UTF-8
jwm
~~~



查看你的笔记本电池
`apm -l`
其余的去看[apm](https://man.openbsd.org/apm.8)

下载工具
ftp(Internet file transfer program)而不是那个ftp(File Transfer Protocol)

`ftp http://mlm.mlm/file.zip`



xterm的复制与粘贴
- 从外面粘贴到xterm来 
> ctrl+c 到xterm中用鼠标中键即可粘贴
- 从xterm中粘贴到外面 
>先从xterm中选中你要复制的，然后到外面使用鼠标中键。

XTerm字体太小处理方法
Ctrl+鼠标Right Click。

可以看到菜单，然后调整。
选Large就可以显示中文了

音频

下载mpv或vlc都可以测试，注意默认的声音很大。

`mixerctl -av` 这是默认的配置文件

修改配置文件
从mixerctl的man中可以看到，它会让你修改/etc/mixerctl.conf，然后你就找不到mixerctl.conf，新建一个也没用。


`mixerctl outputs.master=50,50`


设置默认打开程序
你可以在[这里](https://romanzolotarev.com/xdg-mime.html)看到，其实以前是有一个程序的，只不过现在没有了。代替方式我用ranger
第一次启动　ranger 会创建一个目录 ~/.config/ranger/。可以使用以下命令复制默认配置文件到这个目录
`ranger --copy-config=all`

了解一些基本的 python 知识可能对定制 ranger 会有帮助。

- rc.conf - 选项设置和快捷键
- commands.py - 能通过 : 执行的命令
- rifle.conf - 指定不同类型的文件的默认打开程序。
- scope.sh - 文件预览相关配置






安装fcitx5
`doas pkg_add fcitx fcitx-chinese-addons fcitx-gtk`
`vi ~/.profile`

~~~
GTK_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
QT_IM_MODULE=fcitx

~~~


把下面的内容粘贴到 ~/.config/fcitx5/profile
~~~
[Groups/0]
# Group Name
Name=Default
# Layout
Default Layout=us
# Default Input Method
DefaultIM=pinyin

[Groups/0/Items/0]
# Name
Name=keyboard-us
# Layout
Layout=

[Groups/0/Items/1]
# Name
Name=pinyin
# Layout
Layout=

[GroupOrder]
0=Default

~~~

重新进入桌面

解压文件
gunzip


搜索文件
locate和which





qemu安装whonix
OpenBSD不用linux的iptables，我先放在这里。


启动tails os
使用命令前请使用指令扩容tails os的磁盘镜像
`qemu-img resize tailsos.img +20G`


`qemu-system-x86_64  -m 3000 -enable-kvm -drive if=none,id=stick,format=raw,file=tailsos.img -device nec-usb-xhci,id=xhci -device usb-storage,bus=xhci.0,drive=stick,removable=on`

连接代理

选择自动连接tor,配置一个tor网桥，使用一个默认网桥，点击连接网络，连接失败后就可以填写代理地址了



自定义jwm
移动配置文件
` cp -i /etc/system.jwmrc ~/.jwmrc`



