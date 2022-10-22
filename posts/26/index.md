<!--
.. title: 2022/10/22 PyData Osaka #026における JupyterLite関連の紹介記事
.. slug: 26
.. date: 2022-10-22 00:00:00 UTC+09:00
.. tags: jupyterlite
.. category: 
.. link: 
.. description: 
.. type: text
-->

# 2022/10/22 PyData Osaka Meetup #026におけるJupyterLite関連の紹介記事

本記事はタイトルの通り[PyData Osaka Meetup #026](https://pydataosaka.connpass.com/event/261492/)で使用する、主にJupyterLiteについて紹介するための記事となります。

## Jupyterliteに関する翻訳記事の紹介(前半)

[このリポジトリ](https://github.com/PyDataOsaka/jupyterblog-translation)で翻訳した内容を[Medium](https://medium.com/pydata-osaka)へと転記しています。
StarやMediumでのフォローをよろしくお願いします。
本日のイベントでは下記ブログ記事を読んでいきます。

* [jupyterlite loves webassembly](https://github.com/PyDataOsaka/jupyterblog-translation/blob/main/posts/2021-07-13-jupyterlite-loves-webassembly.md)
* [mamba meets jupyterlite](https://github.com/PyDataOsaka/jupyterblog-translation/blob/main/posts/2022-07-14-mamba_meets_jupyterlite.md)

また、翻訳が間に合っておりませんが、下記2つの記事についても触れる予定です。

* [Jupyter Everywhere](https://blog.jupyter.org/jupyter-everywhere-f8151c2cc6e8)
    * ウェブページにコンソールやnotebookを埋め込む方法について書かれています
* [Xeus lite](https://blog.jupyter.org/xeus-lite-379e96bb199d)
    * カーネルを作成するためのC++ライブラリであるXeusをJupyterliteで使うための話が載っています。

上記についても将来的に翻訳したいと考えているため、回を分けて紹介するかもしれません。

## nikolaブログの記事をコンテンツとして追加した状態でjupyterlite静的サイトを作る方法(後半)

本ブログはmarkdownとipynbで書かれていますが、これらの記事を追加した状態でjupyterliteの静的サイトをGitHub actionsで生成し、公開する例を紹介します。

### 仕組みの概要

* [ブログのsrcブランチ](https://github.com/wrist/wrist.github.io/tree/src)の内容を元に静的ブログをビルド(static site generatorのnikolaを使用)
* [このワークフロー](https://github.com/wrist/wrist.github.io/blob/src/.github/workflows/build.yml)でブログ構築およびjupyterlite生成を自動化
    * [このリポジトリに従って作成されたDockerイメージ](https://github.com/wrist/docker-jupyterlab-custom)を用いてワークフローを実行
    * jupyterliteを静的アセットとして動的に生成した上で、nikolaブログのビルドを行い、デプロイを実行
    * jupyterliteの生成のためには[このスクリプト](https://github.com/wrist/wrist.github.io/blob/src/generate_jupyterlite.sh)を実行
        * `jupyter lite`コマンドのオプションは[ここ](https://jupyterlite.readthedocs.io/en/latest/reference/cli.html)を参照

### jupyterlab-wav

[このリポジトリ](https://github.com/wrist/jupyterlab-wav)で公開しているjupyterlab向けの波形可視化エクステンションがありますが、
dockerでの実行環境内に存在している場合(actionsのworkflow内でpip installしている場合)は、federated extensionとして使用可能な状態になっているはずですので紹介します。

### GitHub Actions設定時に遭遇したトラブルと対策

#### `actions/checkout@v3`で`EACCESS: permission denied`などとエラーが出てチェックアウトできない

[ここ](https://github.com/actions/checkout/issues/841)を見て解決しましたが、コンテナ内でチェックアウトする場合は所有権の問題でチェックアウトできないようで、下記のように`options: --user root`を付けてroot実行が必要でした。

```yaml
container:
  image: <image>
    options: --user root
```

#### `fatal: unsafe repository`が出る

[ここ](https://zenn.dev/kouta/scraps/726bfce243f72b)を参考に、`git config --global --add safe.directory`を実行するようにした。

#### `fatal: refusing to merge unrelated histories`と表示され落ちる

masterブランチがfetchされておらずローカルとリモートが連続していないことが原因でした。
`git fetch origin master --depth 1`を追加することで解決しました。
