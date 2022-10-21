<!--
.. title: nikolaのバージョンをv8.0.0にアップグレード
.. slug: 11
.. date: 2018-09-16 12:30:00 UTC+09:00
.. tags: nikola
.. category: 
.. link: 
.. description: 
.. type: text
-->

## nikolaのバージョンをv8.0.0にアップグレード ##

### nikola v8.0.0 ###

2018/9/11にnikolaのメジャーバージョンが8.0にアップグレードされた。`pip install -U "Nikola[extras]"`を実行しアップグーレドを施したところ、各種設定を変更しなければならなかったためその作業ログを以下に記す。

各種設定変更のためには[Upgrading to Nikola v8](https://getnikola.com/blog/upgrading-to-nikola-v8.html)を参照すると良い。
ここでは単純に`pip install -U "Nikola[extras]"`を実行してしまったが、実際には`How to upgrade`の手順を読んだ上でアップグレードを行ったほうが良いと思われる。

### `conf.py`の修正 ###

`nikola --version`をブログが存在するディレクトリで実行したところ下記の警告が出た。

    [2018-09-16T03:11:45Z] WARNING: Nikola: The UNSLUGIFY_TITLES setting was renamed to FILE_METADATA_UNSLUGIFY_TITLES.
    [2018-09-16T03:11:45Z] WARNING: Nikola: The sections feature has been removed and its functionality has been merged into categories.
    [2018-09-16T03:11:45Z] WARNING: Nikola: For more information on how to migrate, please read: https://getnikola.com/blog/upgrading-to-nikola-v8.html#sections-were-replaced-by-categories
    [2018-09-16T03:11:45Z] INFO: Nikola: Setting CATEGORY_DESTPATH_AS_DEFAULT = True
    [2018-09-16T03:11:46Z] WARNING: Nikola: Cannot load theme "bootstrap3", using 'bootblog4' instead.
    ... 以後bootstrap3が存在しない旨を示すpythonのTracebackが表示される ...

これらのwarningを修正するために、下記に記した内容を実行した。

#### 名称が変更された設定の変更 ####

手元では`UNSLUGIFY_TITLES`を`FILE_METADATA_UNSLUGIFY_TITLES`に変更するのみで前述の最初のWARNINGは消えた。
どうやら[Upgrading to Nikola v8](https://getnikola.com/blog/upgrading-to-nikola-v8.html)を参照すると他項目についても変更されたものがある模様。以下に抜粋する。

* 削除されたもの
    * `FEED_PREVIEWIMAGE`
    * `SITEMAP_INCLUDE_FILELESS_DIRS`
    * `USE_OPEN_GRAPH`
    * `USE_BASE_TAG`
* 名称が変更されたもの
    * `UNSLUGIFY_TITLES` -> `FILE_METADATA_UNSLUGIFY_TITLES`
    * `TAG_PAGES_TITLES` -> `TAG_TITLES`
    * `TAG_PAGES_DESCRIPTIONS` -> `TAG_DESCRIPTIONS`
    * `CATEGORY_PAGES_TITLES` -> `CATEGORY_TITLES`
    * `CATEGORY_PAGES_DESCRIPTIONS` -> `CATEGORY_DESCRIPTIONS`
    * `DISABLE_INDEXES_PLUGIN_INDEX_AND_ATOM_FEED` -> `DISABLE_INDEXES and DISABLE_MAIN_ATOM_FEED`
    * `DISABLE_INDEXES_PLUGIN_RSS_FEED` -> `DISABLE_MAIN_RSS_FEED`

実際には他にも変更された項目が存在するため、調査した結果を末尾に示してある。

#### セクション(Sections)関連の設定の変更 ####

v8からはセクション関連の機能が削除されカテゴリに統合されたため、関連設定を削除する必要がある。
[Upgrading to Nikola v8](https://getnikola.com/blog/upgrading-to-nikola-v8.html)には書かれていないが、そもそも`POSTS_SECTIONS`の項目を消す必要がある。
これによって前述のログに存在したセクション関連の警告は消失する。

#### デフォルトテーマの変更 ####

アップグレード前はデフォルトテーマの`bootstrap3`を使っていたが、v8ではデフォルトテーマが`bootblog4`に変更された。
[Upgrading to Nikola v8](https://getnikola.com/blog/upgrading-to-nikola-v8.html)によれば`nikola theme -i bootstrap3`を実行しテーマをインストールすることによってbootstrap3は依然として使用できるようであるが、新デフォルトテーマのbootblog4では`featured posts`の表示などができるなど機能が追加されているとのことである。

ここでは`bootblog4`への変更を行った。前述のログでは最後の部分でpythonのTracebackが大量に表示されていたため、この修正も合わせて行った。以下に修正のために実施した内容を順に記す。

* `conf.py`の`THEME`を`bootblog4`に変更
* `nikola build`を実行
    * `nikola --version`を実行したときと同様なbootstrap3が存在しないというExceptionが表示され、再構築を行うことができない
* キャッシュが影響していることを疑い`cache`ディレクトリと`__pycache__`ディレクトリを削除
    * 状況は変化しない
* `nikola theme -i bootstrap3`を実行
    * 依然としてbootstrap3が存在しないというExceptionが表示されるためbootstrap3を再度導入することもできない
* Exceptionを吐いている`site-packages/nikola/utils.py`のソースを調査
    * エラーを吐いている`get_asset_path`のメソッドにおいてthemesのディレクトリを走査していることが問題の模様
* ブログルート直下のthemesディレクトリを他の場所に一時的に退避
    * Exceptionを吐くエラーが消失
* `nikola build`を実行
    * 無事にブログが再構築

したがって、theme関連のトラブルがなければ`conf.py`の修正のみで済む内容であったと思われる。

### その他`conf.py`の変化 ###

折角なので新規に`nikola init`を実行して生成したブログの`conf.py`とのdiffを取ってその他の変更を調べた。
コメントの変更や前述した変更については記載していない。また各項目の意味については全て把握していないため必要な場合は新規生成した`conf.py`に付与されたコメントなどを読んだほうが良い。

* `from __future__ import unicode_literals`の削除
* 対応言語の追加
    * `ml`, `th`, `vi`
* テーマ依存設定
    * `THEME_CONFIG`が追加されており、bootblog4テーマはこの設定によりfeatured postの設定やsidebarの設定が行えるようである
* `DATE_FORMAT`の変更
    * 元はdatetime.datetime.strftimeで用いられる形式だったがCLDRで用いられるフォーマットに変更されたとのこと
* `LOCALE_FALLBAK`と`LOCALE_DEFAULT`の削除
* セクション関連の項目の削除
    * `WRITE_TAG_CLUD`, `POST_SECTIONS`, `POST_SECTIONS_ARE_INDEXED`, `SECTION_PATH`, `POSTS_SECTION_COLORS`, `POSTS_SECTION_DESCRIPTIONS`, `POSTS_SECTION_FROM_META`, `POSTS_SECTOIN_NAME`, `POSTS_SECTION_TITLE`, `POSTS_SECTION_TRANSLATIONS`, `POSTS_SECTION_TRANSLATIONS_ADD_DEFAULTS`
* カテゴリー関連の項目の追加
    * `CATEGORY_DESTPATH_AS_DEFAULT`, `CATEGORY_DESTPATH_TRIM_PREFIX`, `CATEGORY_DESTPATH_FIRST_DIRECTORY_ONLY`, `CATEGORY_DESTPATH_NAMES`, `CATEGORY_PAGES_FOLLOW_DESTPATH`
* RSS関連の項目のの追加
    * `RSS_EXTENSION`
    * `RSS_FILENAME_BASE`
    * `ATOM_PATH`
    * `ATOM_FILENAME_BASE`
    * `ATOM_EXTENSION`
* `USE_BASE_TAG`の削除
* LESS, SASS関連設定の削除
    * `LESS_COMPILER`, `LESS_OPTIONS`, `SASS_COMPILER`, `SASS_OPTIONS`
* `PRESERVE_ICC_PROFILES`の追加
* `ANNOTATIONS`の削除
* `MARKDOWN_EXTENSION_CONFIGS`の追加
* `METADATA_VALUE_MAPPING`の追加
* `NO_DOCUTILS_TITLE_TRANSFORM`の削除
* `USE_TAG_METADATA`および`WARN_ABOUT_TAG_METADATA`の追加
