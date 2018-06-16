<!--
.. title: Nikolaでブログ構築してGithub Pagesに設置
.. slug: 1
.. date: 2018-01-07 23:35:28 UTC+09:00
.. tags: nikola, python, github
.. category: 
.. link: 
.. description: 
.. type: text
-->

## Nikolaとは ##

Python製のstatic site generator。python製だとpelicanの方が有名だがipynbが使えると聞いたのでこちらを使うことにした。

## Nikolaでブログを生成 ##

### インストール ###

pipでインストールできる。

```sh
$ pip install nikola
$ pip install webassets
```

後述するbuildの際などに下記のようなメッセージが出るので合わせてwebassetsもインストールしておくと良い。

```
[2018-01-08T01:42:01Z] WARNING: Nikola: In order to USE_BUNDLES, you must install the "webassets" Python package.
[2018-01-08T01:42:01Z] WARNING: bundles: Setting USE_BUNDLES to False.
```


### ブログの雛形生成 ###

nikolaはgitのように`nikola サブコマンド`の形式で様々なコマンドを実行できる。
雛形の生成のためには`nikola init`を実行する。

```sh
nikola init blog_name
```

これを実行するとCUIベースで対話的に様々な設定が可能。
commentシステムとして何を使うかを聞かれるが、後でconf.pyを書き換えれば設定が可能な模様であるため一旦は空白で良い。

なお[Getting Started](https://getnikola.com/getting-started.html)ではinitの際に引数に`--demo`を付けているが、
この引数を付けるとデモ用コンテンツが生成されてしまうので普通に真っさらな状態で始めたいならば付けない方が良い。

### 新記事生成 ###

新記事生成は下記の通り。

```sh
$ nikola new_post -f markdown  # formatを-fで指定(デフォルトはReStructuredText形式)
```

実行すると記事タイトルを聞かれるので打ち込むと`-f`で指定した形式のファイルがposts以下に生成される。
また、引数に`-e`を付けるとそのままエディタでの編集画面となる。

生成されたファイルの冒頭には下記のような形のヘッダーが付いている。

```
<!--
.. title: Nikolaでブログ構築してGithub Pagesに設置
.. slug: 1
.. date: 2018-01-07 23:35:28 UTC+09:00
.. tags: nikola, python, github
.. category: 
.. link: 
.. description: 
.. type: text
-->
```

titleは記事タイトルである。
slugはurlの一部となる文字列である。記事タイトルをアルファベットに直したものが記載されているが、適当に修正すると良い。1にしておくと`http://www.hiromasa.info/1/`のようなURLとなる。

### 固定ページ生成 ###

固定ページはpostではなくpageとして生成する。

```sh
$ nikola new_page -f markdown pages/about
```

生成した固定ページを上部ナビゲーションに配置する方法は下記のように`conf.py`の`NAVIGATION_LINKS`に書けば良い。

```python
NAVIGATION_LINKS = {
    DEFAULT_LANG: (
        ("/archive.html", "文書一覧"),
        ("/categories/", "タグ"),
        ("/pages/about/index.html", "About"),
        ("/rss.xml", "RSSフィード"),
    ),
}
```

### ブログ構築 ###

postやpageを上記のように生成しただけでは単なるテキストが生成されているだけなので、これらを元にブログを構築する。

```sh
$ nikola build
```

これでブログが構築される。
ローカルで確認するためには下記を実行する。

``` sh
$ nikola serve -b  # --browserでも良い
```

### ブログテーマ設定 ###

デフォルトはbootstrap3になるようであるが、他のものに変えたい場合は[themes](https://themes.getnikola.com/)のページから好きなものを選ぶ。
ここでは[libretto](https://themes.getnikola.com/v7/libretto/)のテーマを選んだ。
wordpressの同名テーマをベースにしたものらしい。

テーマのインストールは下記の通り。

```sh
$ nikola theme -i libretto
```

実行するとthemesディレクトリ以下にlibrettoのテーマがダウンロードされる。

このテーマを使用するためには更にconf.pyを編集する必要がある。

```python
# Name of the theme to use.
# THEME = "bootstrap3"
THEME = "libretto"
```

この上で`nikola build`を実行すれば更新後のテーマに変わっている。
記事の一文字目だけ大きく表示されるのが若干気に入らないがとりあえずこれで行く。

※2017/1/8追記、librettoだとsyntax highlightが効かないようなのでbootstrap4のテーマに変えた

## Github Pagesに配置 ##

[HandbookのDeployment](https://getnikola.com/handbook.html#deployment)の項を見るとGithubでホスティングする方法が記載されている。ここではGitHubのuser page(wrist.github.io)に配置することを考える。

### 1. gitリポジトリの設定を行う ###

  過去にwrist.github.ioリポジトリを作成しているため、ブログのルートで`git init`してからremoteを設定する。

```sh
$ git init
$ git remote add origin git@github.com:wrist/wrist.github.io
```

### 2. (必要であれば)conf.pyを編集する ###

  必要であれば下記を編集する。今回は不要であるため特に変更していない。

```python
# siteのソースがdeployされるブランチ名、srcが推奨とのこと
GITHUB_SOURCE_BRANCH = 'src'
# HTMLファイルがdeployされるブランチ、user pageの場合はmaster
GITHUB_DEPLOY_BRANCH = 'master'
# gitのremote名
GITHUB_REMOTE_NAME = 'origin'
# ソースブランチを自動的にコミットしプッシュするかの設定
GITHUB_COMMIT_SOURCE = True
```

### 3. .gitignoreを追加 ###

  下記内容を.gitignoreに追加する。

```.gitignore
cache
.doit.db
__pycache__
output
```

### 4. deploy用のコマンドを実行 ###

  下記コマンドを実行することでdeployが可能。

```sh
$ nikola github_deploy
```

下記のように表示された場合は`pip install ghp-import2`でghp-import2をインストールする。

```
[2018-01-08T04:16:04Z] ERROR: Nikola: In order to deploy the site to GitHub Pages, you must install the "ghp-import2" Python package.
[2018-01-08T04:16:04Z] ERROR: Nikola: Exiting due to missing dependencies.
```

通常はこれで改めて`nikola github_deploy`を実行すれば終わりのはずである。
しかし、今回は過去に作成済の既にmasterが存在しているリポジトリにpushしようとしているため、当然先にfetchしろと警告が出て失敗する。

```sh
[2018-01-08T04:17:10Z] INFO: github_deploy: ==> ['ghp-import', '-n', '-m', 'Nikola auto commit.\n\nSource commit: a37690e35a31dc4a108f53c62b8ee17e783aa28f\nNikola version: 7.8.11', '-p', '-r', 'origin', '-b', 'master', 'output']
To github.com:wrist/wrist.github.io
 ! [rejected]        master -> master (fetch first)
error: failed to push some refs to 'git@github.com:wrist/wrist.github.io'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. This is usually caused by another repository pushing
hint: to the same ref. You may want to first integrate the remote changes
hint: (e.g., 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

仕方ないので[この記事](https://rcmdnk.com/blog/2013/11/01/computer-git/)に倣い、先にmasterを強制pushする。

```sh
$ git push -f origin master
$ nikola github_deploy
```

これにて無事に`http://wrist.github.io`で閲覧できるようになった。


### 5. 独自ドメインでの使用 ###

github pagesを独自ドメインで使用する場合にはCNAMEファイルを[リポジトリのルートに配置しておく必要がある](https://qiita.com/nabettu/items/d11ac5ad42059626a687)が、このためにnikolaではソースブランチのfilesの下にCNAMEファイルを配置しておけば、これをbuild時にoutputディレクトリにコピーしてくれる。

## コメントシステムの設置 ##

init時には空白にしておいたコメントシステムを有効化する。
ここではdisqusを用いることにする。`conf.py`に下記を追記する。

```python
COMMENT_SYSTEM = "disqus"
COMMENT_SYSTEM_ID = "hiromasa-info"
```

`COMMENT_SYSTEM_ID`はdisqusの場合はshortnameを設定する。
shortnameはdisqusのsiteのsettingsから確認できる。

## その他 ##

記事のデフォルト形式をmarkdownに変えたいが方法が分からないため[Handbook](https://getnikola.com/handbook.html)を読んでもう少し調べる必要があるが、
ReStructuredTextで書くとExtensionとして[いくつかのdirectiveやroleが使える](https://getnikola.com/handbook.html#restructuredtext-extensions)ようでもあるため、もう少し使ってみてから考えたい。


## 参考 ##

* [Handbook](https://getnikola.com/handbook.html)
* [drillerさんによる基本的な使い方の記事](https://qiita.com/driller/items/4d998ca765717c7e0a6c)
* [ipynb形式を扱う方法](https://qiita.com/driller/items/2f8a0dd66d4d8e59e05c)
* [markdown周りの設定](http://iuk.hateblo.jp/entry/2016/10/27/024802)
