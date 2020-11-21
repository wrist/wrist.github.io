<!--
.. title: Debian 10 busterを初代Mac mini (A1176; 2006)にインストール
.. slug: 24
.. date: 2020-11-22 00:00:00 UTC+09:00
.. tags: softether,vpn,samba,debian
.. category: 
.. link: 
.. description: 
.. type: text
-->
# Debian 10 busterを初代Mac mini (A1176; 2006)にインストール

## 経緯

[前回の記事](https://www.hiromasa.info/posts/23/)を書いた後にUbuntu 18.04がインストールされていたMacBook Pro 2009のトラックパッドがバッテリー膨張による圧力によって割れるという惨事が発生してしまった。
このMacBook Proは以前に一度ファンとバッテリーを自力で換装したことがあるものであり、もう限界と判断して押入れに眠っていたMac mini 2006(大学の先輩から2万円で譲ってもらったもの)を復活させることを決意したのであった。

![白昼夢の惨劇](/images/24/broken_mbp.jpg)

### ディストリビューションの選択

当初はarch linuxを入れようかと思い、`x86_64`のISOイメージをUSBに焼いてインストールしようとしたが、このタイミングでこのマシンのCPUが`x86_64`ではなく`i686`、つまり32bit CPUであるということが発覚した。
2020年にもなり32bit CPUのマシンを稼働させることに躊躇いもあったが、調べたところUbuntuが32bit対応の廃止を表明している一方でDebianは32bit対応のイメージを今でも配布しているということもありインストールすることを決めた。

### マシンのスペック

[ここ](https://www.apple.com/jp/support/datasheet/desktop/macmini_607_608.html)に載っている1.66GHzのCPUを積んでいるものである。

* CPU
    * 1.66GHz Core Duo
* メモリ
    * 2GB(DDR2; 667MHz)
* ディスク容量
    * 60GB

ちなみに[この記事](http://www.nextro.com/directworld/cms/%E3%81%84%E3%81%BE%E3%81%95%E3%82%89%E5%88%9D%E4%BB%A3-intel-mac-mini-a1176-%EF%BC%882006%EF%BC%89%E3%83%95%E3%82%A1%E3%83%BC%E3%83%A0%E3%82%A6%E3%82%A7%E3%82%A2-1-1-%E3%81%8B%E3%82%89-2-1-%E3%81%AB/)によればファームウェアをアップデートした場合CPUの換装や4GBまでのメモリの増設が可能になるらしい。

### 想定使用用途

* ファイルサーバ
    * 外付けHDDにもともと保存していたデータに対してsambaでアクセスしたいため
* VPNサーバ
    * 移行元マシンで稼働していたSoftEtherの設定を引き継ぐ

---

## 実際の作業

全般的に自分用のメモ書きである。

### DebianのISOをUSBに焼く

ここでは`debian-10.6.0-i386-netinst.iso`を公式から落としてきてUSBメモリに書き込んだ。
この作業は今回使用するMac miniではない別のマシンで行っている。

```sh
$ df -hか何かでUSBメモリのデバイスのパスを確認する(ここでは`/dev/disk4`)
$ diskutil umountDisk /dev/disk4
$ sudo dd if=debian-10.6.0-i386-netinst.iso of=/dev/rdisk4  # /dev/rdisk4, とrを付けると早く書き込まれるらしい
```

---

### Mac mini上での作業

#### rEFIndのインストール

mac miniのosx側で予めrEFIndをインストールしておく。
rEFIndに同梱のインストールスクリプトを実行した上で再起動すると起動時にrEFIndが立ち上がるはずである。
ちなみにmac miniに入っていたosxのバージョンはLepardであった。

#### mac mini側のディスクユーティリティでosxのパーティションサイズを縮小しておく

HFS+フォーマットのosxがインストールされた領域のサイズを20GB程度に縮小した。
残りの領域についてはこの時点でフォーマットなどは実施しない(GUIインストーラの実行時にやってくれるため)。

#### GUIインストーラによるDebianのインストール

rEFIndが使えるようになるとUSBメモリに焼いたbootableイメージからインストーラを起動することが可能となる。
GUIインストーラで提示された項目を選んでいくだけで基本的には問題なくインストールは完了した。
パーティションは予めosx側で分割した残りの空き領域に対しインストーラが自動的にroot, var, tmp, swap, homeを分割してくれたのでその通りにした。LVMは使っていない。ファイルシステムはext4になっている。
デスクトップ環境はメモリが2GBしかなく必要かどうか悩んだがxfce4とした。
SSHサーバもインストーラの選択肢で選べたためインストールしておく。
よって基本的にこれ以降の作業はSSH越しの作業である。

---

### ルーターの固定IP割当設定

以降でローカルLAN内でIPアドレスを固定化するためにルーターの割当設定を行っておく。
Debian上で`ip addr`でMACアドレスを表示させ、有線LANのNICとWiFiアダプタに対して固定IP割当を設定。

---

### Debian起動直後における設定

#### sudoグループへの所属

インストール時に登録したユーザーがデフォルトではsudoを使えないため、一度suでrootユーザになった上でsudoグループに所属させる。
`$`は一般ユーザ、`#`はrootユーザでの実行を意味する。

```sh
$ su
# gpasswd -a ${username} sudo
# exit
```

#### SSHの設定

鍵認証による接続を行うために公開鍵の登録をした後に`/etc/ssh/sshd_config`を編集する。
公開鍵はクライアント側から`ssh-copy-id -i id_rsa.pub ${ipaddr}`で転送しても良いが、GitHubに登録してある公開鍵を使う場合は`wget https://github.com/${username}.keys -qO - >> ~/.ssh/authorized_keys`で`authorized_keys`に追記しても良い。

次に`sudo vi /etc/ssh/sshd_config`に下記項目を設定する。

```sshd_config
Port ポート番号  # 変更したい場合
PubkeyAuthentication yes
PermitRootLogin no
PermitEmptyPasswords no
PasswordAuthentication no
```

設定後、`sudo systemctl restart sshd`でsshdを再起動する。

このタイミングで他のターミナルからsshしてパスワードログインができなくなっていることを確認する。
(元々接続していたターミナルでexitしてしまうと再度接続できなくなってしまったときに困る)。

その後に、クライアント側で`~/.ssh/config`を下記のように編集しておくと`ssh hostname`で接続できるようになるため便利である。

```ssh_config
Host hostname
    HostName ${ipaddr}
    Port ポート番号
    preferredauthentications publickey
    IdentityFile "/path/to/id_rsa"
```

#### ホームディレクトリ配下の日本語ディレクトリの英語化

セットアップ時に日本語を選択するとホームディレクトリ配下の各種ディレクトリが日本語になってしまっている場合がある。
その場合は`LC_ALL=C xdg-user-dirs-gtk-update --force`を実行して英語ディレクトリを作成する。
日本語ディレクトリはそのまま残ってしまうため不要であれば消す。

#### aptで色々入れる

とりあえず最低限のパッケージと[前回の記事](https://www.hiromasa.info/posts/23/)で書いたように最新版のsambaを使うためのppaを追加する。
最初にインストールする`software-properties-common`はdebianで`add-apt-repository`を使うために必要である。

```sh
$ sudo apt update
$ sudo apt upgrade
$ sudo apt install -y software-properties-common
$ sudo add-apt-repository ppa:linux-schools/samba-latest
$ sudo apt dist-upgrade
$ sudo apt install -y git vim zsh tmux curl htop
$ sudo apt install -y samba
$ sudo apt install -y build-essential autotools-dev libtool automake autoconf autogen
```

---

### シェル環境周りの設定

#### tmuxの設定

`.tmux.conf`を作成し`C-t`をprefixキーとするために下記のような`.tmux.conf`を`~`以下に配置した。

```.tmux.conf
unbind C-b
set-option -g prefix C-t
set-window-option -g mode-keys vi
bind C-t send-prefix
```

#### シェルをzshに変える

```sh
$ chsh  # /bin/zshを指定
```

再ログインすると色々zshの設定に関する対話スクリプトが走るが、blankファイルだけ生成して脱出した。
その上で下記のような設定を`.zshrc`に記述した。
内容自体は他マシンにおける設定の使い回しであるため各自好きに変更すると良いと思う。

```zshrc
setopt autopushd
setopt auto_cd

WORDCHARS='*?_-.[]~=&;!#$%^(){}<>'

compctl -M 'm:{a-z}={A-Z}'

setopt IGNOREEOF

umask 002

HISTFILE=$HOME/.zsh-history
HISTSIZE=10000
SAVEHIST=10000

setopt hist_ignore_dups # ignore duplication command history
setopt extended_history
setopt share_history
function history-all { history -E 1 }

# bind
bindkey -e
bindkey '^P' history-beginning-search-backward
bindkey '^N' history-beginning-search-forward

setopt no_check_jobs
setopt no_hup

setopt print_eight_bit

export LSCOLORS=gxfxcxdxbxegedadagacad
zstyle ':completion:*:default' list-colors $LSCOLORS

alias ls="ls -vG"
alias la='ls -aF'
alias ll='ls -h -laF'

alias mv='mv -v'
alias cp='cp -v'
alias rm='rm -vi'
alias grep='grep --color'

alias du='du -h'
alias df='df -h'

autoload -U compinit
compinit -u

autoload colors
colors

# VCS settings
# http://liosk.blog103.fc2.com/blog-entry-209.html
autoload -Uz vcs_info
precmd() {
	psvar=()
	LANG=en_US.UTF-8 vcs_info
	psvar[1]=$vcs_info_msg_0_
}

PROMPT="%{${fg[green]}%}[%n@%m %*] %{${fg[magenta]}%}%(!.#.>) %{${reset_color}%}"
PROMPT2="%{${fg[cyan]}%}%_> %{${reset_color}%}"
SPROMPT="%{${fg[red]}%}correct: %R -> %r %{${reset_color}%}"
RPROMPT="%{${fg[green]}%}[%{${fg[red]}%}%~%{${fg[white]}%}%1v%{${fg[green]}%}]%{${reset_color}%}"
```

ちなみに最近はプロンプトに`starship`を使っているが、このマシンでインストールしようとしても失敗したので独自に設定している。

---

### ファイルサーバ(samba)関連の設定

#### fstabの設定

外付けHDDのUUIDを調べてシステム起動時に自動的にマウントされるように設定する。

```sh
$ sudo blkid -o list  # UUIDを調べる
$ sudo mkdir /mnt/hdd /mnt/hdd2  # マウントポイントを作成
$ sudo vim /etc/fstab
```

fstabには下記のような感じで書く。`${uuidN}`の部分は上記で調べたものに置き換えること。

```fstab
UUID="${uuid1}" /mnt/hdd hfsplus nofail,defaults,force 0 0
UUID="${uuid2}" /mnt/hdd2 ext4 nofail,defaults 0 0
```

記述後、再起動して無事にマウントされているかを確認する。
nofailの記述は仮にマウントできなかった場合であってもエラーとして扱わないための指定である。
(実際、hfsplusフォーマットのディスクのマウントは`sudo apt install hfsprogs`が必要であったためこの記述を付けていない場合にemergency modeに突入してしまった。)

UUIDは外付けHDDに固有であるためか以前と変わっていなかったため、引き継ぎ元のマシンのfstabの追記内容をそのまま使い回すことができた。

#### `/etc/smb.conf`の設定およびavahi-daemonの設定をする

詳細は割愛するが[前回の記事](https://www.hiromasa.info/posts/23/)を参考のこと。
ここも`smb.conf`内のinterface名を変えたぐらいで基本的に元の設定ファイルをそのまま使い回すことができた。

#### sambaアクセス用のユーザーを追加する

`guest ok`にしていてもTimeMachineバックアップの時には書き込み権限を持ったユーザーが登録されている必要があったので下記で設定しておく。

`sudo smbpasswd -a ${username}`

---

### VPNサーバーの設定

#### SoftEtherの32bit対応版をダウンロードしてビルドする

[ここ](http://www.softether-download.com/ja.aspx?product=softether)から条件に合うものを落としてきてmakeする。makeの際にライセンスの同意などを求められる。
ビルドした後は`/usr/local`に移動しておく。

```sh
$ wget https://jp.softether-download.com/files/softether/v4.34-9745-rtm-2020.04.05-tree/Linux/SoftEther_VPN_Server/32bit_-_Intel_x86/softether-vpnserver-v4.34-9745-rtm-2020.04.05-linux-x86-32bit.tar.gz
$ tar zxvf softether-vpnserver-v4.34-9745-rtm-2020.04.05-linux-x86-32bit.tar.gz
$ cd vpnserver
$ make
$ cd ..
$ mv vpnserver /usr/local/
```

#### systemdの設定

`/etc/systemd/system/vpnserver.service`として下記ファイルを作成する。

```systemd
[Unit]
Description=SoftEther VPN Server
After=network.target network-online.target

[Service]
ExecStart=/usr/local/vpnserver/vpnserver start
ExecStop=/usr/local/vpnserver/vpnserver stop
Type=forking
RestartSec=3s

[Install]
WantedBy=multi-user.target
```

#### bridgeとtapデバイスの作成

下記のようなスクリプトを作成しsudoで実行する。

```sh
#!/bin/bash
# vim:fileencoding=utf-8

ip_addr="192.168.xxx.xxx/xx"
gateway_addr="192.168.xxx.xxx"
interface="enp1s0"

bridge_name="br0"
tap_device_name="tap_softether"

echo "create bridge interface"
/usr/bin/nmcli connection add type bridge ifname ${bridge_name}
echo "disable STP"
/usr/bin/nmcli connection modify bridge-${bridge_name} bridge.stp no
echo "modify bridge"
/usr/bin/nmcli connection modify bridge-${bridge_name} ipv4.method manual ipv4.addresses ${ip_addr} ipv4.gateway ${gateway_addr}
echo "connect ${interface} to bridge"
/usr/bin/nmcli connection add type bridge-slave ifname ${interface} master bridge-${bridge_name}
echo "connect tap to bridge"
/usr/bin/nmcli connection add type bridge-slave ifname ${tap_device_name} master bridge-${bridge_name}
echo "up tap device"
/usr/bin/nmcli connection up bridge-${bridge_name}
```

上記を実行すると下記のような出力が出る。

```
create bridge interface
接続 'bridge-br0' (0aa0ae96-6428-4f7e-bc1c-fa6f22f98cea) が正常に追加されました。
disable STP
modify bridge
connect enp1s0 to bridge
接続 'bridge-slave-enp1s0' (ec87d050-f6ae-4ca8-adbf-7b1f0e4eb1b6) が正常に追加されました。
connect tap to bridge
接続 'bridge-slave-tap_softether' (f262c26c-2799-4c9b-b149-9d1b3c44f8ce) が正常に追加されました。
up tap device
接続が正常にアクティベートされました (master waiting for slaves) (D-Bus アクティブパス: /org/freedesktop/NetworkManager/ActiveConnection/3)
```

この後に再起動を行い、`ip addr`でIPアドレスが割り振られていたり、`ip link show`でbr0のSTATEがUpになっていれば問題ないと思われる。

なお`sudo apt install bridge-utils`を実行すると `/sbin/brctl`が使えるようになるが、今回は直接は不要であった。
また上記スクリプトではnmcliを使っているがipコマンドでもどうやら作成できるらしい。

#### VPNサーバーの設定の読み込み

移行元で予め`vpncmd`のConfigGetを実行し保存しておく。
これは

```sh
$ /usr/local/vpnserver/vpncmd
  > * 1. VPN Server または VPN Bridgeの管理 を実行
  > * 何も指定せずにEnterを押すことでローカルのサーバーに接続
  > * 更に何も指定せずにEnterを押すことでサーバー管理モードに入る
  > * 管理パスワードを入力
  VPN Server> ConfigGet 保存先パス
```

と実行することで保存が可能である。この設定ファイルを引き継ぎ先のマシンで読み込ませることを考える。

まず、`sudo systemctl enable vpnserver`を実行し前述のsystemd用の設定によるサービスを有効化する。
続いて`sudo systemctl start vpnserver`でVPNサーバーを起動する。

この上で`/usr/local/vpnserver/vpncmd`を実行し、移行元での保存時と同様に1を指定の上で無指定でEnterを2回実行することでサーバー管理モードに入る。
ここで`ConfigSet`を実行すると設定ファイルのパスを尋ねられるので、入力することで設定の読み込みが可能である。
[ここ](https://ja.softether.org/4-docs/1-manual/3/3.3#.E5.88.A5.E3.81.AE.E3.82.B3.E3.83.B3.E3.83.94.E3.83.A5.E3.83.BC.E3.82.BF.E3.81.B8.E3.81.AE.E3.82.B3.E3.83.B3.E3.83.95.E3.82.A3.E3.82.B0.E3.83.AC.E3.83.BC.E3.82.B7.E3.83.A7.E3.83.B3.E3.83.95.E3.82.A1.E3.82.A4.E3.83.AB.E3.81.AE.E7.A7.BB.E5.8B.95)によればこの時点で元マシンの環境は復元できるとのことである。

#### ルーターで通信に必要なポートを開放する

50, 51, 500, 4500番ポートの通信をホストマシンのIPアドレスに対して許可するようにルーターの設定を施した。

#### 接続できない原因を探す

元マシンでの設定が正しければ上記までの設定で接続できるようになるはずだが案の定接続できない。
そこで`/usr/local/vpnserver`以下に存在する`secure_log`や`server_log`といったログ見て原因を推察する。
ここでは`server_log`以下に存在するlogにおける

```txt
2020-11-21 xx:xx:xx.xxx L2TP PPP セッション [xxx.xxx.xxx.xxx:xxxx]:
  DHCP サーバーからの IP アドレスの取得に失敗しました。
  PPP の通信を受諾するためには DHCP サーバーが必要です。
  仮想 HUB の Ethernet セグメント上で DHCP サーバーが正しく動作しているかどうか確認してください。
  DHCP サーバーを用意することができない場合は、仮想 HUB の SecureNAT 機能を用いることもできます。
```

という記述から`SecureNat`が有効化されていないことが分かったため、`vpncmd`を実行し仮想ハブの管理から`SecureNatEnable`を実行したところ、無事に接続されるようになった。

---

## まとめ

古いMac miniにDebianを入れてファイルサーバ・VPNサーバとして復活させる手順のメモを記した。
稼働させたばかりであり、そもそも古いマシンであるため、いつまで持つか不明であるがこのまましばらく運用してみようと思う。
