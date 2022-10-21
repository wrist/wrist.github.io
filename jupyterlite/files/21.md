<!--
.. title: Xeus関連の情報(PyData Osaka 2020/8/2用の記事)
.. slug: 21
.. date: 2020-08-02 13:30:00 UTC+09:00
.. tags: jupyterlab,xeus,xeus-python,xeus-sqlite,slicerjupyter
.. category: 
.. link: 
.. description: 
.. type: text
-->

# Xeus関連の情報(PyData Osaka 2020/8/2用の記事)

* 最近のJupyter Blogから一部記事を抜粋して紹介します。
* Xeus関連の情報がメインです

## [Xeus is now Jupyter subproject (2020/2/4)](https://blog.jupyter.org/xeus-is-now-a-jupyter-subproject-c4ec5a1bf30b)

### `Xeus`とは

* Jupyter kernel protocolのC++実装
    * ipykernelの代替として使用可能
* `Xeus`はカーネルではなくカーネルを作るためのライブラリ
* いくつかのカーネルは`Xeus`を元に作られている
    * 下記はXeusメンテナたちによるもの
    * [`xeus-cling`](https://github.com/jupyter-xeus/xeus-cling)
        * CERNのCling C++インタプリタベースのカーネル
    * [`xeus-python`](https://github.com/jupyter-xeus/xeus-python)
        * pythonインタプリタを埋め込んだpython用カーネル
        * [@jupyterlab/debugger](https://github.com/jupyterlab/debugger)で用いられる`Jupyter debugger protocol`を初めて実装(後述)
        * [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)に対応
    * [`xeus-calc`](https://github.com/jupyter-xeus/xeus-calc)
        * 電卓カーネル、Xeusの使い方を学ぶためのプロジェクト
* Xeusプロジェクトとは関係なく作成されているカーネル
    * [`JuniperKernel`](https://github.com/JuniperKernel/JuniperKernel)
        * R用カーネル
    * [`xeus-fift`](https://github.com/atomex-me/xeus-fift)
        * fiftなるTelegramによって作られたTON blockchain contractのためのプログラミング言語向けカーネル
    * [`SlicerJupyter`](https://github.com/Slicer/SlicerJupyter)
        * Kitwareによる"Slicer"プロジェクトのQtイベントループと統合されたPython向けカーネル

### `Xeus`がJupyter管轄下へと移行した理由

以下に引用

    While Xeus started as a side project for QuantStack engineers,
    the project now has several stakeholders who depend on it.
    We think that moving the project to an open governance organization may be a better way to reflect this situation.


## [A visual debugger for Jupyter (2020/3/26)](https://blog.jupyter.org/a-visual-debugger-for-jupyter-914e61716559)

* 日本語の紹介記事
    * https://www.publickey1.jp/blog/20/jupyterlab.html

### 概要

* Jupyter向けのvisual debuggerに関する紹介
* debuggerでできることの例
    * ブレークポイントの設定(ノートブックのセルおよびソースファイル)
    * 変数一覧の表示
    * コールスタックの表示
* リンク先のbinderから試しに実行可能

### インストール方法

フロントエンドとなるプラグインとバックエンドとなるカーネルが必要

#### フロントエンド

```sh
$ jupyter labextension install @jupyterlab/debugger
```

このデバッガフロントエンドは将来のリリースにおいてはデフォルトで同梱される予定。

#### バックエンド

* `Jupyter Debug Protocol`(次の節で説明)を実装したカーネルが必要
    * このプロトコルを実装したカーネルはいまのところ`xeus-python`のみ
* ipykernelにデバッガプロトコルを実装するのはロードマップには存在

```sh
$ conda install xeus-python -c conda-forge
```

* プラットフォームによってはPyPIのwheelsも使えるがまだ実験段階のもの

* condaで試しにinstallして試してみたところxeus-pythonではmatplotlibがうまく扱えない模様
    * https://github.com/jupyter-xeus/xeus-python/issues/224

### Jupyter Debug Protocol

#### ControlおよびIOPub Channelに対する新しいメッセージタイプ

* Jupyter kernelはプロセス間コミュニケーションプロトコル(https://jupyter-client.readthedocs.io/en/stable/messaging.html)に基づき動作
    * Shellチャンネルはコード実行のリクエストなどのrequest/replyを行う
    * IOPubチャンネルはkernelからclientへの片方向のチャンネル(標準出力やエラー出力で使用)
    * ControlチャンネルはShellチャンネルに似ているが別ソケットで実行され、実行キューに溜めないhigh priorityなメッセージを扱う
        * InterruptやShutdownリクエストなど
        * debuggerに送られるコマンドに対してControlチャンネルを使うことに決めた
* protocolに2つのメッセージタイプを追加
    * [debug_request/reply](https://jupyter-client.readthedocs.io/en/latest/messaging.html#debug-request)
        * breakpointの追加やコードに対するstep into操作などのdebuggerによって実行される特定のアクションのrequest
        * Controlチャンネルに送られる
    * [debug_event](https://jupyter-client.readthedocs.io/en/latest/messaging.html#debug-event)
        * debugging kernelからフロントエンドに対して片方向に送られるdebug eventメッセージ
        * IOPubチャンネルを通じて送られる

#### Debug Adapter Protocolの拡張

* Jupyterにおけるデザインのキーとなる原理としてプログラミング言語について不可知であるというものがある
    * Jupyter debug protocolが他のカーネル実装に対しても適用できるものであることは重要である
* 標準的なプロトコルとしてMicrosoftの"Debug Adapter Protocol"(DAP)がある
    * JSONベースのprotocolでありVSCode下で様々な言語のバックエンドとして既に動作
* JupyterでDAPを用いることが自然であるが、Jupyterにおける要件を満たすためには十分ではない
    * ページ再読み込みのサポートが必要
        * Jupyter kernelはデバッガの状態(breakpointや現在どこでstopしているか)を後から接続したclientのために保持しなければならない
        * フロントエンドはその状態を`debug_request`メッセージで要求できる
    * ソースファイルベースではないnotebookのcellとconsoleに対するデバッグのサポートが必要
        * ブレークポイントを追加できるコードをdebuggerに送るためのメッセージが必要
* これらの変更は[JEP](https://github.com/jupyter/enhancement-proposals/pull/47)として提案されている
    * 文書は[こちら](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-debugger-protocol/jupyter-debugger-protocol.md)

### Xeus-python, the first Jupyter Kernel to support debugging

* XeusはC++はJupyter kernelプロトコルのC++実装
    * それ自身がkernelではなくkernel作成を補助するlibrary
    * CやC++ APIを持つ言語に対するカーネルを作成するのに便利
        * Python、Lua、SQLなど
* Xeus-pythonはdebugging protocolを実装する最初の実装として適切
    * プラガブルなconcurrencyモデルを持っているためControlチャンネルを別スレッドで動作させることが可能
    * 上記を繰り返し動作させるために便利なサンドボックスを持つ軽量なコードベースを持つ
        * ipykernelでdebuggingプロトコルを実装することはかなりのリファクタリングを要し早い段階でのconsensus buildingが必要となる
* Xeus-pythonのロードマップ
    * ipykernelに対して失われているmagicを追加
    * PyPI wheelsを改善
* 他のカーネルにおけるdebugging
    * xeusベースのkernelについては大部分の実装が共有可能であるため例えばxeus-clingなどでは早期に使用可能となる

### Diving into the debugger front-end architecture

* jupyterlabのdebugger extensionはユーザーが典型的なIDEから予想するようなUIを含む
    * サイドバーに変数エクスプローラ、ブレークポイントのリスト、ソースプレビュー、コールスタックを表示
    * コードの横に直接ブレークポイントを設定できる(cell/console)
    * 現在コードのどの部分で停止しているかを示すヴィジュアルマーカー
* screencastで種々の機能を説明
    * 実行後に削除したセルに対するstep intoはread-only viewとして表示される
    * コンソールおよびファイルに対してもデバッガは有効
    * デバッグはノートブックレベルで実行されるため異なるノートブックに対して同時にデバッグを実行できる
    * 変数一覧はtree形式およびtable形式で閲覧可能


### Future developments

* 2020年の予定
    * 変数ビューワでmime type renderingのサポート
    * 条件付きブレークポイントのサポート
    * debugger UXの向上
    * Voilå dashboardのデバッグの有効化

## [A Jupyter Kernel for SQLite](https://blog.jupyter.org/a-jupyter-kernel-for-sqlite-9549c5dcf551)

### 概要

* SQLite用jupyterカーネルの紹介
    * SQLiteのシンタックスをcode cellで受け付ける
    * magixコマンドでDBのオープンやクローズなどを行う
* Xeusを用いて作成
    * wrapperの[SQLiteCpp](https://github.com/SRombauts/SQLiteCpp)を使用

### 現在の状況

* 現在進行形で開発中だが下記を備えている
    * SQLiteインタフェースに対する完全な機能
    * 高レベル操作のためのmagic
        * DBの作成、オープン、クローズ、バックアップ
        * テーブルの存在チェック、keyの設定および解除、それらの情報の取得
* テーブル表示
    * jupyter lab/notebookではHTMLで表示
    * コンソールでは[tabulate](https://github.com/p-ranav/tabulate)ライブラリを使って表示

### future

* 直感的なデータ表示(plot, graph, chart, mapsなど)の描画
    * Vegaを使えないかを検討中(ブログの画像を参照)
* xeus-SQLiteとSQLiteライブラリのstaticビルドをバンドルしたシングルバイナリの供給

### その他

* binderで試しに実行可能(ブログ記事にリンク有)
* インストール方法
    * `mamba install xeus-sqlite -c conda-forge`
    * `conda install xeus-sqlite -c conda-forge`
    * [mamba](https://github.com/TheSnakePit/mamba)はcondaのc++による再実装らしい
        * 並列ダウンロードや高速な依存性解決を備えるとのこと

## [SlicerJupyter: a 3D Slicer kernel for interactive publications](https://blog.jupyter.org/slicerjupyter-a-3d-slicer-kernel-for-interactive-publications-6f2ad829f635)

### 概要

* [3D Slicer](https://www.slicer.org/)
    * Qtを用いたC++で書かれたデスクトップアプリケーション
        * 医用画像の分析および可視化に使用
    * 3D描画に[Visualization Toolkit(VTK)](https://vtk.org/)を用い、画像処理に[Insight Toolkit(ITK)](https://itk.org/)を用いている
    * pythonインタプリタが埋め込まれている
    * xeus-pythonのインタプリタを統合すればQtベースのデスクトップアプリケーションがnotebookを通じて操作できることを紹介
* githubの[SlicerJupyter](https://github.com/Slicer/SlicerJupyter)に実装が存在
    * BlenderやFreeCAD、ParaViewといったpythonが埋め込まれた他のアプリケーションに対しても拡張可能
* xeus-python integrationがJupyterのエコシステムとデスクトップアプリケーションの両方に対して必要不可欠

### Powerful Medical Imaging Capabilities Available Through Jupyter

* 3D Slicer(以下Slicer)は内蔵しているpythonインタプリタを通じてすべての機能をpyhonから操作可能
    * pythonインタプリタに対する単純なコンソールは備えているがcellベースのインタラクティブ環境は備えていない
* xeus-pythonを統合することによってSlicerのプロセスをJupyter kernelとして使用可能
* xeus-pythonは[itkwidgets](https://github.com/InsightSoftwareConsortium/itkwidgets)のようなJupyter widgetsへのインタフェースとなるだけではなく、SlicerインタプリタのようなカスタムインタプリタやQtイベントループのようなGUIイベントループとも統合することが可能
    * これによりSlicer内部表現であるMedical Reality Markup Language(MRML)の表現が可能となる
    * ノートブック内でpandasやNumPy配列のようなpythonのエコシステムを通じて完全なmedical imaging APIとデータへとアクセスが可能となる

### 対話的操作におけるレベル

* JupyterのWidget(sliderやボタンなど)をSlicer操作やデータ変更、処理やパラメータ可視化のために使える
* Widgetを通じた対話的操作は異なるレベルごとに実装されている

* Level1
    * Jupyter Widgetがアプリケーション固有のオブジェクトを自動変換の上で表示
    * 例えばSlicer markup fiducial listはフォーマット済みのテーブルとして表示され、モデルnodeは3Dオブジェクトとして描画される
* Level2
    * Static image widgetがデスクトップアプリケーションが描画したコンテンツを描画
    * これらのwidgetは追加された標準Widgetを用いてデータや描画パラメータが変更されることによって作成される
    * 様々なデータ型や非常に大きなデータセットなどの洗練された描画をJupyterから直接可能とする
* Level3
    * Dynamic viewer Widgetがデスクトップアプリケーションが描画した2D/3D viewをを描画
    * マウス/キーボードのイベントがデスクトップアプリケーションへと送られズームや回転を実現
        * アノテーションの付与、測定、画像分割のような3D対話操作をデスクトップアプリケーション上と同じように行える
        * これは[ipycanvas](https://ipycanvas.readthedocs.io/en/latest/)と[ipyevents](https://github.com/mwcraig/ipyevents)パッケージを用いて実現される
* Level4
    * 完全なGUI統合
        * ユーザーはアプリケーションウインドウを標準デスクトップWidget(スライダーやメニューなど)を含めてノートブックセルの中から見ることができる
        * これはSlicer Jupyterの中ではnoVNCとTigerVNCを用いて実現される
        * リモートサーバー上でアプリケーションが実行されているときに便利

* 現在は大部分の実装については安定しているが、まだデザイン面での改善やパフォーマンスの改善の余地がある
    * 自動変換(display hookの複雑な実装による)
    * xeus-pythonのスレッディングモデルはメインスレッドをロックしないように改良する余地がある
    * Level3の統合におけるdynamic viewer widgetはより高いリフレッシュレート実現のためにパフォーマンス最適化の余地がある

### History of Slicer and this integration

* QtベースのデスクトップアプリケーションによってXeusカーネルのイベントループが駆動されている？
