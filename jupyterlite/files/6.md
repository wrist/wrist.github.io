<!--
.. title: Travis CIによるNikolaブログ構築の自動化
.. slug: 6
.. date: 2018-07-15 18:25:00 UTC+09:00
.. tags: nikola, python, travisci
.. category: 
.. link: 
.. description: 
.. type: text
-->

## Travis CIによるNikolaブログ構築の自動化 ##

Nikolaでブログを構築するための方法は過去の記事([1](http://www.hiromasa.info/posts/1/), [2](http://www.hiromasa.info/posts/2/), [3](http://www.hiromasa.info/posts/3/))に書いていますが、手元でのビルドのためにpythonやnikolaがインストールされたPCが必要になるため、ブログ記事を書くための環境が限定されてしまうという問題がありました。
そこで、この記事では[Nikola公式の記事](https://getnikola.com/blog/automating-nikola-rebuilds-with-travis-ci.html)を参考に、Travis CIを用いることでsrcブランチにブログ記事をコミットするだけでTravis CI側で自動的にブログを構築し、masterブランチにプッシュしてくれる仕組みを構築する過程を紹介します。
なお、以下の作業はすべてsrcブランチ上で行います。

### `conf.py`の編集 ###

まず、`nikola github_deploy`コマンド実行時に、デプロイと同時にsrcブランチもコミットするかどうかを制御するためのオプションをFalseに設定します。

```python
GITHUB_COMMIT_SOURCE = False
```

これはTravis CIではソースブランチへのコミットをトリガーに`nikola build && nikola github_deploy`を実行するため、`nikola github_deploy`によってsrcブランチがコミットされると再度それがトリガーとなって無限ループに陥ってしまうことを防ぐためです。

### `.travis.yml`の作成 ###

nikolaブログのルートディレクトリ(`conf.py`が置いてあるディレクトリ)に以下のような`.travis.yml`ファイルを作成します。
これは[Nikola公式の記事](https://getnikola.com/blog/automating-nikola-rebuilds-with-travis-ci.html)に記載のtravis.ymlを改変したものになります。

※2019/4/8追記, [travis CIでのビルドに失敗する対策のissue](https://github.com/getnikola/nikola/issues/3237)の内容を反映

```yaml
language: python
cache: apt
sudo: false
addons:
  apt:
    packages:
    - language-pack-ja-base
    - language-pack-ja
branches:
  only:
  - src
python:
- 3.6
before_install:
- git config --global user.name 'USERNAME'
- git config --global user.email 'travis@invalid'
- git config --global push.default 'simple'
- pip install --upgrade pip wheel
- echo -e 'Host github.com\n    StrictHostKeyChecking no' >> ~/.ssh/config
- eval "$(ssh-agent -s)"
- chmod 600 id_rsa
- ssh-add id_rsa
- git remote rm origin
- git remote add origin git@github.com:USERNAME/REPO.git
- git fetch origin master
- git branch master FETCH_HEAD
install:
- pip install 'ghp-import2'
- pip install 'webassets'
- pip install -U --upgrade-strategy=eager 'Nikola[extras]'
script:
- nikola build && nikola github_deploy -m 'Nikola auto deploy [ci skip]'
notifications:
  email:
    on_success: change
    on_failure: always
```

ここで、

    - git config --global user.name 'USERNAME'
    - git config --global user.email 'travis@invalid'

の行は適切なユーザー名、メールアドレスに、

    - git remote add origin git@github.com:USERNAME/REPO.git

の行は適切なユーザー名およびリポジトリ名に変更する必要があります。

### SSH鍵の生成 ###

まず、`.gitignore`ファイルに`id_rsa`と`id_rsa.pub`を無視する設定を追記した上でSSH鍵を生成します。

```sh
$ echo id_rsa >> .gitignore
$ echo id_rsa.pub >> .gitignore
$ ssh-keygen -C TravisCI -f id_rsa -N ''
```

上記を実行すると秘密鍵`id_rsa`および公開鍵`id_rsa.pub`が作成されます。
念のため、`.gitignore`の無視設定が合っているかを確認するために`git status`を実行してもaddされる対象となっていないことを確認しておきましょう。
なお`ssh-keygen`の`-C`はコメント、`-f`は鍵名、`-N`はパスフレーズの指定(ここでは空文字なので指定なし)です。

### 公開鍵のgithubリポジトリへの登録 ###

生成した公開鍵はgithubリポジトリに登録しておく必要があります。
`リポジトリページ` -> `Settings` -> `Deploy Keys` -> `Add deploy key`
からTitleをTravis CIとし、Keyに`idrsa.pub`の中身をコピペして登録しましょう。
また、Allow write accessはチェックしておく必要があります。
これらの作業を忘れるとTravis CIの自動ビルド時にアクセスエラーが発生します。

### `travis encrypt-file`コマンドによる秘密鍵の暗号化 ###

生成した秘密鍵`id_rsa`は`travis encrypt-file`によって`id_rsa.enc`に共通鍵による暗号化を施した上でリポジトリに追加します。
この暗号化された`id_rsa.enc`はTravis CIでの自動ビルド時に共通鍵によって復号化され、Travis CIのgithubへのアクセスに使用されます。

この作業を実行するためにはtravisコマンドが必要となりますが、これはrubyのgemとして配布されているため、インストールされていない場合は下記にようにgemでインストールする必要があります。

```sh
$ gem install --user-install travis
```

なおtravisコマンドがインストールされる場所にPATHが通っていない場合はPATHに追加するか、下記一連のコマンドをフルパスで実行する必要があります。

travisコマンドが実行可能になったら、更に下記を実行します。

```sh
$ travis login
$ travis enable
$ travis encrypt-file id_rsa --add
```

`travis login`を実行するとgithubアカウントのユーザ名、パスワードを求められるため入力してください。
この上で`travis enable`を実行すると自動ビルドを有効化するリポジトリが正しいか確認されるため、正しければyesと入力しましょう。
更に`travis encrypt-file id_rsa --add`を実行すると、秘密鍵`id_rsa`が暗号化されて`id_rsa.enc`が生成されます。
この`id_rsa.enc`は`.gitignore`に追加されていないため、`git add`によってgitの管理下に置かれることになります。
なお引数の`--add`を付けておくと、`.travis.yml`ファイルに`id_rsa.enc`の復号化を行うための下記のようなopensslのコマンドを追加してくれます。

```yaml
before_install:
- openssl aes-256-cbc -K $encrypted_XXXXXX_key -iv $encrypted_XXXXXX_iv
  -in id_rsa.enc -out id_rsa -d
```

`-K`は共通鍵、`-iv`は初期ベクトルの指定であり、指定されている値はTravis CI側で環境変数として設定されています。
(ブラウザからTravis CIの設定を見ると確認することができます)

### srcブランチへの各種ファイルのadd, commitおよびgithubへのpush ###

以上の作業により`conf.py`、`.gitignore`、`.travis.yml`、`id_rsa.enc`の4つのファイルが編集・生成されているため、これをsrcブランチにaddした上でcommitし、更にremoteとなっているgithubにpushします。

```sh
$ git add .
$ git commit -am "Automate builds with Travis CI"
$ git push origin src
```

これによりTravis CIの自動ビルドが実行されるはずなので、あとはブラウザからTravis CIのページを確認し、ビルドが通っているかを確認するのが良いでしょう。

### 上記設定以降の記事の追加方法 ###

上記までで設定した方法によってsrcブランチが変更される度にTravis CIが`nikola build`および`nikola github_deploy`を行ってくれるようになったため、`posts`ディレクトリ以下に新規記事を追加したら、あとはこの新規記事をsrcブランチに`git add posts/XX.md`のように`git add`した上で`git commit`して、更にgithubに`git push origin src`すれば自動的にブログがビルドされます。

## 参考 ##

* 過去ポスト
    * [1](http://www.hiromasa.info/posts/1/)
    * [2](http://www.hiromasa.info/posts/2/)
    * [3](http://www.hiromasa.info/posts/3/)
* [Nikola公式の記事](https://getnikola.com/blog/automating-nikola-rebuilds-with-travis-ci.html)
