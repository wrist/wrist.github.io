<!--
.. title: jupyterlabのwav用MIMEレンダラーを作成しました
.. slug: 20
.. date: 2020-07-07 00:00:00 UTC+09:00
.. tags: jupyterlab,typescript
.. category: 
.. link: 
.. description: 
.. type: text
-->
# jupyterlabのwav用MIMEレンダラーを作成しました

## 概要

jupyterlab内でwavファイルが開けなかったので下記のチュートリアルを参考にMIMEレンダラーを作成しました。
https://github.com/jupyterlab/jupyterlab-mp4/blob/master/tutorial.md
正直wavファイルの場合は上記チュートリアルと全く同じ操作で作成できてしまいました。

## プロジェクトの初期化

`cookiecutter`を使って雛形を生成します。

```shell
❯ cookiecutter https://github.com/jupyterlab/mimerender-cookiecutter-ts.git
author_name []: wrist
author_email []: stoicheia1986@gmail.com
extension_name [myextension]: jupyterlab-wav
viewer_name [My Viewer]: JupyterLab wav viewer
mimetype [application/vnd.my_organization.my_type]: audio/wav
mimetype_name [my_type]: wav
file_extension [.my_type]: .wav
Select data_format:
1 - string
2 - json
Choose from 1, 2 (1, 2) [1]: 1
```

## Extensionのビルドとインストール

Extensionの作成には`yarn`のバージョンが固定された`jlpm`というjupyterlab付属のツールを用いて行います。
依存パッケージをインストールし、Extensionをビルドし、jupyterlabのextensionとしてインストールするためには下記を実行します。

```sh
jlpm install
jlpm run build
jupyter labextension install . --no-build
```

ここで上記をローカル環境で試したところ、jupyterlabのバージョンが1.2.1の場合は現在のJupyterlabとはバージョンの互換性がないというエラーがでてしまいました(既に2.0.0以上を想定している模様です)。

このためjupyterlabを動作させるために使用しているdocker imageである[wrist/jupyterlab-custom](https://hub.docker.com/repository/docker/wrist/jupyterlab-custom)を更新したのですが、
jupyterlab-vimは2.x系に対応してなかったので代わりに https://github.com/jwkvam/jupyterlab-vim/pull/115 などを参照し、
[@axlair/jupyterlab_vim](https://www.npmjs.com/package/@axlair/jupyterlab_vim)をインストールしています。
なお、ローカルでdocker imageをビルドする際に当初`jupyter lab build`を実行すると
下記issueと同じように`ensure-max-old-space`実行時にエラーが出てbuildできなくなりましたが、
osx上でDockerが使用するメモリを4096MBにしたところエラーが生じなくなりました。
https://github.com/jupyterlab/jupyterlab/issues/7907

## コードの監視

`jlpm run watch`でextensionのコードに変更があるとすぐにrecompileしてくれるようになります。
またjupyterlabを`jupyter lab --watch`として立ち上げるとその変更を監視しアプリケーションに取り込んでくれるようになります。
しかし手元ではwebpackがファイル監視に使用している`chokdair`を見つけられないというエラーで動作しないため一旦諦めました。
なお、上記watchを施さなくてもjupyterlab自体をreloadするとコードに変更があった場合はbuildを促されるので大きな問題は生じませんでした。

## コードの構造

自動生成されたコードの`src/index.ts`を見ると主に3つのデータ構造を含んでいます。

* `OutputWidget`クラス
    * 指定したMIMEタイプのデータを受け取りHTML DOMノードの中にどのように描画するのかを扱うクラス
    * extensionのほとんどのロジックを含む
* `rendererFactory`オブジェクト
    * `OutputWidget`クラスのインスタンスをどのようにアプリケーション内で生成するのかを扱うクラス
* `extension`オブジェクト
    * extensionのメインのエントリーポイントとなる部分
    * jupyterlabがextensionをロードする際に必要となるメタデータを書く

## コードの編集

下記編集を実施します。

* `OutputWidget`のリネーム
    * `src/index.ts`内の`OutputWidget`を`WavWidget`へとリネームします(2箇所)
* `extension`オブジェクトの`fileTypes`と`modelName`にbase64エンコードを指定
    * デフォルトだとプレーンテキストとして読もうとするのでbase64エンコードされたものとして読むための指定を追記
    * `fileType`に`fileFormat: 'base64'`、`documentWidgetFactoryOptions`に`modelName: 'base64'`を追加する
* レンダー方法の指定
    * `WavWidget`クラスを編集
        * コンストラクタにaudioタグを追加するためのコードを追加
        * `renderModel`メソッド内でaudioタグのsrcを指定
        
大した量ではないためコード全体を下記に記します。
        
        
```ts
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';



import { Widget } from '@lumino/widgets';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'audio/wav';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-wav';

/**
 * A widget for rendering wav.
 */
export class WavWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    /* 追加 */
    this._audio = document.createElement('audio');
    this._audio.setAttribute('controls', '');
    this.node.appendChild(this._audio);
  }

  /**
   * Render wav into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    
    let data = model.data[this._mimeType] as string;
    /* 元コードを削除し下記を追加 */
    this._audio.src = `data:${MIME_TYPE};base64,${data}`
    
    return Promise.resolve();
  }

  private _audio: HTMLAudioElement;
  private _mimeType: string;
}

/**
 * A mime renderer factory for wav data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new WavWidget(options)
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'jupyterlab-wav:plugin',
  rendererFactory,
  rank: 0,
  dataType: 'string',
  fileTypes: [
    {
      name: 'wav',
      fileFormat: 'base64',  // 追加
      mimeTypes: [MIME_TYPE],
      extensions: ['.wav']
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'JupyterLab wav viewer',
    primaryFileType: 'wav',
    modelName: 'base64',  // 追加
    fileTypes: ['wav'],
    defaultFor: ['wav']
  }
};

export default extension;
```

上記コードを再度ビルドしてjupyterlabを再読み込みすれば完了です。

## 実際の表示の例

左のファイルブラウザからwavファイルをダブルクリックすると下記のようにaudio要素が表示されます。

![audio要素](/images/20/wav_renderer.png)

ちなみにwavファイルを右クリックして表示される「Open in New Browser tab」を実行するとこのExtensionがなくてもブラウザの別タブで再生は元々可能です。

## npmjsへの投稿

[Extension Developer GUid](https://jupyterlab.readthedocs.io/en/stable/developer/extension_dev.html)の`Shipping Packages`の項を読むと
extensionは単一のJavascriptパッケージであり、npmjs.orgから配布できることや、
`jupyterlab-extension`というキーワードが`package.json`に含まれている場合JupyterLabのextension managerが見つけ出すことができるとの記載があります。
このキーワードはcookiecutterで自動生成された場合既に含まれているため、自ら追加する必要はありません。

よってnpmjs.orgへと登録することを考えます。
まずコマンドラインからnpmjsにログインしておきます。

```sh
$ npm adduser  # ユーザをnpmjs上に作成していない場合
$ npm login
```

次に`package.json`を編集し、`name`の値を`jupyterlab-wav`から`@wrist/jupyterlab-wav`というように`@username/extension-name`へと変えます。
更に必要に応じて`homepage`、`license`、`repository`などのフィールドを追加します。

最後に、`README.md`を編集して`jupyter labextension install`の部分を`@wrist/jupyterlab-wav`のように変更します。

上記を終えたら下記でnpmjsへとアップロードして終了です。

```sh
$ npm publish --access=public
```

無事にhttps://www.npmjs.com/package/@wrist/jupyterlab-wav へとアップロードされていれば、以後

```sh
$ jupyter labextension install @wrist/jupyterlab-wav
```

と打つことでインストールできるようになります。
実際に新規にコンテナを生成し直して上記を試したところ使えるようになりました。

## 今後

*  他のMIMEタイプにも対応させる
   * 人によってはmp3も同様に開きたいこともあるかもしれませんが、`MIME_TYPE`の部分が配列になっていることから複数拡張子に対して同じような実装を使いませせるような気がしています
* Web Audio APIを用いて波形描画やスペクトログラムを描画する