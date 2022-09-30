## 如何翻过GFW？
请使用迷雾通，无界

## 在win10下用u盘刷linux系统
[Etcher](https://etcher.io/)（有些系统会刷失败） ，失败后就用rufus但是用这个刷linux系统的话刷完后有几率在bios中找不到u盘启动项，这时候不是u盘出问题了，而是这个软件的锅。解决方法我忘了。



## 删除元数据
[ExifTool](https://exiftool.org/) 
显示这个文件的元数据: `exiftool filename.jpg`
删除这个文件的元数据：`exiftool -All= filename.jpg`
tails os 和whonix workstation 自带这个软件。

## 怎么随机无线网卡的mac地址（以pop os为例）
使用`ip link` 然后看到link/ether 后面就是你网卡的mac地址(最好看个大概要不然到底该没该还不知道)，lo不是你的网卡。
打开终端输入`nano /etc/NetworkManager/conf.d/123.conf` （123可以随便改）
```
[device]
# 扫描 wifi 时随机化 MAC
wifi.scan-rand-mac-address=yes      # no

[connection]
# 每次通过无线连接时随机化MAC
wifi.cloned-mac-address=random
wifi.mac-address-randomization=random
```

之后`sudo systemctl restart NetworkManager`
再按电脑的方向键的上键找到`ip link`对比一下就行。


虚拟机网络的连接方式不要选bridge（桥接），应该选NAT和内部网络（whonix已经帮你配好了直接上whonix wiki查就是了）
[编程随想的原话](https://program-think.blogspot.com/2012/12/system-vm-5.html)：
对于普通网友，俺建议把网卡设置为 NAT 模式。因为 NAT 模式可以起到类似防火墙的效果，比较有利于保护你的虚拟系统的安全。

## 怎么发现你的笔记本有没有被装上什么东西?[1](https://anonymousplanet-ng.org/guide.html#physically-tamper-protect-your-laptop) [2](https://mullvad.net/en/help/how-tamper-protect-laptop/)
重要的是要知道，对于某些专家来说，在您的笔记本电脑中安装键盘记录器非常容易，或者只是制作硬盘驱动器的克隆副本，以便他们以后可以使用取证技术检测其中是否存在加密数据

- 给有螺丝的地方涂指甲油。

虽然这是一种很好的廉价方法，但它也可能会引起怀疑，因为它非常“引人注目”，并且可能只是表明你“有一些东西要隐藏”。因此，有更微妙的方法可以达到相同的结果。例如，您还可以对笔记本电脑的背面螺丝进行特写微距摄影，或者在其中一个看起来像普通污垢的螺丝内使用少量蜡烛蜡。然后，您可以通过将螺钉的照片与新螺钉的照片进行比较来检查是否被篡改。如果您的对手不够小心，他们的方向可能会发生一些变化（以与以前完全相同的方式收紧它们）。或者与以前相比，螺钉头底部的蜡可能已损坏。

在风险较高的环境中，请在定期使用笔记本电脑之前检查其是否被篡改。

## 出现grub rescue界面怎么修复？[原链接](https://sspai.com/post/55875)

1.列出硬盘分区
首先，使用 `ls` 命令列出所有分区：

系统会显示出硬盘的所有分区，例如：

`(hd0),(hd0,gpt0),(hd0,gpt1),(hd0,gpt2),(hd0,gpt3),(hd0,gpt4)`

2.找到 grub 文件夹所在分区
如果系统的「/boot」文件夹没有单独分区（大多数人应该是如此），那么使用 `ls (X,Y)/boot/grub` 命令浏览所有分区，其中 X 代表硬盘号，Y 代表分区号，如：

`ls (hd0,gpt3)/boot/grub`
如果系统没有报错，显示出了文件夹下面的文件，那么该分区就是我们要找的分区，记下硬盘号和分区号。

同样的，如果系统的「/boot」文件夹单独为一个分区或者上一条指令没有找到需要的分区，则使用 `ls (X,Y)/grub` 命令，其中 X 代表硬盘号，Y 代表分区号。

3.设置 grub 启动位置
输入`set`
就会出现
`set root=(hd0,gpt3)`
`set prefix=(hd0,gpt3)/boot/grub`
其它的笔记本可能会出现三行或者更多，只要使用`ls (X,Y)/boot/grub`
没有出现`error unknown filesystem` 那就把这个没报错的分区（假设是hd1,gpt8）
之前是
`root=(hd0,gpt3)`
`prefix=(hd0,gpt3)/boot/grub`
修改用
`set root=(hd1,gpt8)`
`set prefix=(hd1,gpt8)/boot/grub`

其中的硬盘号和分区号需要自行确定；grub 安装位置也需要自行确定，即第二行中，/boot/grub 根据需求替换为 /grub。

4.设置 grub 进入正常模式
通过以下命令，进入正常模式：

`insmod normal`
`normal`
至此，grub 由恢复模式进入了正常模式，丢失的启动菜单应该能正常显示了，可以通过 grub 引导至系统。

5.更新 grub 引导
如果此时重启，问题依旧存在。所以我们进入 Linux 系统后，需要马上更新 grub 引导，对 grub 进行修复。在进入 Linux 系统后，在终端执行：

`sudo update-grub`
`sudo grub-install /dev/sda`
至此，你可以重新启动，进入正常的引导界面了，丢失的引导就修复回来了。

## 关于高分屏的缩放
X11：kde桌面和win10一样，gnome42,终端输入`sudo apt install gnome-tweaks`
，重启 ，再打开终端输入`gnome-tweaks` ，字体，缩放比例 
wayland：先介绍xwayland是个兼容层，有些X11的软件在wayland下运行不了，就需要它。xwayland在kde下目前会糊，gnome42不会，使用方式和上面一样，我是调的1.36。不合适的就按照具体的情况调大调小即可。

## 如何在墙内部署一个tor的软路由？
死了这条心吧，tor不是用来选择代理的。

## 用doas代替sudo[参考](https://sspai.com/post/64843)
sudo的漏洞已经不用多说了
如果出现这个：

`doas: doas is not enabled, /etc/doas.conf: No such file or directory`

`vim /etc/doas.conf`

`permit johnsmith as root`（记得把johnsmith改为你的用户名）
