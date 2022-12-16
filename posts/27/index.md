<!--
.. title: 高速なconda代替コマンド mambaとビルドツールboa
.. slug: 27
.. date: 2022-12-13 00:00:00 UTC+09:00
.. tags: python,conda,mamba,micromamba,boa
.. category: 
.. link: 
.. description: 
.. type: text
-->

この記事は[Qiitaアドベントカレンダー 2022 Python](https://qiita.com/advent-calendar/2022/python) 13日目の記事です。

## 高速な`conda`代替コマンド`mamba`

`mamba`は`conda`コマンドの代わりに使用することができるPythonライブラリやパッケージ管理に用いることが可能なコマンドラインツールです。 `C++`による記述や`libsolv`などのライブラリを活用することによって高速に動作することを特徴としており、最近バージョン1.0が公開されました。
当方で[関連する記事の翻訳](https://medium.com/pydata-osaka/releasing-mamba-1-0-%E3%81%AE%E6%97%A5%E6%9C%AC%E8%AA%9E%E8%A8%B3-9f71af3a7dd7)をPyData OsakaのMedium上で公開したため、詳細についてはこちらをご覧いただければと思います。
上記記事でも触れられていますが、`mamba`は`conda`とほぼ互換性のあるCLIインタフェースを持っているため、もし既にパッケージ管理に`conda`を使っている場合はそのコマンドを`mamba`に置き換えるだけで使用することが可能となります。

### `mamba`の導入

詳細は[こちら](https://mamba.readthedocs.io/en/latest/installation.html)を参照いただければと思いますが、既にcondaが導入されている場合は`conda install mamba -n base -c conda-forge`でインストールを行うことができます。
mambaの使用方法についてはcondaと同一であるためここでは割愛させていただきます。

### `micromamba`

前述の翻訳記事にも記載がありますが、更に最近は完全にC++のみで書かれた`micromamba`の開発が進んでいます。シングルバイナリで提供され、非常に小さく、更にベースとなる環境を必要としないことを特徴としています。依存関係についても完全に静的リンクされた状態で配布されているため、適当なところに配置して実行することが可能となります。[ドキュメント](https://mamba.readthedocs.io/en/latest/installation.html)にはminicondaの代わりとして環境構築をゼロから行う場合に使用可能であるような旨が書かれています。

### `micromamba`の導入

macosであればhomebrewを入れた状態で`brew install --cask micromamba`のように導入が可能です。
また、homebrewがない環境では`curl micro.mamba.pm/install.sh | zsh`としても導入が可能です。
linuxの場合は`curl micro.mamba.pm/install.sh | bash`とzshをbashに置き換えてください。
windowsの場合は[ドキュメント](https://mamba.readthedocs.io/en/latest/installation.html)を参照ください。

### `micromamba`の使用方法

`micromamba`は`conda`や`mamba`のCLIのサブセットを持っているためほとんど同じ様な感じで使うことができます。
詳細は[ドキュメント](https://mamba.readthedocs.io/en/latest/user_guide/micromamba.html)を参照いただければと思いますが、`--help`でサブコマンドの一覧が表示でき、

```sh
$ micromamba --help

Subcommands:
  shell                       Generate shell init scripts
  create                      Create new environment
  install                     Install packages in active environment
  update                      Update packages in active environment
  repoquery                   Find and analyze packages in active environment or channels
  remove                      Remove packages from active environment
  list                        List packages in active environment
  package                     Extract a package or bundle files into an archive
  clean                       Clean package cache
  config                      Configuration of micromamba
  info                        Information about micromamba
  constructor                 Commands to support using micromamba in constructor
  env                         List environments
  activate                    Activate an environment
  run                         Run an executable in an environment
  ps                          Show, inspect or kill running processes
  auth                        Login or logout of a given host
  search                      Find packages in active environment or channels
```

ライブラリの個別インストールは`micromamba install xtensor -c conda-forge`で可能です。`-c`はインストール元のchannelを`conda-forge`に指定していることを表ます。
また、仮想環境作成も`conda`や`mamba`と同様に`micromamba create -n xtensor_env xtensor xsimd -c conda-forge`ののちに`micromamba activate xtensor_env`などでアクティベーションが可能です。

ライブラリはライブラリを列挙したテキストファイルか、または`env.yal`からインストールすることもできます。
テキストファイルの場合は、

```txt
xtensor
numpy 1.19
xsimd >=7.4
```

という内容のファイルを`spec_file.txt`として保存した上で、`micromamba create -n from_file -f spec_file.txt -c conda-forge`で実行することが可能です。

また、`env.yml`は下記のようなyamlファイルです。

```yaml
name: testenv
channels:
  - conda-forge
dependencies:
  - python >=3.6,<3.7
  - ipykernel >=5.1
  - ipywidgets
```

これを元にする場合は`micromamba create -f env.yml`として環境構築が可能です。`-c conda-forge`を指定しなくて済む様になるので便利ですね。

### `micromamba`の活用方法

`micromamba`はシングルバイナリで提供できインストールも容易であることから、CI/CDなどで使用することも想定されています。
冒頭の翻訳記事にも出てきますが、GitHub Actionsで利用可能な[provision-with-micromamba](https://github.com/mamba-org/provision-with-micromamba)、micromambaが使用可能な軽量Dockerイメージである[micromamba-docker](https://github.com/mamba-org/micromamba-docker)、VSCodeでの開発で活用できる[micromamba-devcontainer](https://github.com/mamba-org/micromamba-devcontainer)などが公開されています。

実際にWebAssembly向けのパッケージを格納している[Emscripten-forgeのActions](https://github.com/emscripten-forge/recipes/blob/main/.github/workflows/build_recipes.yaml)では、この様な目的でMicromambaを使用しています。

## Mamba meets Jupyterlite

`Emscripten-forge`の話題を出したので、また別の翻訳記事である[mamba meets jupyterlite](https://medium.com/pydata-osaka/mamba-meets-jupyterlite%E3%81%AE%E6%97%A5%E6%9C%AC%E8%AA%9E%E8%A8%B3-68d0823d767d)についてもここで貼っておきたいと思います。この記事は更に別の翻訳記事である[JupyterLite:Jupyter❤️WebAssembly❤️Python](https://medium.com/pydata-osaka/jupyterlite-jupyter-%EF%B8%8Fwebassembly-%EF%B8%8Fpython%E3%81%AE%E6%97%A5%E6%9C%AC%E8%AA%9E%E8%A8%B3-1f228a9d97d1)の翻訳記事を前提にしているため、合わせて読んでいただけると幸いです。

ざっくり書きますと、WebAssemblyを活用することによりPythonインタプリタをブラウザ上で動作することを可能にした`pyodide`というものが存在し、更にこれを活用することでサーバーを必要としないブラウザのみで動作するJupyter環境である`Jupyterlite`というものが存在しています。
このJupyterlite上ではピュアPythonのみで書かれたライブラリに関しては`pyodide`の[micropip](https://pyodide.org/en/stable/usage/api/micropip-api.html)を用いることでJupyterliteへの導入が可能となっていますが 、 一方で C拡張を伴うようなライブラリについては(WebAssemblyのコンパイルが必要となることなどから)単純な導入が困難となっておりました。
これを解決するためには、WebAssemblyプラットフォーム向けにあらかじめビルドされた状態のcondaパッケージを配布することが必要となります。
このために、[emscripten-forge/recipes](https://github.com/emscripten-forge/recipes)のリポジトリにおいてパッケージのビルド方法を管理するためのレシピ群が管理され、 パッケージのホスティングには[Quetz](https://github.com/mamba-org/quetz)というFastAPIを用いたcondaパッケージ用のサーバーが用いられています。

これらの機構を用いることで、`emscripten-32`向けの環境を下記の様に構築できるようになりました。

```sh
$ micromamba create -n my-env --platform=emscripten-32 \ 
    -c https://repo.mamba.pm/emscripten-forge \ 
    -c https://repo.mamba.pm/conda-forge \
    python ipython numpy jedi
```

jupyterliteではこのWebAssembly向けにビルド・配布されたパッケージを使うために、[xeus-python](https://github.com/jupyter-xeus/xeus-python)を用いているそうです。
自分も完璧には理解しきれてはいませんが、jupyterliteを静的サイトとして構築する際に使用する`jupyter lite build`コマンドにおいて、下記の様な指定を行うことでXeusPython環境に存在するパッケージをPythonランタイム内にプリインストールすることが可能となるとのことです。

```sh
$ jupyter lite build --XeusPythonEnv.packages=\
    numpy,\
    matplotlib,\
    ipyleaflet
```

## ビルドツール`boa`

上記のWebAssembly向けのパッケージのビルドは[Emscripten-forgeのActions](https://github.com/emscripten-forge/recipes/blob/main/.github/workflows/build_recipes.yaml)内で呼ばれている[builder.py](https://github.com/emscripten-forge/recipes/blob/main/builder.py)で行われていますが、ここでビルドツールの[boa](https://github.com/mamba-org/boa)というものが使われています。
`boa`は`libmamba`を用いることで`conda-build`よりも高速なビルドを実現するためのツールであるとのことです。
`boa`は3種類のツールを含んでおり、`conda build`をmambaをsolverとしたものに置き換える`conda mambabuild`、新しい形式のレシピを用いたビルドにおける情報の表示を行う`boa render`、そのレシピをもとにビルドを行う`boa build`を含んでいます。

`boa`のドキュメントは[ここ](https://boa-build.readthedocs.io/en/latest/)に存在しており、[Getting Started](https://boa-build.readthedocs.io/en/latest/getting_started.html)には、`mamba install boa -c conda-forge`(mambaの代わりにcondaでも可能)で`boa`のインストールを行うことができるとあります。

### `conda mambabuild`のメリット

メリットについては[ここ](https://boa-build.readthedocs.io/en/latest/mambabuild.html)に3つ載っており、

1. より高速な依存解決速度: 複雑な環境に対しては、mambaはcondaよりもかなり高速なビルドが可能
2. より良いエラーメッセージ: 依存関係が解決できない環境において、解読が困難なcondaは大量のエラーメッセージを吐くが、Mambaはより理解しやすいメッセージを出力する
3. 既存のレシピおよびconda-buildのCLIオプションとの完全な互換性がある(conda-buildに対してsolverの部分を置き換えるためのモンキーパッチを適用しているため)

とのことです。

### `boa`における新しいレシピフォーマット

`boa`は`conda build`で用いられる`meta.yaml`を置き換える新しいフォーマットである`recipe.yaml`を用いたビルドを行うことが可能です。
[このドキュメント](https://boa-build.readthedocs.io/en/latest/recipe_spec.html)に詳細な記述があります。
parseを簡単にしたり、複数箇所への出力に関する一貫性のなさを解消したり、再起的なパースや依存性解決を防ぐために開発されたとの説明があります。

`boa`のレシピは次の項目を備えています。

* context: Jinjaの文字列置換で後続の箇所で使用可能な変数の設定を行う
* package: パッケージのトップレベルとなる 名前、バージョン、その他の情報を定義する
* source: ： レシピのビルドのためにダウンロードが必要となるソースへのポインタ
* build: レシピをどのようにビルドするかと、使用するビルド番号を定義する
* requirements: パッケージのトップレベルにおける依存ライブラリを定義する
* test: パッケージのトップレベルにおけるテストを定義する
* outputs: レシピは複数の出力行うことができる。各々のoutputはパッケージと依存関係、テストのセクションを持ちことが可能であり持つべきである

ドキュメント記載の例を下記に転記します。

```yaml
# "context variables"を設定(後でJinjaのexpressionとして使用可能)
context:
  version: 1.1.0
  name: imagesize

# トップレベルのパッケージ情報(nameとversion)
package:
  name: "{{ name }}"
  version: "{{ version }}"

# ソースをどこから取得するかを定義
source:
  url: https://pypi.io/packages/source/{{ name[0] }}/{{ name }}/{{ name }}-{{ version }}.tar.gz
  sha256: f3832918bc3c66617f92e35f5d70729187676313caa60c187eb0f28b8fe5e3b5

# ビルド番号(バージョンは増加させないが、もし新しいビルドが生成されるのであれば増加させるべき)
build:
  number: 1
  script: python -m pip install --no-deps --ignore-installed .

# ビルド時の実行時のrequirementsを記載
requirements:
  host:
    - python
    - pip
  run:
    - python

# パッケージが期待通りに動作するかをバリデーションするためのテスト
test:
  imports:
    - imagesize

# パッケージに関する情報
about:
  home: https://github.com/shibukawa/imagesize_py
  license: MIT
  summary: 'Getting image size from png/jpeg/jpeg2000/gif file'
  description: |
    This module analyzes jpeg/jpeg2000/png/gif image header and
    return image size.
  dev_url: https://github.com/shibukawa/imagesize_py
  doc_url: https://pypi.python.org/pypi/imagesize
  doc_source_url: https://github.com/shibukawa/imagesize_py/blob/master/README.rst

# 下記はconda-forge特有の内容
extra:
  recipe-maintainers:
    - somemaintainer
```

また、`conda-build`との主な違いは下記の通りです。

* レシピのファイル名がmeta.yamlではなくrecipe.yamlとなった
* 出力がより複雑ではないふるまいとなり、キー名は名前だけではなくpackage/nameと同じレシピにおけるトップレベル階層と同じ(例: 単なるscriptではなくbuild/script)となる
* 暗黙のメタパッケージが出力に生じない
* 完全なJinja2サポートを含まない: 条件節がない または `{%` のサポートはなく, 文字列置換のみである. 変数は有効なYAMLファイルのトップレベルにおける"context"に記載できる
* Jinjaの文字列補完は有効なYAMLとするためにクォーテーションが必要 e.g. - "{{ version }}"
* セレクタはYAML辞書スタイルを用いる(conda-buildにおけるコメントの代わり). E.g. `- somepkg  # [osx]`の代わりに`- sel(osx): somepkg`と書く
* `conda-build`からセレクタの文法を使わずにスキップ条件のリストを使う命令をスキップする(e.g. ["osx", "win and py37"]はスキップ)

### conda-buildからのレシピ構築

`conda-build`で用いていた既存のレシピ`meta.yaml`を`boa`の文法へとコンバートすることができます。そのコマンドは新しいレシピを標準出力に出力します。
結果を速く保存するために、`boa convert meta.yaml > recipe.yaml`を使うことができ、`boa build ..`を実行してください。
変換プロセスは"シンプル"なレシピに対してのみ動作し、複雑なレシピの変換には手作業が必要となるであろうことに注意してください。

ここで実際に既存recipeを変換して...というところまで行きつきたかったのですが、時間切れに伴いここで一旦終了とさせていただきます。
追記する場合はその旨を記載いたします。
※2022/12/17 本記事末尾に追記しました。

## PyData Osaka meetup #27

以上に記載した内容+αを12/17(土) 13:00より開催予定の[PyData Osakaのミートアップ](https://www.hiromasa.info/posts/27/)で紹介する予定です。
この記事で触れたmambaやboaについての紹介を行いたいと考えています。よろしければご参加ください。

## `micromamba-docker`を使ってみよう(2022/12/17追記)

ここでは実際に[micromamba-docker](https://github.com/mamba-org/micromamba-docker)を使って`micromamba`を動作させてみます。

まず、下記の様な`env.yaml`を作成します。

```yaml
name: base
channels:
  - conda-forge
dependencies:
  - python=3.9
  - numpy
  - scipy
  - matplotlib
  - pandas
```

次に、下記のDockerfileを作成します。

```Dockerfile
FROM mambaorg/micromamba:1.1.0
COPY --chown=$MAMBA_USER:$MAMBA_USER env.yaml /tmp/env.yaml
RUN micromamba install -y -n base -f /tmp/env.yaml && \
    micromamba clean --all --yes
```

これらを用いてコンテナをビルドします。ここでは下記スクリプトを`build.sh`として保存し、`chmod u+x build.sh`した上で`./build.sh`を実行することでビルドを行います。

```sh
#!/bin/bash
docker build -t mamba_custom .
```

Dockerコンテナを動作させます。下記スクリプトを`run.sh`として保存し、`chmod u+x run.sh`ののちに`./run.sh`で実行させます。

```sh
#!/bin/bash
docker run -it --rm mamba_custom
```

デフォルトでは`base`という名前のconda環境が有効化されています。
まずは`micromamba`コマンドを実行することで使えるコマンド一覧を見てましょう。
また、`micromamba info`コマンドで現在の環境の状態が分かります。

```sh
(base) mambauser@8d0b15ca9e5b:/tmp$ micromamba info

                                           __
          __  ______ ___  ____ _____ ___  / /_  ____ _
         / / / / __ `__ \/ __ `/ __ `__ \/ __ \/ __ `/
        / /_/ / / / / / / /_/ / / / / / / /_/ / /_/ /
       / .___/_/ /_/ /_/\__,_/_/ /_/ /_/_.___/\__,_/
      /_/


            environment : base (active)
           env location : /opt/conda
      user config files : /home/mambauser/.mambarc
 populated config files :
       libmamba version : 1.1.0
     micromamba version : 1.1.0
           curl version : libcurl/7.86.0 OpenSSL/1.1.1s zlib/1.2.13 libssh2/1.10.0 nghttp2/1.47.0
     libarchive version : libarchive 3.6.1 zlib/1.2.13 bz2lib/1.0.8 libzstd/1.5.2
       virtual packages : __unix=0=0
                          __linux=5.15.0=0
                          __glibc=2.31=0
                          __archspec=1=x86_64
               channels :
       base environment : /opt/conda
               platform : linux-64
```

次に、試しにboaをインストールしてみましょう。ここで`$`はプロンプトであるため打ち込む必要はありません。

```sh
$ micromamba install boa -c conda-forge
```

これにより`boa`コマンドが使える様になります。

```sh
(base) mambauser@8d0b15ca9e5b:/tmp$ boa
OpenBLAS WARNING - could not determine the L2 cache size on this system, assuming 256k

           _
          | |__   ___   __ _
          | '_ \ / _ \ / _` |
          | |_) | (_) | (_| |
          |_.__/ \___/ \__,_|

usage: boa [-h] [--version] {render,convert,validate,build,transmute} ...

Boa, the fast, mamba powered-build tool for conda packages.

positional arguments:
  {render,convert,validate,build,transmute}
                        sub-command help
    render              render a recipe
    convert             convert old-style meta.yaml to recipe.yaml
    validate            Validate recipe.yaml
    build               build a recipe
    transmute           transmute one or many tar.bz2 packages into a conda packages (or vice versa!)

optional arguments:
  -h, --help            show this help message and exit
  --version             show program's version number and exit
```

一旦`boa`が入ったところで、今度はEmscriptten向けの環境を構築してみます。

```sh
$ micromamba create -n my-env --platform=emscripten-32 -c https://repo.mamba.pm/emscripten-forge -c https://repo.mamba.pm/conda-forge python
$ micromamba activate my-env
$ micromamba info

                                           __
          __  ______ ___  ____ _____ ___  / /_  ____ _
         / / / / __ `__ \/ __ `/ __ `__ \/ __ \/ __ `/
        / /_/ / / / / / / /_/ / / / / / / /_/ / /_/ /
       / .___/_/ /_/ /_/\__,_/_/ /_/ /_/_.___/\__,_/
      /_/


            environment : my-env (active)
           env location : /opt/conda/envs/my-env
      user config files : /home/mambauser/.mambarc
 populated config files : /opt/conda/envs/my-env/.mambarc
       libmamba version : 1.1.0
     micromamba version : 1.1.0
           curl version : libcurl/7.86.0 OpenSSL/1.1.1s zlib/1.2.13 libssh2/1.10.0 nghttp2/1.47.0
     libarchive version : libarchive 3.6.1 zlib/1.2.13 bz2lib/1.0.8 libzstd/1.5.2
       virtual packages : __archspec=1=x86
               channels :
       base environment : /opt/conda
               platform : emscripten-32

```

最後のplatformが`emscripten-32`に変わっていることが分かるかと思います。

### `boa`で既存のrecipeを変換してビルドする

ここでは既存の`conda-forge`向けに公開されているrecipeをboaで変換することを試します。
一旦ここまでで実行していたdocker環境からはexitして抜けておきます(`run.sh`で`--rm`を付けているのでexitすると実行していたdockerコンテナは消えます)。

次に、`run_as_root.sh`として下記スクリプトを保存し、`chmod u+x run_as_root.sh`で実行権限をつけた上で`./run_as_root.sh`を実行します。
rootユーザでコンテナを起動するために`-u root`をつけています。

```sh
#!/bin/bash
docker run -u root -it --rm mamba_custom
```

コンテナ内部で下記を実行します。

```sh
$ apt update
$ apt install git
$ git clone https://github.com/conda-forge/pysoundfile-feedstock
$ micromamba install boa -c conda-forge
$ cd pysoundfile-feedsock/recipes
$ boa convert meta.yaml > recipe.yaml
```

これにより`meta.yaml`ファイルが`recipe.yaml`に変換されます。
変化点はdiffを見ると分かりますが、主に変数が`context`にまとめられた他、文字列のクォーテーションが変化しています。

```diff
(base) mambauser@fd58307391e2:/tmp/pysoundfile-feedstock/recipe$ diff meta.yaml recipe.yaml
1,3c1,4
< {% set name = "pysoundfile" %}
< {% set pypi_name = "soundfile" %}
< {% set version = "0.11.0" %}
---
> context:
>   name: pysoundfile
>   pypi_name: soundfile
>   version: 0.11.0
6,7c7,8
<   name: {{ name|lower }}
<   version: {{ version }}
---
>   name: '{{ name|lower }}'
>   version: '{{ version }}'
10c11
<   fn: {{ pypi_name }}-{{ version }}.tar.gz
---
>   fn: '{{ pypi_name }}-{{ version }}.tar.gz'
47c48
<   summary: 'SoundFile is an audio library based on libsndfile, CFFI, and NumPy'
---
>   summary: SoundFile is an audio library based on libsndfile, CFFI, and NumPy
54a56
>
```

次に、この変換後のrecipeを`boa render`してみます。

```sh
(base) mambauser@fd58307391e2:/tmp/pysoundfile-feedstock/recipe$ boa render recipe.yaml
OpenBLAS WARNING - could not determine the L2 cache size on this system, assuming 256k

           _
          | |__   ___   __ _
          | '_ \ / _ \ / _` |
          | |_) | (_) | (_| |
          |_.__/ \___/ \__,_|


Loading config files:

Updating build index: /opt/conda/conda-bld

No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
WARNING:conda_build.metadata:No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
Recipe validation OK
Found 1 recipe
 - pysoundfile

Assembling all recipes and variants

         Output: pysoundfile
┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ Package         ┃ Variant versions ┃
┡━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━┩
│ target_platform │ linux-64         │
│ python          │ 3.9              │
└─────────────────┴──────────────────┘
                Output: pysoundfile 0.11.0 BN: 0
                            Variant:
                             Build:

             ╷                     ╷          ╷       ╷
  Dependency │ Version requirement │ Selected │ Build │ Channel
 ════════════╪═════════════════════╪══════════╪═══════╪═════════
             │                     │          │       │
  Host       │                     │          │       │
  pip        │                     │          │       │
  python     │ 3.9                 │          │       │
  setuptools │                     │          │       │
  cffi       │                     │          │       │
             │                     │          │       │
  Run        │                     │          │       │
  python     │ >=3.6               │          │       │
  cffi       │                     │          │       │
  numpy      │                     │          │       │
  libsndfile │                     │          │       │
 ```

 概要が色々表示されていることが分かります。ついで、`boa build recipe.yaml`も実行してみましょう。

 ```sh
 (base) mambauser@fd58307391e2:/tmp/pysoundfile-feedstock/recipe$ boa build recipe.yaml
OpenBLAS WARNING - could not determine the L2 cache size on this system, assuming 256k

           _
          | |__   ___   __ _
          | '_ \ / _ \ / _` |
          | |_) | (_) | (_| |
          |_.__/ \___/ \__,_|


Loading config files:

Updating build index: /opt/conda/conda-bld

No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
WARNING:conda_build.metadata:No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
Recipe validation OK
Found 1 recipe
 - pysoundfile

Assembling all recipes and variants

         Output: pysoundfile
┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ Package         ┃ Variant versions ┃
┡━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━┩
│ target_platform │ linux-64         │
│ python          │ 3.9              │
└─────────────────┴──────────────────┘

Initializing mamba solver


Downloading source

Source cache directory is: /opt/conda/conda-bld/src_cache
INFO:conda_build.source:Source cache directory is: /opt/conda/conda-bld/src_cache
Downloading source to cache: soundfile-0.11.0_931738a1c9.tar.gz
INFO:conda_build.source:Downloading source to cache: soundfile-0.11.0_931738a1c9.tar.gz
Downloading https://pypi.io/packages/source/s/soundfile/soundfile-0.11.0.tar.gz
INFO:conda_build.source:Downloading https://pypi.io/packages/source/s/soundfile/soundfile-0.11.0.tar.gz
Success
INFO:conda_build.source:Success
Extracting download

Preparing environment for pysoundfile

Finalizing host for pysoundfile
pkgs/main/noarch                                   818.5kB @   1.2MB/s  0.7s
pkgs/r/noarch                                        1.3MB @   1.6MB/s  0.8s
pkgs/r/linux-64                                      1.4MB @   1.7MB/s  0.9s
pkgs/main/linux-64                                   5.0MB @   4.3MB/s  1.2s
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                        ??.?MB @  ??.?MB/s 0 failed  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 319.1kB/s  0.0s
_libgcc_mutex                                        3.5kB @   7.5kB/s  0.5s
ca-certificates                                    127.5kB @ 224.9kB/s  0.6s
zlib                                               105.9kB @ 163.2kB/s  0.2s
libgomp                                            485.1kB @ 600.3kB/s  0.8s
ld_impl_linux-64                                   669.2kB @ 792.3kB/s  0.9s
cffi                                               247.4kB @ 264.1kB/s  0.1s
xz                                                 439.5kB @ 415.1kB/s  0.1s
setuptools                                           1.2MB @   1.1MB/s  0.3s
tzdata                                             116.9kB @ 100.9kB/s  0.0s
wheel                                               33.3kB @  27.7kB/s  0.0s
tk                                                   3.2MB @   2.1MB/s  0.9s
readline                                           365.2kB @ 230.4kB/s  0.1s
certifi                                            157.3kB @  94.6kB/s  0.1s
libffi                                             139.6kB @  81.2kB/s  0.1s
libstdcxx-ng                                         4.9MB @   2.8MB/s  1.8s
ncurses                                            800.2kB @ 396.7kB/s  0.3s
openssl                                              3.8MB @   1.9MB/s  1.0s
_openmp_mutex                                       21.3kB @  10.3kB/s  0.1s
pycparser                                           96.6kB @  45.1kB/s  0.1s
sqlite                                               1.2MB @ 542.1kB/s  0.2s
pip                                                  2.8MB @   1.2MB/s  0.6s
libgcc-ng                                            5.6MB @   2.4MB/s  1.2s
python                                              26.2MB @   7.8MB/s  2.7s
Finalizing run for pysoundfile
Mamba failed to solve:
 - python >=3.6
 - cffi
 - numpy
 - libsndfile

with channels:

The reported errors are:
- Encountered problems while solving:
-   - nothing provides requested libsndfile
-
╭─────────────────────────────── Traceback (most recent call last) ────────────────────────────────╮
│ /opt/conda/lib/python3.9/site-packages/boa/core/run_build.py:305 in build_recipe                 │
│                                                                                                  │
│   302 │   │   │                                                                                  │
│   303 │   │   │   o.config._build_id = o0.config.build_id                                        │
│   304 │   │   │                                                                                  │
│ ❱ 305 │   │   │   o.finalize_solve(sorted_outputs)                                               │
│   306 │   │   │                                                                                  │
│   307 │   │   │   meta = MetaData(recipe_path, o)                                                │
│   308 │   │   │   o.set_final_build_id(meta, sorted_outputs)                                     │
│                                                                                                  │
│ /opt/conda/lib/python3.9/site-packages/boa/core/recipe_output.py:594 in finalize_solve           │
│                                                                                                  │
│   591 │   │                                                                                      │
│   592 │   │   self._solve_env("build", all_outputs)                                              │
│   593 │   │   self._solve_env("host", all_outputs)                                               │
│ ❱ 594 │   │   self._solve_env("run", all_outputs)                                                │
│   595 │   │                                                                                      │
│   596 │   │   # TODO figure out if we can avoid this?!                                           │
│   597 │   │   if self.config.variant.get("python") is None:                                      │
│                                                                                                  │
│ /opt/conda/lib/python3.9/site-packages/boa/core/recipe_output.py:542 in _solve_env               │
│                                                                                                  │
│   539 │   │   │   elif env == "build":                                                           │
│   540 │   │   │   │   MambaContext().target_prefix = self.config.build_prefix                    │
│   541 │   │   │   │   # solver.replace_installed(self.config.build_prefix)                       │
│ ❱ 542 │   │   │   t = solver.solve(specs, [pkg_cache])                                           │
│   543 │   │   │                                                                                  │
│   544 │   │   │   _, install_pkgs, _ = t.to_conda()                                              │
│   545 │   │   │   for _, _, p in install_pkgs:                                                   │
│                                                                                                  │
│ /opt/conda/lib/python3.9/site-packages/boa/core/solver.py:220 in solve                           │
│                                                                                                  │
│   217 │   │   │   pstring = "\n".join(["- " + el for el in pstring.split("\n")])                 │
│   218 │   │   │   error_string += f"\nThe reported errors are:\n{pstring}"                       │
│   219 │   │   │   print(error_string)                                                            │
│ ❱ 220 │   │   │   raise RuntimeError("Solver could not find solution." + error_string)           │
│   221 │   │                                                                                      │
│   222 │   │   if pkg_cache_path is None:                                                         │
│   223 │   │   │   # use values from conda                                                        │
╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
RuntimeError: Solver could not find solution.Mamba failed to solve:
 - python >=3.6
 - cffi
 - numpy
 - libsndfile

with channels:

The reported errors are:
- Encountered problems while solving:
-   - nothing provides requested libsndfile
-
```

エラーで終了していることが分かりますが、`run`のセクションにおけるlibsndfileに起因するエラーの様です。`conda mambabuild`も同様に失敗します。

```sh
(base) root@80b5664e65e1:/tmp/pysoundfile-feedstock/recipe# conda mambabuild meta.yaml
/opt/conda/lib/python3.9/site-packages/conda_build/cli/main_build.py:390: UserWarning: RECIPE_PATH received is a file (meta.yaml).
It should be a path to a folder.
Forcing conda-build to use the recipe file.
  warnings.warn(
Updating build index: /opt/conda/conda-bld

No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
WARNING:conda_build.metadata:No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
Adding in variants from internal_defaults
INFO:conda_build.variants:Adding in variants from internal_defaults
Attempting to finalize metadata for pysoundfile
INFO:conda_build.metadata:Attempting to finalize metadata for pysoundfile
pkgs/r/noarch                                                 No change
pkgs/r/linux-64                                               No change
pkgs/main/linux-64                                            No change
Reloading output folder: /opt/conda/conda-bld
pkgs/main/noarch                                              No change
opt/conda/conda-bld/linux-64                        ??.?MB @  ??.?MB/s 0 failed  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 141.0kB/s  0.0s
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                        ??.?MB @  ??.?MB/s 0 failed  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 604.8kB/s  0.0s

Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 250.0kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 494.2kB/s  0.0s
BUILD START: ['pysoundfile-0.11.0-py_0.tar.bz2']
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 678.9kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 484.7kB/s  0.0s

## Package Plan ##

  environment location: /opt/conda/conda-bld/pysoundfile_1671217858434/_h_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_p


The following NEW packages will be INSTALLED:

    _libgcc_mutex:    0.1-main
    _openmp_mutex:    5.1-1_gnu
    bzip2:            1.0.8-h7b6447c_0
    ca-certificates:  2022.10.11-h06a4308_0
    certifi:          2022.9.24-py310h06a4308_0
    cffi:             1.15.1-py310h5eee18b_3
    ld_impl_linux-64: 2.38-h1181459_1
    libffi:           3.4.2-h6a678d5_6
    libgcc-ng:        11.2.0-h1234567_1
    libgomp:          11.2.0-h1234567_1
    libstdcxx-ng:     11.2.0-h1234567_1
    libuuid:          1.41.5-h5eee18b_0
    ncurses:          6.3-h5eee18b_3
    openssl:          1.1.1s-h7f8727e_0
    pip:              22.3.1-py310h06a4308_0
    pycparser:        2.21-pyhd3eb1b0_0
    python:           3.10.8-h7a1cb2a_1
    readline:         8.2-h5eee18b_0
    setuptools:       65.5.0-py310h06a4308_0
    sqlite:           3.40.0-h5082296_0
    tk:               8.6.12-h1ccaba5_0
    tzdata:           2022g-h04d1e81_0
    wheel:            0.37.1-pyhd3eb1b0_0
    xz:               5.2.8-h5eee18b_0
    zlib:             1.2.13-h5eee18b_0

Preparing transaction: ...working... done
Verifying transaction: ...working... done
Executing transaction: ...working... done
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 632.4kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 434.9kB/s  0.0s
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 682.5kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 585.3kB/s  0.0s
Mamba failed to solve:
 - libsndfile
 - cffi
 - python >=3.6
 - numpy

with channels:

The reported errors are:
- Encountered problems while solving:
-   - nothing provides requested libsndfile
-

Leaving build/test directories:
  Work:
 /opt/conda/conda-bld/work
  Test:
 /opt/conda/conda-bld/test_tmp
Leaving build/test environments:
  Test:
source activate  /opt/conda/conda-bld/_test_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_pl
  Build:
source activate  /opt/conda/conda-bld/_build_env


Traceback (most recent call last):
  File "/opt/conda/lib/python3.9/site-packages/boa/cli/mambabuild.py", line 141, in mamba_get_install_actions
    solution = solver.solve_for_action(_specs, prefix)
  File "/opt/conda/lib/python3.9/site-packages/boa/core/solver.py", line 230, in solve_for_action
    t = self.solve(specs)
  File "/opt/conda/lib/python3.9/site-packages/boa/core/solver.py", line 220, in solve
    raise RuntimeError("Solver could not find solution." + error_string)
RuntimeError: Solver could not find solution.Mamba failed to solve:
 - libsndfile
 - cffi
 - python >=3.6
 - numpy

with channels:

The reported errors are:
- Encountered problems while solving:
-   - nothing provides requested libsndfile
-

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/opt/conda/bin/conda-mambabuild", line 10, in <module>
    sys.exit(main())
  File "/opt/conda/lib/python3.9/site-packages/boa/cli/mambabuild.py", line 256, in main
    call_conda_build(action, config)
  File "/opt/conda/lib/python3.9/site-packages/boa/cli/mambabuild.py", line 228, in call_conda_build
    result = api.build(
  File "/opt/conda/lib/python3.9/site-packages/conda_build/api.py", line 180, in build
    return build_tree(
  File "/opt/conda/lib/python3.9/site-packages/conda_build/build.py", line 3097, in build_tree
    packages_from_this = build(metadata, stats,
  File "/opt/conda/lib/python3.9/site-packages/conda_build/build.py", line 2126, in build
    create_build_envs(top_level_pkg, notest)
  File "/opt/conda/lib/python3.9/site-packages/conda_build/build.py", line 2004, in create_build_envs
    raise e
  File "/opt/conda/lib/python3.9/site-packages/conda_build/build.py", line 1983, in create_build_envs
    environ.get_install_actions(m.config.test_prefix,
  File "/opt/conda/lib/python3.9/site-packages/boa/cli/mambabuild.py", line 150, in mamba_get_install_actions
    raise err
conda_build.exceptions.DependencyNeedsBuildingError: Unsatisfiable dependencies for platform linux-64: {MatchSpec("libsndfile")}
```

この解決策を探っていたところ、`conda mambabuild meta.yaml -c conda-forge`の実行により解決することが分かりました。

```sh
(base) root@f5a1409aeef8:/tmp/pysoundfile-feedstock/recipe# conda mambabuild meta.yaml -c conda-forge
/opt/conda/lib/python3.9/site-packages/conda_build/cli/main_build.py:390: UserWarning: RECIPE_PATH received is a file (meta.yaml).
It should be a path to a folder.
Forcing conda-build to use the recipe file.
  warnings.warn(
Updating build index: /opt/conda/conda-bld

No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
WARNING:conda_build.metadata:No numpy version specified in conda_build_config.yaml.  Falling back to default numpy value of 1.16
Adding in variants from internal_defaults
INFO:conda_build.variants:Adding in variants from internal_defaults
Attempting to finalize metadata for pysoundfile
INFO:conda_build.metadata:Attempting to finalize metadata for pysoundfile
conda-forge/linux-64                                        Using cache
conda-forge/noarch                                          Using cache
pkgs/main/noarch                                              No change
pkgs/r/linux-64                                               No change
pkgs/main/linux-64                                            No change
pkgs/r/noarch                                                 No change
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 496.2kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 477.4kB/s  0.0s
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 594.5kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 447.2kB/s  0.0s
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 152.5kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @  85.9kB/s  0.0s
BUILD START: ['pysoundfile-0.11.0-py_0.tar.bz2']
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 664.9kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 625.6kB/s  0.0s

## Package Plan ##

  environment location: /opt/conda/conda-bld/pysoundfile_1671219418224/_h_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_p


The following NEW packages will be INSTALLED:

    _libgcc_mutex:    0.1-conda_forge           conda-forge
    _openmp_mutex:    4.5-2_gnu                 conda-forge
    bzip2:            1.0.8-h7f98852_4          conda-forge
    ca-certificates:  2022.12.7-ha878542_0      conda-forge
    cffi:             1.15.1-py311h409f033_3    conda-forge
    ld_impl_linux-64: 2.39-hcc3a1bd_1           conda-forge
    libffi:           3.4.2-h7f98852_5          conda-forge
    libgcc-ng:        12.2.0-h65d4601_19        conda-forge
    libgomp:          12.2.0-h65d4601_19        conda-forge
    libnsl:           2.0.0-h7f98852_0          conda-forge
    libsqlite:        3.40.0-h753d276_0         conda-forge
    libuuid:          2.32.1-h7f98852_1000      conda-forge
    libzlib:          1.2.13-h166bdaf_4         conda-forge
    ncurses:          6.3-h27087fc_1            conda-forge
    openssl:          3.0.7-h0b41bf4_1          conda-forge
    pip:              22.3.1-pyhd8ed1ab_0       conda-forge
    pycparser:        2.21-pyhd8ed1ab_0         conda-forge
    python:           3.11.0-ha86cf86_0_cpython conda-forge
    python_abi:       3.11-3_cp311              conda-forge
    readline:         8.1.2-h0f457ee_0          conda-forge
    setuptools:       65.5.1-pyhd8ed1ab_0       conda-forge
    tk:               8.6.12-h27826a3_0         conda-forge
    tzdata:           2022g-h191b570_0          conda-forge
    wheel:            0.38.4-pyhd8ed1ab_0       conda-forge
    xz:               5.2.6-h166bdaf_0          conda-forge

Preparing transaction: ...working... done
Verifying transaction: ...working... done
Executing transaction: ...working... done
Reloading output folder: /opt/conda/conda-bld
[+] 0.0s
opt/conda/conda-bld/linux-64                       129.0 B @ 401.9kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 616.5kB/s  0.0s
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 379.4kB/s  0.0s
opt/conda/conda-bld/noarch                         127.0 B @ 305.3kB/s  0.0s

## Package Plan ##

  environment location: /opt/conda/conda-bld/pysoundfile_1671219418224/_build_env


Source cache directory is: /opt/conda/conda-bld/src_cache
INFO:conda_build.source:Source cache directory is: /opt/conda/conda-bld/src_cache
Found source in cache: soundfile-0.11.0_931738a1c9.tar.gz
INFO:conda_build.source:Found source in cache: soundfile-0.11.0_931738a1c9.tar.gz
Extracting download
source tree in: /opt/conda/conda-bld/pysoundfile_1671219418224/work
export PREFIX=/opt/conda/conda-bld/pysoundfile_1671219418224/_h_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_p
export BUILD_PREFIX=/opt/conda/conda-bld/pysoundfile_1671219418224/_build_env
export SRC_DIR=/opt/conda/conda-bld/pysoundfile_1671219418224/work
Using pip 22.3.1 from $PREFIX/lib/python3.11/site-packages/pip (python 3.11)
Non-user install because user site-packages disabled
Ignoring indexes: https://pypi.org/simple
Created temporary directory: /tmp/pip-build-tracker-jrguuqgf
Initialized build tracking at /tmp/pip-build-tracker-jrguuqgf
Created build tracker: /tmp/pip-build-tracker-jrguuqgf
Entered build tracker: /tmp/pip-build-tracker-jrguuqgf
Created temporary directory: /tmp/pip-install-spticpg3
Created temporary directory: /tmp/pip-ephem-wheel-cache-3pqy128u
Processing $SRC_DIR
  Added file://$SRC_DIR to build tracker '/tmp/pip-build-tracker-jrguuqgf'
  Running setup.py (path:$SRC_DIR/setup.py) egg_info for package from file://$SRC_DIR
  Created temporary directory: /tmp/pip-pip-egg-info-7_fttna9
  Running command python setup.py egg_info
  Preparing metadata (setup.py): started
  running egg_info
  creating /tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info
  writing /tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/PKG-INFO
  writing dependency_links to /tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/dependency_links.txt
  writing requirements to /tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/requires.txt
  writing top-level names to /tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/top_level.txt
  writing manifest file '/tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/SOURCES.txt'
  reading manifest file '/tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/SOURCES.txt'
  reading manifest template 'MANIFEST.in'
  adding license file 'LICENSE'
  writing manifest file '/tmp/pip-pip-egg-info-7_fttna9/soundfile.egg-info/SOURCES.txt'
  Preparing metadata (setup.py): finished with status 'done'
  Source in $SRC_DIR has version 0.11.0, which satisfies requirement soundfile==0.11.0 from file://$SRC_DIR
  Removed soundfile==0.11.0 from file://$SRC_DIR from build tracker '/tmp/pip-build-tracker-jrguuqgf'
Created temporary directory: /tmp/pip-unpack-tyj3ve7q
Building wheels for collected packages: soundfile
  Created temporary directory: /tmp/pip-wheel-rg_mrqtj
  Running command python setup.py bdist_wheel
  Building wheel for soundfile (setup.py): started
  Destination directory: /tmp/pip-wheel-rg_mrqtj
  running bdist_wheel
  running build
  running build_py
  file _soundfile.py (for module _soundfile) not found
  creating build
  creating build/lib
  copying soundfile.py -> build/lib
  file _soundfile.py (for module _soundfile) not found
  warning: build_py_make_mod: byte-compiling is disabled, skipping.

  generating cffi module 'build/lib/_soundfile.py'
  /opt/conda/conda-bld/pysoundfile_1671219418224/_h_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_p/lib/python3.11/site-packages/setuptools/command/install.py:34: SetuptoolsDeprecationWarning: setup.py install is deprecated. Use build and pip and other standards-based tools.
    warnings.warn(
  installing to build/bdist.linux-x86_64/wheel
  running install
  running install_lib
  creating build/bdist.linux-x86_64
  creating build/bdist.linux-x86_64/wheel
  copying build/lib/_soundfile.py -> build/bdist.linux-x86_64/wheel
  copying build/lib/soundfile.py -> build/bdist.linux-x86_64/wheel
  warning: install_lib: byte-compiling is disabled, skipping.

  running install_egg_info
  running egg_info
  writing soundfile.egg-info/PKG-INFO
  writing dependency_links to soundfile.egg-info/dependency_links.txt
  writing requirements to soundfile.egg-info/requires.txt
  writing top-level names to soundfile.egg-info/top_level.txt
  reading manifest file 'soundfile.egg-info/SOURCES.txt'
  reading manifest template 'MANIFEST.in'
  adding license file 'LICENSE'
  writing manifest file 'soundfile.egg-info/SOURCES.txt'
  Copying soundfile.egg-info to build/bdist.linux-x86_64/wheel/soundfile-0.11.0-py3.11.egg-info
  running install_scripts
  creating build/bdist.linux-x86_64/wheel/soundfile-0.11.0.dist-info/WHEEL
  creating '/tmp/pip-wheel-rg_mrqtj/soundfile-0.11.0-py2.py3-none-win_amd64.whl' and adding 'build/bdist.linux-x86_64/wheel' to it
  adding '_soundfile.py'
  adding 'soundfile.py'
  adding 'soundfile-0.11.0.dist-info/LICENSE'
  adding 'soundfile-0.11.0.dist-info/METADATA'
  adding 'soundfile-0.11.0.dist-info/WHEEL'
  adding 'soundfile-0.11.0.dist-info/top_level.txt'
  adding 'soundfile-0.11.0.dist-info/zip-safe'
  adding 'soundfile-0.11.0.dist-info/RECORD'
  removing build/bdist.linux-x86_64/wheel
  Building wheel for soundfile (setup.py): finished with status 'done'
  Created wheel for soundfile: filename=soundfile-0.11.0-py2.py3-none-win_amd64.whl size=23469 sha256=8cfeab124b1a168fea8aa5c6fea1bb66b5b1603fdc5cad0065ea2699c4095d5b
  Stored in directory: /tmp/pip-ephem-wheel-cache-3pqy128u/wheels/58/f9/8c/3cb9e52c0b4674df2b1b9779db06151aac1ae6223fbfddceec
Successfully built soundfile
Installing collected packages: soundfile

Successfully installed soundfile-0.11.0
WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv
Removed build tracker: '/tmp/pip-build-tracker-jrguuqgf'

Resource usage statistics from building pysoundfile:
   Process count: 3
   CPU time: Sys=0:00:00.2, User=0:00:00.5
   Memory: 80.1M
   Disk usage: 356B
   Time elapsed: 0:00:04.4


Packaging pysoundfile
INFO:conda_build.build:Packaging pysoundfile
Packaging pysoundfile-0.11.0-py_0
INFO:conda_build.build:Packaging pysoundfile-0.11.0-py_0
number of files: 11
Fixing permissions
Packaged license file/s.
INFO :: Time taken to mark (prefix)
        0 replacements in 0 files was 0.12 seconds
Importing conda-verify failed.  Please be sure to test your packages.  conda install conda-verify to make this message go away.
WARNING:conda_build.build:Importing conda-verify failed.  Please be sure to test your packages.  conda install conda-verify to make this message go away.
TEST START: /opt/conda/conda-bld/noarch/pysoundfile-0.11.0-py_0.tar.bz2
Adding in variants from /tmp/tmp732r3yoh/info/recipe/conda_build_config.yaml
INFO:conda_build.variants:Adding in variants from /tmp/tmp732r3yoh/info/recipe/conda_build_config.yaml
Renaming work directory '/opt/conda/conda-bld/pysoundfile_1671219418224/work' to '/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_noarch'
INFO:conda_build.utils:Renaming work directory '/opt/conda/conda-bld/pysoundfile_1671219418224/work' to '/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_noarch'
shutil.move(work)=/opt/conda/conda-bld/pysoundfile_1671219418224/work, dest=/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_noarch)
INFO:conda_build.utils:shutil.move(work)=/opt/conda/conda-bld/pysoundfile_1671219418224/work, dest=/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_noarch)
conda-forge/linux-64                                        Using cache
conda-forge/noarch                                          Using cache
opt/conda/conda-bld/linux-64                       129.0 B @ 586.4kB/s  0.0s
opt/conda/conda-bld/noarch                         690.0 B @ 430.4kB/s  0.0s
pkgs/main/noarch                                              No change
pkgs/main/linux-64                                            No change
pkgs/r/noarch                                                 No change
pkgs/r/linux-64                                               No change
Reloading output folder: /opt/conda/conda-bld
opt/conda/conda-bld/linux-64                       129.0 B @ 168.4kB/s  0.0s
opt/conda/conda-bld/noarch                         690.0 B @   1.9MB/s  0.0s

## Package Plan ##

  environment location: /opt/conda/conda-bld/pysoundfile_1671219418224/_test_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placeh


The following NEW packages will be INSTALLED:

    _libgcc_mutex:    0.1-conda_forge            conda-forge
    _openmp_mutex:    4.5-2_gnu                  conda-forge
    bzip2:            1.0.8-h7f98852_4           conda-forge
    ca-certificates:  2022.12.7-ha878542_0       conda-forge
    cffi:             1.15.1-py311h409f033_3     conda-forge
    gettext:          0.21.1-h27087fc_0          conda-forge
    lame:             3.100-h166bdaf_1003        conda-forge
    ld_impl_linux-64: 2.39-hcc3a1bd_1            conda-forge
    libblas:          3.9.0-16_linux64_openblas  conda-forge
    libcblas:         3.9.0-16_linux64_openblas  conda-forge
    libffi:           3.4.2-h7f98852_5           conda-forge
    libflac:          1.4.2-h27087fc_0           conda-forge
    libgcc-ng:        12.2.0-h65d4601_19         conda-forge
    libgfortran-ng:   12.2.0-h69a702a_19         conda-forge
    libgfortran5:     12.2.0-h337968e_19         conda-forge
    libgomp:          12.2.0-h65d4601_19         conda-forge
    liblapack:        3.9.0-16_linux64_openblas  conda-forge
    libnsl:           2.0.0-h7f98852_0           conda-forge
    libogg:           1.3.4-h7f98852_1           conda-forge
    libopenblas:      0.3.21-pthreads_h78a6416_3 conda-forge
    libopus:          1.3.1-h7f98852_1           conda-forge
    libsndfile:       1.1.0-hcb278e6_1           conda-forge
    libsqlite:        3.40.0-h753d276_0          conda-forge
    libstdcxx-ng:     12.2.0-h46fd767_19         conda-forge
    libuuid:          2.32.1-h7f98852_1000       conda-forge
    libvorbis:        1.3.7-h9c3ff4c_0           conda-forge
    libzlib:          1.2.13-h166bdaf_4          conda-forge
    mpg123:           1.31.1-h27087fc_0          conda-forge
    ncurses:          6.3-h27087fc_1             conda-forge
    numpy:            1.23.5-py311h7d28db0_0     conda-forge
    openssl:          3.0.7-h0b41bf4_1           conda-forge
    pip:              22.3.1-pyhd8ed1ab_0        conda-forge
    pycparser:        2.21-pyhd8ed1ab_0          conda-forge
    pysoundfile:      0.11.0-py_0                local
    python:           3.11.0-ha86cf86_0_cpython  conda-forge
    python_abi:       3.11-3_cp311               conda-forge
    readline:         8.1.2-h0f457ee_0           conda-forge
    setuptools:       65.5.1-pyhd8ed1ab_0        conda-forge
    tk:               8.6.12-h27826a3_0          conda-forge
    tzdata:           2022g-h191b570_0           conda-forge
    wheel:            0.38.4-pyhd8ed1ab_0        conda-forge
    xz:               5.2.6-h166bdaf_0           conda-forge

Preparing transaction: ...working... done
Verifying transaction: ...working... done
Executing transaction: ...working... done
export PREFIX=/opt/conda/conda-bld/pysoundfile_1671219418224/_test_env_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placehold_placeh
export SRC_DIR=/opt/conda/conda-bld/pysoundfile_1671219418224/test_tmp
import: 'soundfile'
import: 'soundfile'

Resource usage statistics from testing pysoundfile:
   Process count: 1
   CPU time: Sys=0:00:00.1, User=-
   Memory: 1.0M
   Disk usage: 16B
   Time elapsed: 0:00:02.5


TEST END: /opt/conda/conda-bld/noarch/pysoundfile-0.11.0-py_0.tar.bz2
Renaming work directory '/opt/conda/conda-bld/pysoundfile_1671219418224/work' to '/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_linux-64_main_build_loop'
INFO:conda_build.utils:Renaming work directory '/opt/conda/conda-bld/pysoundfile_1671219418224/work' to '/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_linux-64_main_build_loop'
shutil.move(work)=/opt/conda/conda-bld/pysoundfile_1671219418224/work, dest=/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_linux-64_main_build_loop)
INFO:conda_build.utils:shutil.move(work)=/opt/conda/conda-bld/pysoundfile_1671219418224/work, dest=/opt/conda/conda-bld/pysoundfile_1671219418224/work_moved_pysoundfile-0.11.0-py_0_linux-64_main_build_loop)
# Automatic uploading is disabled
# If you want to upload package(s) to anaconda.org later, type:


# To have conda build upload to anaconda.org automatically, use
# conda config --set anaconda_upload yes
anaconda upload \
    /opt/conda/conda-bld/noarch/pysoundfile-0.11.0-py_0.tar.bz2
anaconda_upload is not set.  Not uploading wheels: []

INFO :: The inputs making up the hashes for the built packages are as follows:
{
  "pysoundfile-0.11.0-py_0": {
    "recipe": {}
  }
}


####################################################################################
Resource usage summary:

Total time: 0:05:44.0
CPU usage: sys=0:00:00.2, user=0:00:00.5
Maximum memory usage observed: 80.1M
Total disk usage observed (not including envs): 372B
```

これと同様のchannel指定をboaで行う方法は方法は今のところ不明です。

### ビルドしたパッケージを使用する

ビルドしたパッケージは`/opt/conda/pkgs`の下に存在しています。

```sh
(base) root@f5a1409aeef8:/tmp/pysoundfile-feedstock/recipe# ls -la /opt/conda/pkgs | grep soundfile
drwxr-xr-x  4 root      root          4096 Dec 16 19:42 pysoundfile-0.11.0-py_0
-rw-r--r--  1 root      root         26792 Dec 16 19:41 pysoundfile-0.11.0-py_0.tar.bz2
```

これを使用するためには https://github.com/mamba-org/mamba/issues/1991 にあるように`-c local`を指定すれば良いようです。

```sh
$ python -c "import soundfile"  # error
$ micromamba install pysoundfile -c local
$ python -c "import soundfile"  # success
``

なお、上記では特に何も言われませんが、`pysoundfile`自体は実行環境に`libsndfile`が入っていないと動かないのではないかと思います。

```sh
$ apt install libsndfile1-dev
```