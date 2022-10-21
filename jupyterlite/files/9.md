<!--
.. title: osx high sierraからSMBに接続できない問題の解決
.. slug: 9
.. date: 2018-09-02 11:01:00 UTC+09:00
.. tags: osx,samba
.. category: 
.. link: 
.. description: 
.. type: text
-->

## osx high sierraからSMBに接続できない問題の解決 ##

2018/8/26に突然自宅Ubuntuで立てているファイルサーバで動作しているSambaにアクセスできなくなったためその原因を調べた。

### 現象 ###

* ubuntu上のsambaサービスで提供している共有フォルダにアクセスしようとするとその瞬間接続できない
* 自宅nasneや無線LANルータ上で動作しているsmbに関しても全く同じ症状で接続できない
* MacBookPro自体を再起動しても解決しない
* コンソール.appで確認したところ、接続時に諸々のエラーが生じていた
    * `SDSharePointBrowser::handleOpenCallBack returned 2`
    * `NetAuthSysAgent 1025`
        * 「そのようなファイルやディレクトリは存在しない」的なエラーが出ていた

### 解決方法 ###

`NetAuthSysAgent 1025`でググって出てきた[stackexchangeの回答](https://apple.stackexchange.com/questions/257836/mac-mini-cant-connect-to-my-corporate-smb-server-was-working-some-days-ago)で解決した。
上記の記事いわく、Android SDKを過去にインストールした際などに入るアクセラレータであるHAXMのカーネルエクステンションがインストールされていることが原因であるとのことであり、

```sh
$ kextstat | grep -iv apple
```

の出力に`intelhaxm`が含まれている場合がそれに該当する。
現時点でAndroid SDK自体をもはや使っていないため、下記を実行してアンインストールした。

```sh
$ sudo /Library/Extensions/intelhaxm.kext/Contents/Resources/uninstall.sh
```

アンインストール後、再起動すれば接続できるようになった。

### 具体的なコマンド実行履歴 ###

`192.168.XX.XX`はsambaが動いているホストのIPアドレスであり、`smbutil view`は指定した`smb`プロトコルによる接続先が見えているかの確認である。

```sh
[wrist@wrist-pro 16:04:33] > smbutil view smb://192.168.XX.XX                      [~]
smbutil: server connection failed: No such file or directory
[wrist@wrist-pro 16:05:48] > kextstat                                              [~]
[wrist@wrist-pro 16:06:06] > kextstat | grep -iv apple                             [~]
Index Refs Address            Size       Wired      Name (Version) UUID <Linked Against>
  ...
  163    0 0xffffff7f83735000 0x14000    0x14000    com.intel.kext.intelhaxm (6.0.1) 8FF2C637-0A5E-367E-B007-5B08655B1E8A <7 5 4 3 1>
  ...
[wrist@wrist-pro 16:07:58] > sudo /Library/Extensions/intelhaxm.kext/Contents/Resources/uninstall.sh                                                                          [~]

This will remove Intel(R) HAXM from your computer.

Important: Removing Intel HAXM will disable acceleration of all Intel(R) x86
Android emulators. Your Android Virtual Devices will continue to function, but
will no longer be accelerated.
Installing Intel HAXM again will re-enable Android emulator acceleration.

Warning: Please close all instances of the Android x86 emulator before
proceeding.

Do you wish to uninstall Intel HAXM (y/n)? y
Removing Intel HAXM files

Intel HAXM has been successfully uninstalled
```
