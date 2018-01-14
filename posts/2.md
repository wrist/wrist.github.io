<!--
.. title: nikolaでCSP、Google Analytics、SNSボタンの設定を行う
.. slug: 2
.. date: 2018-01-14 23:31:58 UTC+09:00
.. tags: nikola, python
.. category: 
.. link: 
.. description: 
.. type: text
-->

## 概要 ##

nikolaでCSP(Content Security Policy)の設定を行った上でGoogle Analyticsの設定を行い、またTwitter、Facebook、はてなブックマークボタンを設置したので下記に作業メモを書いておく。

## Content Security Policy(CSP)の設定 ##

CSPについての細かい説明はここでは書かないが、要はXSSを防ぐためにスクリプトや画像などのリソースをどのドメインからなら許容するかの設定である。
トラッキングコードやSNSボタンを設置する場合はこの設定を行う必要がある。設定していない場合はスクリプトや画像の読み込みが許可されないため、ボタンが表示されなかったりJavaScriptが動作しなかったりする。

### 設定方法 ###

CSPの設定はHTTPヘッダで設定するかMETAタグを用いて設定することができる。
nikolaはstaticファイルを吐き出すgeneratorなので後者のMETAタグを用いた設定を行うこととなる。
METAタグによる設定はHEADタグの最初に書くべきであるが、nikolaではHEADタグの頭に書くようなオプションはないため、仕方なく`EXTRA_HEAD_DATA`オプションにこのための設定を記述する。
実際に設定しているCSPの設定は下記の通りである。

```python
EXTRA_HEAD_DATA = """
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' http://*.google-analytics.com https://*.google-analytics.com https://code.jquery.com http://*.disqus.com https://disqus.com https://*.disqus.com https://*.disquscdn.com https://*.cloudinary.com http://www.gravatar.com https://www.googletagmanager.com https://*.twitter.com http://*.facebook.com https://*.facebook.com https://*.facebook.net http://*.hatena.ne.jp https://*.st-hatena.com;">
"""
```

基本的には"default-src"に対して'self'、'unsafe-inline'、および各ドメインに対する設定をhttpとhttpsに分けて記述している形になる。
'self'と'unsafe-inline'については[GoogleのCSPに関するページ](https://developers.google.com/web/fundamentals/security/csp/?hl=ja)に記載があるが、
'self'は現在のオリジンを、'unsafe-inline'はインラインJavaScriptおよびCSSを許可するための記述である。
シングルクォーテーションで囲う必要があるため注意が必要である。
各種ドメインに関する設定については、下記にあるSNSボタン設置などの設定を行いつつ、開発者コンソールを眺めながらブロックされているドメインを一つ一つ許可する、といったような形で行った。

### disqus対応 ###

開発者コンソールで見るとコメントシステムとして使用しているdisqusに関してもローディングに関するエラーを吐いていたため、[このリンク先](https://blog.mornati.net/disqus-and-content-security-policy/)を見た上でdisqusに関する記述も追加した。
リンク先ページにも記述があるように、evalを要求してくるような部分は上記CSP設定でもブロックされるが、これはdisqusによる広告の挿入のためであるとのことであるため、特に許可していない。

## Google Analyticsの設定 ##

Google Analyticsの設定はCSPと同様にHEADタグ内に書く必要があるため、`EXTRA_HEAD_DATA`のオプションに追加で設定する。

```python
EXTRA_HEAD_DATA = """
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-48887105-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXX');
</script>
<!-- End Google Analytics -->
"""
```

ここでは従来使われていたトラッキング用のコードではなく、Google Tag Managerを使用するコードの記載としている。"UA-XXXX"のXXXXの部分は各自独自の設定に書き換える必要がある。

## SNSボタンの設置 ##

[このページ](https://getnikola.com/social_buttons.html)に`SOCIAL_BUTTONS_CODE`の設定にAddthisというSNSボタンをまとめて設置するためのサービスを使って設定する旨がデフォルトとして書かれているが、

* `SOCIAL_BUTTONS_CODE`はbody末尾に追加されるためレイアウト的に微妙な位置にボタン類が追加される
* `SOCIAL_BUTTONS_CODE`のオプションは[このIssue](https://github.com/getnikola/nikola/issues/2840)で"Unneeded features"に分類されており、同じ用途であれば`BODY_END`のオプションが使える
* SNSボタンだけでなくaddthisに関するCSP設定も必要となる

などの理由から、結果として各サービスのSNSのボタンを個別に追加した方がトラブルを避けられたため、ここでは個別にどのように追加したかについて記載する。

### SNSボタンの設定方法 ###

前述のように`SOCIAL_BUTTONS_CODE`のオプションは使わない。代わりに`CONTENT_FOOTER`のオプションを使用する。`CONTENT_FOOTER`は当初下記のような記述になっている。

```python
CONTENT_FOOTER = "Contents &copy; {date}         <a href="mailto:{email}">{author}</a> - Powered by         <a href="https://getnikola.com" rel="nofollow">Nikola</a>         {license}"
```

上記は設定年、著者名、Nikolaによる生成であることをfooterとして設定するための記述となっている。
`{date}`や`{email}`、`{author}`など、埋め込み文字列のようになっている部分に気付くかもしれないが、
`CONTENT_FOOTER`オプションは`conf.py`上では文字列テンプレートとなっており、format関数を用いてformattingされる。
format関数の引数としては、別途設定されているオプション`CONTENT_FOOTER_FORMATS`が用いられる。
そのため、`CONTENT_FOOTER`中で`{`や`}`を用いる場合は、pythonのformat関数の仕様に合わせて`{{`や`}}`のように記述する必要があることに注意されたい。

SNSボタン設定に関する記述は、`CONTENT_FOOTER`の後続する部分にタグを埋め込むことで行う。
最終的には下記のような記述となっている。facebookのscript部分の中括弧を'{{'と'}}'に変えている。

```python
CONTENT_FOOTER = """Contents &copy; {date}         <a href="mailto:{email}">{author}</a> - Powered by         <a href="https://getnikola.com" rel="nofollow">Nikola</a>         {license}
<!-- twitter -->
<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-show-count="false">Tweet</a>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<!-- facebook -->
<div id="fb-root"></div>
<script>(function(d, s, id) {{
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = 'https://connect.facebook.net/ja_JP/sdk.js#xfbml=1&version=v2.11';
  fjs.parentNode.insertBefore(js, fjs);
}}(document, 'script', 'facebook-jssdk'));</script>
<div class="fb-like" data-action="like" data-size="small" data-show-faces="true" data-share="true"></div>

<!-- hatena -->
<a href="http://b.hatena.ne.jp/entry/" class="hatena-bookmark-button" data-hatena-bookmark-layout="basic-counter" title="このエントリーをはてなブックマークに追加">
<img src="https://b.st-hatena.com/images/entry-button/button-only@2x.png" alt="このエントリーをはてなブックマークに追加" width="20" height="20" style="border: none;" />
</a>
<script type="text/javascript" src="https://b.st-hatena.com/js/bookmark_button.js" charset="utf-8" async="async"></script>
"""
```

各SNSボタン用コードの取得に関しては以下に記述する。実際の見た目については一番下までスクロールすれば見えると思われる。

### twitter ###

[publish.twitter.com](https://publish.twitter.com/)でTwitter Buttonsを選び、続いてshare buttonを選ぶ。するとコードが表示されるので、これを`CONTENT_FOOTER`オプションに追加すれば良い。

### facebook ###

[いいね！ボタンの設定方法に関するページ](https://developers.facebook.com/docs/plugins/like-button)のジェネレータで吐き出されたコードを使用する。
「いいね！」するURLは空白、レイアウトは"button"、アクションタイプは"like"、ボタンサイズは"small"、友達の顔は表示する、シェアボタンを追加、のチェックは共にOnにした状態でコードを取得し、そのコードを`CONTENT_FOOTER`オプションに追加した。

#### Open Graph対応 ####

facebookのいいね・シェアボタンやGoogle Plusの+1ボタンなどが対応しているOpen Graphへの対応は`conf.py`のオプションを有効化することによって実現できる。下記オプションをTrueに設定すると、

```python
USE_OPEN_GRAPH = True
```

出力されるHTMLのheadタグ内に下記記述が追加される。

```html
<meta property="og:site_name" content="hiromasa.info">
<meta property="og:title" content="nikolaでCSP、Google Analytics、SNSボタンの設定を行う">
<meta property="og:url" content="http://www.hiromasa.info/posts/2/">
<meta property="og:description" content="...">
```

description内のcontentの記述は省略したが、本文(主にh2など)から抽出した内容が記載される。
なお、`USE_OPEN_GRAPH`のオプションは[このIssue](https://github.com/getnikola/nikola/issues/2840)で"Unnecessary customization"扱いとなっており、将来的にデフォルトでTrueになっている(オプションから消失している)可能性がある。

#### facebookボタン位置の調整 ####

ジェネレータが吐いたコードをそのまま使うと、facebookボタンが改行されてしまう。
これは単にblock要素であるdivを使っているためであるため、"fb-like"クラスと"fb-root"のidをinlineにするためのCSS設定を行うことでボタンが横並びになるように設定を行う。
また、横並びの配置にした場合においても、facebookのボタンの部分だけ下にずれてしまう。
この理由はボタンウィジェットに対するCSSの`vertical-align`がbottomになっているせいである([参考](https://developers.google.com/web/fundamentals/security/csp/?hl=ja))。
これを調整するためには`vertical-align`をbaselineにしてやれば良い。
これらのCSS設定は`HEAD`タグ内で設定する必要があるため、`EXTRA_HEAD_DATA`オプションにstyleタグおよび設定を追加する。

```html
EXTRA_HEAD_DATA = """
<!-- for facebook button -->
<style>
.fb-like {
    display: inline;
}
#fb-root {
    display: inline;
}
.fb_iframe_widget > span {
    vertical-align: baseline !important; 
}
</style>
"""
```

### はてなブックマークボタン ###

[設置方法](http://b.hatena.ne.jp/guide/bbutton)に従って出力されたコードをそのまま使用している。
ボタンのラベルは非表示、ブックマーク数は表示、保存するURLはページのURLを使う、に設定して取得したコードを`CONTENT_FOOTER`に追加している。

## 最終的な`EXTRA_HEAD_DATA` ##

上記の複数箇所で触れた`EXTRA_HEAD_DATA`は最終的に以下のような形で記述している。

```python
EXTRA_HEAD_DATA = """
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' http://*.google-analytics.com https://*.google-analytics.com https://code.jquery.com http://*.disqus.com https://disqus.com https://*.disqus.com https://*.disquscdn.com https://*.cloudinary.com http://www.gravatar.com https://www.googletagmanager.com https://*.twitter.com http://*.facebook.com https://*.facebook.com https://*.facebook.net http://*.hatena.ne.jp https://*.st-hatena.com;">

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-48887105-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXX');
</script>
<!-- End Google Analytics -->

<!-- for facebook button -->
<style>
.fb-like {
    display: inline;
}
#fb-root {
    display: inline;
}
.fb_iframe_widget > span {
    vertical-align: baseline !important; 
}
</style>
"""
```

## 参考 ##

* [Content Security Policyに関するMDNのページ](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP)
