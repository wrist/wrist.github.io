<!--
.. title: nikolaでipynbファイルの公開設定を行う
.. slug: 3
.. date: 2018-06-16 14:00:00 UTC+09:00
.. tags: nikola, python
.. category: 
.. link: 
.. description: 
.. type: text
-->

## Nikolaでipynbファイルを使用する方法 ##

Nikolaでipynbファイルを使用する方法ですが、過去にdrillerさんが[Qiitaに書かれた記事](https://qiita.com/driller/items/2f8a0dd66d4d8e59e05c)を参考に追加することが可能です。

しかし、このままだとMathJaxが有効化されない、プロットした画像が描画されないなどの問題があったため、下記に簡単に対策を記載しておきます。

### 事前準備 ###

`conf.py`の`POSTS`と`PAGES`に`ipynb`用のエントリを追加しておきます。

### ipynbファイルでのブログ記事新規作成 ###

mdファイルでの作成と同じように`nikola new_post -f 形式`で形式にipynbを指定すれば良いです。

```sh
$ nikola new_post -f ipynb
```

記事タイトルを聞かれるので入力すると`posts`ディレクトリ下にipynbファイルが生成されます。

### 既存ipynbファイルの使用 ###

* `posts`ディレクトリ下に既存ipynbファイルを配置
* Jupyter Notebookで`Menu -> Edit -> Edit Notebook Metadata`を選択
* 下記のようなエントリを追加(最初の{...}は元々metadataに書かれていたエントリを省略したものです)

```json
{ {...},
  "nikola": {
    "tags": "python,pydata,numpy,scipy,librosa,scikit-learn",
    "title": "2018/2/28にPydata Osakaで'SciPyの概要と各モジュールの紹介'というタイトルで発表しました",
    "date": "2018-06-16 14:3:00 UTC+09:00",
    "type": "text",
    "slug": "4",
    "category": "",
    "link": "",
    "description": ""
  }
}
```

### ブログポストの構築 ###

markdownのときと同じように`nikola build`でブログを構築します。
`nikola serve`でローカルでの確認を取ります。

```sh
$ nikola build
$ nikola serve -b
```

### MathJaxの描画 ###

上記までで記事の追加は可能なのですが、このままだとMathJaxによる数式が描画されません。
描画するためには下記の対処を行います。

* CSPのdefault-srcに"https://cdnjs.cloudflare.com"を追加
    * [過去記事](./2.md)でも触れたように`conf.py`の`EXTRA_HEAD_DATA`を編集
* `conf.py`で無効化されている`MATHJAX_CONFIG`のオプションをコメントアウトして有効化

前者によってmathjaxがCDNから読み込まれるようになり、後者によって\$で囲われたインライン数式が描画されるようになります。(MathJaxはデフォルトでは\$によるインライン描画は有効化されていない)

### 画像、音声の読み込み ###

上記対策を行ってもipynbファイルに埋め込まれた画像、音声が描画されませんでした。これもCSPによってブロックされていたためです。対処としては、stackoverflowの[このQA](https://stackoverflow.com/questions/18447970/content-security-policy-data-not-working-for-base64-images-in-chrome-28)を参考に、CSPのdefault-srcにdata:を追加(`conf.py`の`EXTRA_HEAD_DATA`を編集)することでipynbにbase64で埋め込まれたdata:imageやdata:audioが読み込まれるようになりました。


## 参考 ##

* [drillerさんのQiitaの記事](https://qiita.com/driller/items/2f8a0dd66d4d8e59e05c)
