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


## PyData Osaka meetup #27

以上に記載した内容+αを12/17(土) 13:00より開催予定の[PyData Osakaのミートアップ](https://www.hiromasa.info/posts/27/)で紹介する予定です。
この記事で触れたmambaやboaについての紹介を行いたいと考えています。よろしければご参加ください。
