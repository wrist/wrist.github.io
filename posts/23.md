<!--
.. title: Ubuntu 18.04のSambaサーバー上にTimeMachineのバックアップ環境を構築
.. slug: 23
.. date: 2020-10-31 23:00:00 UTC+09:00
.. tags: samba,avahi-daemon,TimeMachine,ubuntu,MacOS
.. category: 
.. link: 
.. description: 
.. type: text
-->
## Ubuntu 18.04のSambaサーバー上にTimeMachineのバックアップ環境を構築

普段使用しているMacBook Proのバタフライキーボードにおいて特定のキーが繰り返し入力されたりバッテリーが膨張しつつあったりするようになってしまったため、TimeMachineを用いてバックアップを取ろうと思ったが、調べたところ最近のSambaでは特定の条件が揃えばネットワーク越しにバックアップを取ることが可能であることが分かったため、その際に設定した環境構築のメモを下記に記す。

## 手順

1. ppaを追加し新しめのバージョンのsambaを入れる
2. `/etc/samba/smbd.conf`を編集する
3. `avahi-daemon`の設定をする
4. sambaのdaemonをrestartする

## 1.ppaを追加し新しめのバージョンのsambaを入れる

2020/10/31現在、aptでインストールされるsambaはバージョン4.7.6であるが、
バージョン4.8以降でなければTimeMachineバックアップ用の設定ができないのでリポジトリを追加した上で新しいバージョンのsambaをインストールする。
[このQA](https://askubuntu.com/questions/1166875/unable-to-built-samba-4-10-6-from-source)のAnswerを参考に下記のようにppaを追加する。

```sh
$ sudo add-apt-repository ppa:linux-schools/samba-latest
$ sudo apt-get dist-upgrade
$ sudo apt-get install samba
```

バージョンは下記のように確認可能である。

```sh
$ smbd -V
> Version 4.10.18
```

## 2. `/etc/samba/smbd.conf`を編集する

様々なサイトを参考に下記のような項目を追加した(が不要な設定もあるかもしれない)。
pathは適宜共有したいディレクトリに書き換えること。また`fruit:time machine max size`の項目は適切なサイズを設定しておかないとTimeMachineはディスクをフルに使おうとしてしまうので注意が必要である。
正確な設定項目については[マニュアル](https://www.samba.org/samba/docs/current/man-html/vfs_fruit.8.html)を見たほうが良い。

```smb.conf
[global]

# Special configuration for Apple's Time Machine
vfs objects = catia fruit streams_xattr 
fruit:model = MacPro
fruit:advertise_fullsync = true
fruit:aapl = yes

[TimeMachine]
  comment = Backup for Mac Computers
  path = /path/to/share
  writable = yes
  browsable = yes
  guest ok = yes
  fruit:time machine = yes
  fruit:time machine max size = 600G
  durable handles = yes
  kernel oplocks = no
  kernel share modes = no
  posix locking = no
```

## 3. `avahi-daemon`の設定をする

上記設定を施したのちにsambaのデーモンを再起動した時点で使えるかと思ったがどうやら別途`avahi-daemon`(mDNS)の設定をしなければならなかったことが分かった。
[この記事](https://www.samba.org/samba/docs/current/man-html/vfs_fruit.8.html)を参考に下記のような設定を記述したファイルを`/etc/avahi/services/timemachine.service`として作成した。
なおここでは`avahi-daemon`自体はaptで別途インストール済みであることを想定している。

```xml
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
 <name replace-wildcards="yes">%h</name>
 <service>
   <type>_smb._tcp</type>
   <port>445</port>
 </service>
 <service>
   <type>_adisk._tcp</type>
   <txt-record>dk0=adVN=TimeMachine,adVF=0x82</txt-record>
 </service>
</service-group>
```

ここで`<txt-record>dk0=adVN=TimeMachine,adVF=0x82</txt-record>`の`TimeMachine`となっている部分は`/etc/samba/smb.conf`の共有名と共通にしておく必要がある。

## 4. sambaのdaemonをrestartしMacOSからTimeMachineを実行

3までを実施した後で、`sudo systemctl restart avahi-daemon`および`sudo systemctl restart smbd`を実行しavahi-daemonとsmbdをrestartさせると
MacOS(手元のマシンはCatalina 10.15.7)のシステム環境設定にあるTimeMachineの`ディスクを選択`の項目から設定したディスクが探せるようになっているはずである。
保存先として設定するとIDとパスワードを入力するダイアログが出るため書き込み権限のあるユーザーIDを打ち込むとバックアップが進行するようになった。

## 参考にさせていただいたサイト

* https://askubuntu.com/questions/1166875/unable-to-built-samba-4-10-6-from-source
    * ppaからのsambaをインストールする際の参考にしました
* https://ideal-reality.com/computer/server/time-machine-samba/
    * 設定の参考にしました
* https://qiita.com/upsilon/items/c368726845f89cb0ffe9
    * `avahi`の設定を参考にしました
