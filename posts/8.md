<!--
.. title: KaldiでVoxForgeの音響モデルを学習する(1)
.. slug: 8
.. date: 2018-09-02 11:00:00 UTC+09:00
.. tags: 音声認識,kaldi,音響モデル,言語モデル
.. category: 
.. link: 
.. description: 
.. type: text
-->

## KaldiでVoxForgeの音響モデルを学習する(1) ##

近年の音声認識のモデル学習ではデファクトスタンダードになっている[Kaldi](https://github.com/kaldi-asr/kaldi)の使い方を少しずつ学んでいくためにVoxForgeに対する学習レシピをローカルのマシンで実行したのでメモを下記に記す。

## 実行環境および学習完了までの所要時間 ##

* 使用マシン
    * MacBook Pro (13-inch, 2017, Four Thunderbolt 3 Ports)
* CPU
    * 3.3 GHz Intel Core i5
* メモリ
    * 16GB 2133 MHz LPDDR3
* GPU
    * なし(Intel Iris Plus Graphics 650 1536MB)

上記の環境でVoxForgeのレシピに下記で記述する修正を施したものを実行したところ、学習完了までに約5日間の時間を要した。


## 諸情報 ##

### VoxForge ###

[VoxForge](http://www.voxforge.org/)はGPLライセンス下で音声認識における音響モデル学習のための、ユーザーが送信した書き起こし付き音声コーパスを公開しているサイトである。
詳しくは[About](http://www.voxforge.org/home/about)のページを参照のこと。

### Kaldiにおける学習レシピ ###

Kaldiでは`egs`ディレクトリ以下にコーパス別にモデル学習のためのレシピが配置されている。ここでは`egs/voxforge/s5`に存在するスクリプトを用いる。

### VoxForge学習レシピの注意 ###

[このIssue](https://github.com/kaldi-asr/kaldi/issues/1363)によればVoxForgeに対する学習スクリプトは最新に保たれていないためLSTMを用いた学習などを行う場合はLibrispeechを用いたほうが良いとのこと。
この記事ではgitのcommit-idが`5b27111ae`である時点のスクリプトを対象としてるが、実際にVoxForge学習レシピを実行する際は下記に示すような種々の修正が必要となった。


## 実際の実行手順 ##

以下に実際の実行手順を示す。一部過去に実施したものも含むため完璧ではない可能性もある。
スクリプトファイルは特に明記していなければ`egs/voxforge/s5`以下のファイルを指す。

### データのダウンロード ###

#### `path.sh`の書き換え ####

データダウンロードのためにまずダウンロード先フォルダを指定する必要がある。
`path.sh`においてコメントアウトされている下記を有効化すると同ディレクトリ下にvoxforgeディレクトリを作成しその下にダウンロードしたデータを保存する。

```sh
export DATA_ROOT="$KALDI_ROOT/egs/voxforge/s5/voxforge"    # e.g. something like /media/secondary/voxforge
```

#### `getdata.sh`の実行 ####

```sh
$ ./getdata.sh
```

を実行してデータのダウンロードを実行する。
これによりダウンロードされた`voxforge/extracted`以下のデータを見るとここでは6243ディレクトリ存在していた。
ただしvoxforgeの音声データのダウンロード自体は昨年11月ごろに実行していたため現在は当記事よりも更にデータ数は増加している可能性がある。

### 依存ツール類の準備 ###

学習スクリプトを実行する前に依存ツール類をインストールしておく必要がある。
ツール類は`${KALDI_ROOT}/tools`以下に存在するスクリプトを用いて行う。

#### `SRILM`のインストール ####

言語モデルを構築するためにSRILMをインストールする。
インストールのためには`${KALDI_ROOT}/tools/install_srilm.sh`のインストールスクリプトを用いるが、SRILM.tar.gz自体は予め手動で入手し、同ディレクトリに配置しておく必要がある。

#### `sequitur`のインストール ####

`${KALDI_ROOT}/tools/extras/install_sequitur.sh`を用いてインストールを行う。
このスクリプトは内部でpython2系でしか実行できないスクリプトを実行するため、今回はpyenvで一時的にpython 2.7系に切り替えてインストールを実行した。

### Kaldiのビルド ###

学習のためにはKaldiのビルド自体を予め行っておく必要がある。
ビルドは下記のように実施した。

```sh
$ cd "${KALDI_ROOT}/src"
$ ./configure
$ make clean -j; make depend -j; make -j
```

外出したためいまいち正確ではないが完了までに約3時間要した。

### 学習スクリプトの実行 ###

#### `cmd.sh`の書き換え ####

KaldiではGridEngineを搭載したサーバクラスタ(qsubなどが使える環境)であれば並列計算が可能であるが、そうでない場合はシングルノードで学習を行う必要がある。これを変更するためには`cmd.sh`を下記のように`queue.pl`ではなく`run.pl`を実行するように書き換える。

```sh
# export train_cmd="queue.pl --mem 2G"
# export decode_cmd="queue.pl --mem 4G"
# export mkgraph_cmd="queue.pl --mem 8G"
export train_cmd="run.pl --mem 2G"
export decode_cmd="run.pl --mem 4G"
export mkgraph_cmd="run.pl --mem 8G"
```

#### `local/make_trans.py`の書き換え ####

python2.x系のスクリプトであるためpython3.x系で動くように下記のように修正する。

```python
diff --git a/egs/voxforge/s5/local/make_trans.py b/egs/voxforge/s5/local/make_trans.py
index 1b4f5c413..45a5b3a15 100755
--- a/egs/voxforge/s5/local/make_trans.py
+++ b/egs/voxforge/s5/local/make_trans.py
@@ -16,7 +16,8 @@ prefix_a0405 IT SEEMED THE ORDAINED ORDER OF THINGS THAT DOGS SHOULD WORK
 import sys

 def err(msg):
-    print >> sys.stderr, msg
+    #print >> sys.stderr, msg
+    print(msg, file=sys.stderr)

 if len(sys.argv) < 3:
     err("Usage: %s <prompts-file> <id-prefix> <utt-id1> <utt-id2> ... " % sys.argv[0])
@@ -27,7 +28,8 @@ id_prefix = sys.argv[2]
 utt_ids = sys.argv[3:]
 utt2trans = dict()
 unnorm_utt = set()
-for l in file(sys.argv[1]):
+#for l in file(sys.argv[1]):
+for l in open(sys.argv[1]):
     u, trans = l.split(None, 1)
     u = u.strip().split('/')[-1]
     trans = trans.strip().replace("-", " ")
@@ -46,5 +48,5 @@ for uid in utt_ids:
     if not uid in utt2trans:
         err("No transcript found for %s_%s" % (id_prefix, uid))
         continue
-    print "%s-%s %s" % (id_prefix, uid, utt2trans[uid])
+    print("%s-%s %s" % (id_prefix, uid, utt2trans[uid]))
```

#### `local/voxforge_prepare_dict.sh`の書き換え ####

sequitur-g2pの名前がsequiturになっているため、これを修正する。

```
diff --git a/egs/voxforge/s5/local/voxforge_prepare_dict.sh b/egs/voxforge/s5/local/voxforge_prepare_dict.sh
index 4242af29d..18d4498b3 100755
--- a/egs/voxforge/s5/local/voxforge_prepare_dict.sh
+++ b/egs/voxforge/s5/local/voxforge_prepare_dict.sh
@@ -49,7 +49,8 @@ if [[ "$(uname)" == "Darwin" ]]; then
   alias readlink=greadlink
 fi

-sequitur=$KALDI_ROOT/tools/sequitur
+#sequitur=$KALDI_ROOT/tools/sequitur
+sequitur=$KALDI_ROOT/tools/sequitur-g2p
 export PATH=$PATH:$sequitur/bin
 export PYTHONPATH=$PYTHONPATH:`utils/make_absolute.sh $sequitur/lib/python*/site-packages`
```

#### 学習の実行 ####

上記の変更を加えておけば`run.sh`で学習が実行されるはずである。

## 実行結果 ##

上記試行錯誤を行ったため、ログとしては途中(`utils/prepare_lang.sh`実行時)からになるが具体的な実行ログを下記に記す。2600行ぐらいあるので注意。当初は30%近くであったWERが学習が進むにつれて10%以下になっていくことが分かる。

```sh
# * Begin 8/3(Fri)
[wrist@wrist-pro 20:42:47] > ./run.sh                                                     [~/work/asr/kaldi/egs/voxforge/s5 (git)-[master]-]
utils/prepare_lang.sh --position-dependent-phones true data/local/dict !SIL data/local/lang data/lang
Checking data/local/dict/silence_phones.txt ...
--> reading data/local/dict/silence_phones.txt
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/local/dict/silence_phones.txt is OK

Checking data/local/dict/optional_silence.txt ...
--> reading data/local/dict/optional_silence.txt
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/local/dict/optional_silence.txt is OK

Checking data/local/dict/nonsilence_phones.txt ...
--> reading data/local/dict/nonsilence_phones.txt
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/local/dict/nonsilence_phones.txt is OK

Checking disjoint: silence_phones.txt, nonsilence_phones.txt
--> disjoint property is OK.

Checking data/local/dict/lexicon.txt
--> reading data/local/dict/lexicon.txt
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/local/dict/lexicon.txt is OK

Checking data/local/dict/lexiconp.txt
--> reading data/local/dict/lexiconp.txt
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/local/dict/lexiconp.txt is OK

Checking lexicon pair data/local/dict/lexicon.txt and data/local/dict/lexiconp.txt
--> lexicon pair data/local/dict/lexicon.txt and data/local/dict/lexiconp.txt match

Checking data/local/dict/extra_questions.txt ...
--> data/local/dict/extra_questions.txt is empty (this is OK)
--> SUCCESS [validating dictionary directory data/local/dict]

fstaddselfloops data/lang/phones/wdisambig_phones.int data/lang/phones/wdisambig_words.int
prepare_lang.sh: validating output directory
utils/validate_lang.pl data/lang
Checking data/lang/phones.txt ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/lang/phones.txt is OK

Checking words.txt: #0 ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> data/lang/words.txt is OK

Checking disjoint: silence.txt, nonsilence.txt, disambig.txt ...
--> silence.txt and nonsilence.txt are disjoint
--> silence.txt and disambig.txt are disjoint
--> disambig.txt and nonsilence.txt are disjoint
--> disjoint property is OK

Checking sumation: silence.txt, nonsilence.txt, disambig.txt ...
--> summation property is OK

Checking data/lang/phones/context_indep.{txt, int, csl} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 5 entry/entries in data/lang/phones/context_indep.txt
--> data/lang/phones/context_indep.int corresponds to data/lang/phones/context_indep.txt
--> data/lang/phones/context_indep.csl corresponds to data/lang/phones/context_indep.txt
--> data/lang/phones/context_indep.{txt, int, csl} are OK

Checking data/lang/phones/nonsilence.{txt, int, csl} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 156 entry/entries in data/lang/phones/nonsilence.txt
--> data/lang/phones/nonsilence.int corresponds to data/lang/phones/nonsilence.txt
--> data/lang/phones/nonsilence.csl corresponds to data/lang/phones/nonsilence.txt
--> data/lang/phones/nonsilence.{txt, int, csl} are OK

Checking data/lang/phones/silence.{txt, int, csl} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 5 entry/entries in data/lang/phones/silence.txt
--> data/lang/phones/silence.int corresponds to data/lang/phones/silence.txt
--> data/lang/phones/silence.csl corresponds to data/lang/phones/silence.txt
--> data/lang/phones/silence.{txt, int, csl} are OK

Checking data/lang/phones/optional_silence.{txt, int, csl} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 1 entry/entries in data/lang/phones/optional_silence.txt
--> data/lang/phones/optional_silence.int corresponds to data/lang/phones/optional_silence.txt
--> data/lang/phones/optional_silence.csl corresponds to data/lang/phones/optional_silence.txt
--> data/lang/phones/optional_silence.{txt, int, csl} are OK

Checking data/lang/phones/disambig.{txt, int, csl} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 6 entry/entries in data/lang/phones/disambig.txt
--> data/lang/phones/disambig.int corresponds to data/lang/phones/disambig.txt
--> data/lang/phones/disambig.csl corresponds to data/lang/phones/disambig.txt
--> data/lang/phones/disambig.{txt, int, csl} are OK

Checking data/lang/phones/roots.{txt, int} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 40 entry/entries in data/lang/phones/roots.txt
--> data/lang/phones/roots.int corresponds to data/lang/phones/roots.txt
--> data/lang/phones/roots.{txt, int} are OK

Checking data/lang/phones/sets.{txt, int} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 40 entry/entries in data/lang/phones/sets.txt
--> data/lang/phones/sets.int corresponds to data/lang/phones/sets.txt
--> data/lang/phones/sets.{txt, int} are OK

Checking data/lang/phones/extra_questions.{txt, int} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 9 entry/entries in data/lang/phones/extra_questions.txt
--> data/lang/phones/extra_questions.int corresponds to data/lang/phones/extra_questions.txt
--> data/lang/phones/extra_questions.{txt, int} are OK

Checking data/lang/phones/word_boundary.{txt, int} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 161 entry/entries in data/lang/phones/word_boundary.txt
--> data/lang/phones/word_boundary.int corresponds to data/lang/phones/word_boundary.txt
--> data/lang/phones/word_boundary.{txt, int} are OK

Checking optional_silence.txt ...
--> reading data/lang/phones/optional_silence.txt
--> data/lang/phones/optional_silence.txt is OK

Checking disambiguation symbols: #0 and #1
--> data/lang/phones/disambig.txt has "#0" and "#1"
--> data/lang/phones/disambig.txt is OK

Checking topo ...

Checking word_boundary.txt: silence.txt, nonsilence.txt, disambig.txt ...
--> data/lang/phones/word_boundary.txt doesn't include disambiguation symbols
--> data/lang/phones/word_boundary.txt is the union of nonsilence.txt and silence.txt
--> data/lang/phones/word_boundary.txt is OK

Checking word-level disambiguation symbols...
--> data/lang/phones/wdisambig.txt exists (newer prepare_lang.sh)
Checking word_boundary.int and disambig.int
--> generating a 51 word sequence
--> resulting phone sequence from L.fst corresponds to the word sequence
--> L.fst is OK
--> generating a 16 word sequence
--> resulting phone sequence from L_disambig.fst corresponds to the word sequence
--> L_disambig.fst is OK

Checking data/lang/oov.{txt, int} ...
--> text seems to be UTF-8 or ASCII, checking whitespaces
--> text contains only allowed whitespaces
--> 1 entry/entries in data/lang/oov.txt
--> data/lang/oov.int corresponds to data/lang/oov.txt
--> data/lang/oov.{txt, int} are OK

--> data/lang/L.fst is olabel sorted
--> data/lang/L_disambig.fst is olabel sorted
--> SUCCESS [validating lang directory data/lang]
=== Preparing train and test data ...
--- Preparing the grammar transducer (G.fst) for testing ...
arpa2fst --disambig-symbol=#0 --read-symbol-table=data/lang_test/words.txt - data/lang_test/G.fst
LOG (arpa2fst[5.4.228~1-5b27]:Read():arpa-file-parser.cc:94) Reading \data\ section.
LOG (arpa2fst[5.4.228~1-5b27]:Read():arpa-file-parser.cc:149) Reading \1-grams: section.
LOG (arpa2fst[5.4.228~1-5b27]:Read():arpa-file-parser.cc:149) Reading \2-grams: section.
LOG (arpa2fst[5.4.228~1-5b27]:RemoveRedundantStates():arpa-lm-compiler.cc:359) Reduced num-states from 13940 to 13940
fstisstochastic data/lang_test/G.fst
7.16284e-07 -0.450846
*** Succeeded in formatting data.
steps/make_mfcc.sh --cmd run.pl --mem 2G --nj 2 data/train exp/make_mfcc/train /Users/wrist/work/asr/kaldi/egs/voxforge/s5/../../../egs/voxforge/s5/voxforge/mfcc
utils/validate_data_dir.sh: Successfully validated data-directory data/train
steps/make_mfcc.sh: [info]: no segments file exists: assuming wav.scp indexed by utterance.
Succeeded creating MFCC features for train
steps/compute_cmvn_stats.sh data/train exp/make_mfcc/train /Users/wrist/work/asr/kaldi/egs/voxforge/s5/../../../egs/voxforge/s5/voxforge/mfcc
Succeeded creating CMVN stats for train
steps/make_mfcc.sh --cmd run.pl --mem 2G --nj 2 data/test exp/make_mfcc/test /Users/wrist/work/asr/kaldi/egs/voxforge/s5/../../../egs/voxforge/s5/voxforge/mfcc
utils/validate_data_dir.sh: Successfully validated data-directory data/test
steps/make_mfcc.sh: [info]: no segments file exists: assuming wav.scp indexed by utterance.
Succeeded creating MFCC features for test
steps/compute_cmvn_stats.sh data/test exp/make_mfcc/test /Users/wrist/work/asr/kaldi/egs/voxforge/s5/../../../egs/voxforge/s5/voxforge/mfcc
Succeeded creating CMVN stats for test
utils/subset_data_dir.sh: reducing #utt from    59039 to     1000
steps/train_mono.sh --nj 2 --cmd run.pl --mem 2G data/train.1k data/lang exp/mono
steps/train_mono.sh: Initializing monophone system.
steps/train_mono.sh: Compiling training graphs
steps/train_mono.sh: Aligning data equally (pass 0)
steps/train_mono.sh: Pass 1
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 2
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 3
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 4
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 5
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 6
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 7
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 8
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 9
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 10
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 11
steps/train_mono.sh: Pass 12
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 13
steps/train_mono.sh: Pass 14
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 15
steps/train_mono.sh: Pass 16
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 17
steps/train_mono.sh: Pass 18
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 19
steps/train_mono.sh: Pass 20
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 21
steps/train_mono.sh: Pass 22
steps/train_mono.sh: Pass 23
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 24
steps/train_mono.sh: Pass 25
steps/train_mono.sh: Pass 26
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 27
steps/train_mono.sh: Pass 28
steps/train_mono.sh: Pass 29
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 30
steps/train_mono.sh: Pass 31
steps/train_mono.sh: Pass 32
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 33
steps/train_mono.sh: Pass 34
steps/train_mono.sh: Pass 35
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 36
steps/train_mono.sh: Pass 37
steps/train_mono.sh: Pass 38
steps/train_mono.sh: Aligning data
steps/train_mono.sh: Pass 39
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/mono
steps/diagnostic/analyze_alignments.sh: see stats in exp/mono/log/analyze_alignments.log
1015 warnings in exp/mono/log/align.*.*.log
68 warnings in exp/mono/log/acc.*.*.log
exp/mono: nj=2 align prob=-92.05 over 1.38h [retry=0.3%, fail=0.1%] states=122 gauss=995
steps/train_mono.sh: Done training monophone system in exp/mono
tree-info exp/mono/tree
tree-info exp/mono/tree
fstpushspecial
fstdeterminizestar --use-log=true
fstminimizeencoded
fsttablecompose data/lang_test/L_disambig.fst data/lang_test/G.fst
fstisstochastic data/lang_test/tmp/LG.fst
-0.0235247 -0.0242415
[info]: LG not stochastic.
fstcomposecontext --context-size=1 --central-position=0 --read-disambig-syms=data/lang_test/phones/disambig.int --write-disambig-syms=data/lang_test/tmp/disambig_ilabels_1_0.int data/lang_test/tmp/ilabels_1_0.53032
fstisstochastic data/lang_test/tmp/CLG_1_0.fst
-0.0235247 -0.0242415
[info]: CLG not stochastic.
make-h-transducer --disambig-syms-out=exp/mono/graph/disambig_tid.int --transition-scale=1.0 data/lang_test/tmp/ilabels_1_0 exp/mono/tree exp/mono/final.mdl
fstminimizeencoded
fstdeterminizestar --use-log=true
fsttablecompose exp/mono/graph/Ha.fst data/lang_test/tmp/CLG_1_0.fst
fstrmsymbols exp/mono/graph/disambig_tid.int
fstrmepslocal
fstisstochastic exp/mono/graph/HCLGa.fst
4.82164e-05 -0.0382094
HCLGa is not stochastic
add-self-loops --self-loop-scale=0.1 --reorder=true exp/mono/final.mdl
steps/decode.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G exp/mono/graph data/test exp/mono/decode
decode.sh: feature type is delta
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/mono/graph exp/mono/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/mono/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,23,195) and mean=71.9
steps/diagnostic/analyze_lats.sh: see stats in exp/mono/decode/log/analyze_lattice_depth_stats.log
exp/mono/decode/wer_10
%WER 47.49 [ 2121 / 4466, 53 ins, 720 del, 1348 sub ]
%SER 89.20 [ 446 / 500 ]
exp/mono/decode/wer_11
%WER 48.01 [ 2144 / 4466, 45 ins, 781 del, 1318 sub ]
%SER 89.20 [ 446 / 500 ]
exp/mono/decode/wer_12
%WER 48.70 [ 2175 / 4466, 38 ins, 851 del, 1286 sub ]
%SER 89.80 [ 449 / 500 ]
exp/mono/decode/wer_13
%WER 48.84 [ 2181 / 4466, 33 ins, 891 del, 1257 sub ]
%SER 89.80 [ 449 / 500 ]
exp/mono/decode/wer_14
%WER 50.07 [ 2236 / 4466, 27 ins, 977 del, 1232 sub ]
%SER 90.80 [ 454 / 500 ]
exp/mono/decode/wer_15
%WER 52.02 [ 2323 / 4466, 25 ins, 1053 del, 1245 sub ]
%SER 90.80 [ 454 / 500 ]
exp/mono/decode/wer_16
%WER 52.66 [ 2352 / 4466, 19 ins, 1106 del, 1227 sub ]
%SER 90.60 [ 453 / 500 ]
exp/mono/decode/wer_17
%WER 53.96 [ 2410 / 4466, 17 ins, 1164 del, 1229 sub ]
%SER 91.20 [ 456 / 500 ]
exp/mono/decode/wer_7
%WER 49.04 [ 2190 / 4466, 109 ins, 564 del, 1517 sub ]
%SER 90.60 [ 453 / 500 ]
exp/mono/decode/wer_8
%WER 47.69 [ 2130 / 4466, 77 ins, 609 del, 1444 sub ]
%SER 89.60 [ 448 / 500 ]
exp/mono/decode/wer_9
%WER 47.34 [ 2114 / 4466, 63 ins, 672 del, 1379 sub ]
%SER 88.40 [ 442 / 500 ]
steps/align_si.sh --nj 2 --cmd run.pl --mem 2G data/train data/lang exp/mono exp/mono_ali
steps/align_si.sh: feature type is delta
steps/align_si.sh: aligning data in data/train using model from exp/mono, putting alignments in exp/mono_ali
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/mono_ali
steps/diagnostic/analyze_alignments.sh: see stats in exp/mono_ali/log/analyze_alignments.log
steps/align_si.sh: done aligning data.
steps/train_deltas.sh --cmd run.pl --mem 2G 2000 11000 data/train data/lang exp/mono_ali exp/tri1
steps/train_deltas.sh: accumulating tree stats
steps/train_deltas.sh: getting questions for tree-building, via clustering
steps/train_deltas.sh: building the tree
steps/train_deltas.sh: converting alignments from exp/mono_ali to use current tree
steps/train_deltas.sh: compiling graphs of transcripts
steps/train_deltas.sh: training pass 1
steps/train_deltas.sh: training pass 2
steps/train_deltas.sh: training pass 3
steps/train_deltas.sh: training pass 4
steps/train_deltas.sh: training pass 5
steps/train_deltas.sh: training pass 6
steps/train_deltas.sh: training pass 7
steps/train_deltas.sh: training pass 8
steps/train_deltas.sh: training pass 9
steps/train_deltas.sh: training pass 10
steps/train_deltas.sh: aligning data
steps/train_deltas.sh: training pass 11
steps/train_deltas.sh: training pass 12
steps/train_deltas.sh: training pass 13
steps/train_deltas.sh: training pass 14
steps/train_deltas.sh: training pass 15
steps/train_deltas.sh: training pass 16
steps/train_deltas.sh: training pass 17
steps/train_deltas.sh: training pass 18
steps/train_deltas.sh: training pass 19
steps/train_deltas.sh: training pass 20
steps/train_deltas.sh: aligning data
steps/train_deltas.sh: training pass 21
steps/train_deltas.sh: training pass 22
steps/train_deltas.sh: training pass 23
steps/train_deltas.sh: training pass 24
steps/train_deltas.sh: training pass 25
steps/train_deltas.sh: training pass 26
steps/train_deltas.sh: training pass 27
steps/train_deltas.sh: training pass 28
steps/train_deltas.sh: training pass 29
steps/train_deltas.sh: training pass 30
steps/train_deltas.sh: aligning data
steps/train_deltas.sh: training pass 31
steps/train_deltas.sh: training pass 32
steps/train_deltas.sh: training pass 33
steps/train_deltas.sh: training pass 34
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/tri1
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri1/log/analyze_alignments.log
3344 warnings in exp/tri1/log/acc.*.*.log
1 warnings in exp/tri1/log/build_tree.log
3306 warnings in exp/tri1/log/align.*.*.log
exp/tri1: nj=2 align prob=-90.58 over 81.14h [retry=1.6%, fail=0.2%] states=1584 gauss=11030 tree-impr=3.41
steps/train_deltas.sh: Done training system with delta+delta-delta features in exp/tri1
tree-info exp/tri1/tree
tree-info exp/tri1/tree
fstcomposecontext --context-size=3 --central-position=1 --read-disambig-syms=data/lang_test/phones/disambig.int --write-disambig-syms=data/lang_test/tmp/disambig_ilabels_3_1.int data/lang_test/tmp/ilabels_3_1.58654
fstisstochastic data/lang_test/tmp/CLG_3_1.fst
0 -0.0242415
[info]: CLG not stochastic.
make-h-transducer --disambig-syms-out=exp/tri1/graph/disambig_tid.int --transition-scale=1.0 data/lang_test/tmp/ilabels_3_1 exp/tri1/tree exp/tri1/final.mdl
fstrmsymbols exp/tri1/graph/disambig_tid.int
fstrmepslocal
fstdeterminizestar --use-log=true
fstminimizeencoded
fsttablecompose exp/tri1/graph/Ha.fst data/lang_test/tmp/CLG_3_1.fst
fstisstochastic exp/tri1/graph/HCLGa.fst
0.000486887 -0.0642726
HCLGa is not stochastic
add-self-loops --self-loop-scale=0.1 --reorder=true exp/tri1/final.mdl
steps/decode.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G exp/tri1/graph data/test exp/tri1/decode
decode.sh: feature type is delta
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri1/graph exp/tri1/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/tri1/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,3,47) and mean=19.5
steps/diagnostic/analyze_lats.sh: see stats in exp/tri1/decode/log/analyze_lattice_depth_stats.log
exp/tri1/decode/wer_10
%WER 22.55 [ 1007 / 4466, 85 ins, 222 del, 700 sub ]
%SER 61.40 [ 307 / 500 ]
exp/tri1/decode/wer_11
%WER 21.36 [ 954 / 4466, 64 ins, 233 del, 657 sub ]
%SER 59.40 [ 297 / 500 ]
exp/tri1/decode/wer_12
%WER 20.82 [ 930 / 4466, 48 ins, 246 del, 636 sub ]
%SER 59.20 [ 296 / 500 ]
exp/tri1/decode/wer_13
%WER 20.67 [ 923 / 4466, 39 ins, 277 del, 607 sub ]
%SER 58.00 [ 290 / 500 ]
exp/tri1/decode/wer_14
%WER 20.58 [ 919 / 4466, 37 ins, 291 del, 591 sub ]
%SER 57.40 [ 287 / 500 ]
exp/tri1/decode/wer_15
%WER 20.62 [ 921 / 4466, 32 ins, 304 del, 585 sub ]
%SER 57.00 [ 285 / 500 ]
exp/tri1/decode/wer_16
%WER 21.07 [ 941 / 4466, 31 ins, 319 del, 591 sub ]
%SER 58.20 [ 291 / 500 ]
exp/tri1/decode/wer_17
%WER 20.94 [ 935 / 4466, 27 ins, 334 del, 574 sub ]
%SER 58.20 [ 291 / 500 ]
exp/tri1/decode/wer_7
%WER 27.45 [ 1226 / 4466, 157 ins, 163 del, 906 sub ]
%SER 71.60 [ 358 / 500 ]
exp/tri1/decode/wer_8
%WER 25.26 [ 1128 / 4466, 126 ins, 178 del, 824 sub ]
%SER 67.00 [ 335 / 500 ]
exp/tri1/decode/wer_9
%WER 23.56 [ 1052 / 4466, 103 ins, 195 del, 754 sub ]
%SER 64.40 [ 322 / 500 ]
steps/align_si.sh --nj 2 --cmd run.pl --mem 2G --use-graphs true data/train data/lang exp/tri1 exp/tri1_ali
steps/align_si.sh: feature type is delta
steps/align_si.sh: aligning data in data/train using model from exp/tri1, putting alignments in exp/tri1_ali
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/tri1_ali
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri1_ali/log/analyze_alignments.log
steps/align_si.sh: done aligning data.
steps/train_deltas.sh --cmd run.pl --mem 2G 2000 11000 data/train data/lang exp/tri1_ali exp/tri2a
steps/train_deltas.sh: accumulating tree stats
steps/train_deltas.sh: getting questions for tree-building, via clustering
steps/train_deltas.sh: building the tree
steps/train_deltas.sh: converting alignments from exp/tri1_ali to use current tree
steps/train_deltas.sh: compiling graphs of transcripts
steps/train_deltas.sh: training pass 1
steps/train_deltas.sh: training pass 2
steps/train_deltas.sh: training pass 3
steps/train_deltas.sh: training pass 4
steps/train_deltas.sh: training pass 5
steps/train_deltas.sh: training pass 6
steps/train_deltas.sh: training pass 7
steps/train_deltas.sh: training pass 8
steps/train_deltas.sh: training pass 9
steps/train_deltas.sh: training pass 10
steps/train_deltas.sh: aligning data
steps/train_deltas.sh: training pass 11
steps/train_deltas.sh: training pass 12
steps/train_deltas.sh: training pass 13
steps/train_deltas.sh: training pass 14
steps/train_deltas.sh: training pass 15
steps/train_deltas.sh: training pass 16
steps/train_deltas.sh: training pass 17
steps/train_deltas.sh: training pass 18
steps/train_deltas.sh: training pass 19
steps/train_deltas.sh: training pass 20
steps/train_deltas.sh: aligning data
steps/train_deltas.sh: training pass 21
steps/train_deltas.sh: training pass 22
steps/train_deltas.sh: training pass 23
steps/train_deltas.sh: training pass 24
steps/train_deltas.sh: training pass 25
steps/train_deltas.sh: training pass 26
steps/train_deltas.sh: training pass 27
steps/train_deltas.sh: training pass 28
steps/train_deltas.sh: training pass 29
steps/train_deltas.sh: training pass 30
steps/train_deltas.sh: aligning data
steps/train_deltas.sh: training pass 31
steps/train_deltas.sh: training pass 32
steps/train_deltas.sh: training pass 33
steps/train_deltas.sh: training pass 34
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/tri2a
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri2a/log/analyze_alignments.log
3770 warnings in exp/tri2a/log/acc.*.*.log
3334 warnings in exp/tri2a/log/align.*.*.log
1 warnings in exp/tri2a/log/build_tree.log
exp/tri2a: nj=2 align prob=-90.54 over 81.18h [retry=1.5%, fail=0.2%] states=1584 gauss=11021 tree-impr=3.75
steps/train_deltas.sh: Done training system with delta+delta-delta features in exp/tri2a
tree-info exp/tri2a/tree
tree-info exp/tri2a/tree
make-h-transducer --disambig-syms-out=exp/tri2a/graph/disambig_tid.int --transition-scale=1.0 data/lang_test/tmp/ilabels_3_1 exp/tri2a/tree exp/tri2a/final.mdl
fstrmsymbols exp/tri2a/graph/disambig_tid.int
fstdeterminizestar --use-log=true
fstrmepslocal
fstminimizeencoded
fsttablecompose exp/tri2a/graph/Ha.fst data/lang_test/tmp/CLG_3_1.fst
fstisstochastic exp/tri2a/graph/HCLGa.fst
0.000486887 -0.0644194
HCLGa is not stochastic
add-self-loops --self-loop-scale=0.1 --reorder=true exp/tri2a/final.mdl
steps/decode.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G exp/tri2a/graph data/test exp/tri2a/decode
decode.sh: feature type is delta
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri2a/graph exp/tri2a/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2a/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,3,46) and mean=21.0
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2a/decode/log/analyze_lattice_depth_stats.log
exp/tri2a/decode/wer_10
%WER 21.65 [ 967 / 4466, 78 ins, 210 del, 679 sub ]
%SER 61.80 [ 309 / 500 ]
exp/tri2a/decode/wer_11
%WER 21.50 [ 960 / 4466, 64 ins, 241 del, 655 sub ]
%SER 61.40 [ 307 / 500 ]
exp/tri2a/decode/wer_12
%WER 21.25 [ 949 / 4466, 55 ins, 262 del, 632 sub ]
%SER 60.40 [ 302 / 500 ]
exp/tri2a/decode/wer_13
%WER 21.00 [ 938 / 4466, 49 ins, 282 del, 607 sub ]
%SER 60.60 [ 303 / 500 ]
exp/tri2a/decode/wer_14
%WER 20.85 [ 931 / 4466, 42 ins, 298 del, 591 sub ]
%SER 59.60 [ 298 / 500 ]
exp/tri2a/decode/wer_15
%WER 20.67 [ 923 / 4466, 37 ins, 321 del, 565 sub ]
%SER 58.60 [ 293 / 500 ]
exp/tri2a/decode/wer_16
%WER 20.98 [ 937 / 4466, 36 ins, 344 del, 557 sub ]
%SER 59.00 [ 295 / 500 ]
exp/tri2a/decode/wer_17
%WER 21.61 [ 965 / 4466, 34 ins, 373 del, 558 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri2a/decode/wer_7
%WER 26.31 [ 1175 / 4466, 136 ins, 178 del, 861 sub ]
%SER 71.40 [ 357 / 500 ]
exp/tri2a/decode/wer_8
%WER 24.47 [ 1093 / 4466, 113 ins, 182 del, 798 sub ]
%SER 68.00 [ 340 / 500 ]
exp/tri2a/decode/wer_9
%WER 22.84 [ 1020 / 4466, 95 ins, 198 del, 727 sub ]
%SER 64.00 [ 320 / 500 ]
steps/train_lda_mllt.sh --cmd run.pl --mem 2G 2000 11000 data/train data/lang exp/tri1_ali exp/tri2b
steps/train_lda_mllt.sh: Accumulating LDA statistics.
steps/train_lda_mllt.sh: Accumulating tree stats
steps/train_lda_mllt.sh: Getting questions for tree clustering.
steps/train_lda_mllt.sh: Building the tree
steps/train_lda_mllt.sh: Initializing the model
steps/train_lda_mllt.sh: Converting alignments from exp/tri1_ali to use current tree
steps/train_lda_mllt.sh: Compiling graphs of transcripts
Training pass 1
Training pass 2
steps/train_lda_mllt.sh: Estimating MLLT
Training pass 3
Training pass 4
steps/train_lda_mllt.sh: Estimating MLLT
Training pass 5
Training pass 6
steps/train_lda_mllt.sh: Estimating MLLT
Training pass 7
Training pass 8
Training pass 9
Training pass 10
Aligning data
Training pass 11
Training pass 12
steps/train_lda_mllt.sh: Estimating MLLT
Training pass 13
Training pass 14
Training pass 15
Training pass 16
Training pass 17
Training pass 18
Training pass 19
Training pass 20
Aligning data
Training pass 21
Training pass 22
Training pass 23
Training pass 24
Training pass 25
Training pass 26
Training pass 27
Training pass 28
Training pass 29
Training pass 30
Aligning data
Training pass 31
Training pass 32
Training pass 33
Training pass 34
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/tri2b
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri2b/log/analyze_alignments.log
5560 warnings in exp/tri2b/log/acc.*.*.log
100 warnings in exp/tri2b/log/lda_acc.*.log
4284 warnings in exp/tri2b/log/align.*.*.log
1 warnings in exp/tri2b/log/build_tree.log
exp/tri2b: nj=2 align prob=-43.01 over 81.07h [retry=1.9%, fail=0.3%] states=1664 gauss=11020 tree-impr=3.79 lda-sum=17.42 mllt:impr,logdet=0.99,1.45
steps/train_lda_mllt.sh: Done training system with LDA+MLLT features in exp/tri2b
tree-info exp/tri2b/tree
tree-info exp/tri2b/tree
make-h-transducer --disambig-syms-out=exp/tri2b/graph/disambig_tid.int --transition-scale=1.0 data/lang_test/tmp/ilabels_3_1 exp/tri2b/tree exp/tri2b/final.mdl
fstrmsymbols exp/tri2b/graph/disambig_tid.int
fstminimizeencoded
fstdeterminizestar --use-log=true
fstrmepslocal
fsttablecompose exp/tri2b/graph/Ha.fst data/lang_test/tmp/CLG_3_1.fst
fstisstochastic exp/tri2b/graph/HCLGa.fst
0.000486833 -0.0643712
HCLGa is not stochastic
add-self-loops --self-loop-scale=0.1 --reorder=true exp/tri2b/final.mdl
steps/decode.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b/decode
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri2b/graph exp/tri2b/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,3,35) and mean=13.2
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b/decode/log/analyze_lattice_depth_stats.log
exp/tri2b/decode/wer_10
%WER 23.15 [ 1034 / 4466, 88 ins, 247 del, 699 sub ]
%SER 64.20 [ 321 / 500 ]
exp/tri2b/decode/wer_11
%WER 22.26 [ 994 / 4466, 74 ins, 256 del, 664 sub ]
%SER 62.00 [ 310 / 500 ]
exp/tri2b/decode/wer_12
%WER 21.41 [ 956 / 4466, 65 ins, 266 del, 625 sub ]
%SER 60.60 [ 303 / 500 ]
exp/tri2b/decode/wer_13
%WER 20.69 [ 924 / 4466, 54 ins, 279 del, 591 sub ]
%SER 59.60 [ 298 / 500 ]
exp/tri2b/decode/wer_14
%WER 20.42 [ 912 / 4466, 50 ins, 300 del, 562 sub ]
%SER 59.20 [ 296 / 500 ]
exp/tri2b/decode/wer_15
%WER 20.33 [ 908 / 4466, 43 ins, 313 del, 552 sub ]
%SER 59.00 [ 295 / 500 ]
exp/tri2b/decode/wer_16
%WER 20.33 [ 908 / 4466, 38 ins, 323 del, 547 sub ]
%SER 58.40 [ 292 / 500 ]
exp/tri2b/decode/wer_17
%WER 20.58 [ 919 / 4466, 30 ins, 342 del, 547 sub ]
%SER 58.80 [ 294 / 500 ]
exp/tri2b/decode/wer_7
%WER 28.08 [ 1254 / 4466, 150 ins, 193 del, 911 sub ]
%SER 74.20 [ 371 / 500 ]
exp/tri2b/decode/wer_8
%WER 26.40 [ 1179 / 4466, 134 ins, 213 del, 832 sub ]
%SER 70.80 [ 354 / 500 ]
exp/tri2b/decode/wer_9
%WER 24.45 [ 1092 / 4466, 111 ins, 223 del, 758 sub ]
%SER 67.20 [ 336 / 500 ]
steps/align_si.sh --nj 2 --cmd run.pl --mem 2G --use-graphs true data/train data/lang exp/tri2b exp/tri2b_ali
steps/align_si.sh: feature type is lda
steps/align_si.sh: aligning data in data/train using model from exp/tri2b, putting alignments in exp/tri2b_ali
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/tri2b_ali
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri2b_ali/log/analyze_alignments.log
steps/align_si.sh: done aligning data.
steps/make_denlats.sh --nj 2 --cmd run.pl --mem 2G data/train data/lang exp/tri2b exp/tri2b_denlats
Making unigram grammar FST in exp/tri2b_denlats/lang
Compiling decoding graph in exp/tri2b_denlats/dengraph
tree-info exp/tri2b/tree
tree-info exp/tri2b/tree
fsttablecompose exp/tri2b_denlats/lang/L_disambig.fst exp/tri2b_denlats/lang/G.fst
fstminimizeencoded
fstdeterminizestar --use-log=true
fstpushspecial
fstisstochastic exp/tri2b_denlats/lang/tmp/LG.fst
0.000250081 -0.000227189
fstcomposecontext --context-size=3 --central-position=1 --read-disambig-syms=exp/tri2b_denlats/lang/phones/disambig.int --write-disambig-syms=exp/tri2b_denlats/lang/tmp/disambig_ilabels_3_1.int exp/tri2b_denlats/lang/tmp/ilabels_3_1.10795
fstisstochastic exp/tri2b_denlats/lang/tmp/CLG_3_1.fst
0.000250081 -0.000227189
make-h-transducer --disambig-syms-out=exp/tri2b_denlats/dengraph/disambig_tid.int --transition-scale=1.0 exp/tri2b_denlats/lang/tmp/ilabels_3_1 exp/tri2b/tree exp/tri2b/final.mdl
fstrmsymbols exp/tri2b_denlats/dengraph/disambig_tid.int
fstdeterminizestar --use-log=true
fstrmepslocal
fsttablecompose exp/tri2b_denlats/dengraph/Ha.fst exp/tri2b_denlats/lang/tmp/CLG_3_1.fst
fstminimizeencoded
fstisstochastic exp/tri2b_denlats/dengraph/HCLGa.fst
0.000496389 -0.000487354
add-self-loops --self-loop-scale=0.1 --reorder=true exp/tri2b/final.mdl
steps/make_denlats.sh: feature type is lda
steps/make_denlats.sh: done generating denominator lattices.
steps/train_mmi.sh data/train data/lang exp/tri2b_ali exp/tri2b_denlats exp/tri2b_mmi
steps/train_mmi.sh: feature type is lda
Iteration 0 of MMI training
Iteration 0: objf was 0.166222516286286, MMI auxf change was 0.00539634790810164
Iteration 1 of MMI training
Iteration 1: objf was 0.1745438878009, MMI auxf change was 0.00280861109639111
Iteration 2 of MMI training
Iteration 2: objf was 0.179429386207834, MMI auxf change was 0.00223177570490428
Iteration 3 of MMI training
Iteration 3: objf was 0.183123759706909, MMI auxf change was 0.00180800400040051
MMI training finished
steps/decode.sh --config conf/decode.config --iter 4 --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b_mmi/decode_it4
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G --iter 4 exp/tri2b/graph exp/tri2b_mmi/decode_it4
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi/decode_it4/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,35) and mean=16.9
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi/decode_it4/log/analyze_lattice_depth_stats.log
exp/tri2b_mmi/decode_it4/wer_10
%WER 16.35 [ 730 / 4466, 36 ins, 218 del, 476 sub ]
%SER 50.40 [ 252 / 500 ]
exp/tri2b_mmi/decode_it4/wer_11
%WER 15.63 [ 698 / 4466, 28 ins, 228 del, 442 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri2b_mmi/decode_it4/wer_12
%WER 15.70 [ 701 / 4466, 27 ins, 241 del, 433 sub ]
%SER 49.00 [ 245 / 500 ]
exp/tri2b_mmi/decode_it4/wer_13
%WER 15.67 [ 700 / 4466, 25 ins, 250 del, 425 sub ]
%SER 49.40 [ 247 / 500 ]
exp/tri2b_mmi/decode_it4/wer_14
%WER 15.79 [ 705 / 4466, 24 ins, 268 del, 413 sub ]
%SER 50.00 [ 250 / 500 ]
exp/tri2b_mmi/decode_it4/wer_15
%WER 16.44 [ 734 / 4466, 21 ins, 297 del, 416 sub ]
%SER 50.40 [ 252 / 500 ]
exp/tri2b_mmi/decode_it4/wer_16
%WER 16.70 [ 746 / 4466, 19 ins, 315 del, 412 sub ]
%SER 50.20 [ 251 / 500 ]
exp/tri2b_mmi/decode_it4/wer_17
%WER 17.20 [ 768 / 4466, 18 ins, 343 del, 407 sub ]
%SER 50.20 [ 251 / 500 ]
exp/tri2b_mmi/decode_it4/wer_7
%WER 17.91 [ 800 / 4466, 69 ins, 153 del, 578 sub ]
%SER 54.80 [ 274 / 500 ]
exp/tri2b_mmi/decode_it4/wer_8
%WER 17.11 [ 764 / 4466, 60 ins, 181 del, 523 sub ]
%SER 52.40 [ 262 / 500 ]
exp/tri2b_mmi/decode_it4/wer_9
%WER 16.46 [ 735 / 4466, 46 ins, 197 del, 492 sub ]
%SER 51.00 [ 255 / 500 ]
steps/decode.sh --config conf/decode.config --iter 3 --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b_mmi/decode_it3
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G --iter 3 exp/tri2b/graph exp/tri2b_mmi/decode_it3
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi/decode_it3/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,33) and mean=14.6
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi/decode_it3/log/analyze_lattice_depth_stats.log
exp/tri2b_mmi/decode_it3/wer_10
%WER 16.82 [ 751 / 4466, 40 ins, 228 del, 483 sub ]
%SER 51.40 [ 257 / 500 ]
exp/tri2b_mmi/decode_it3/wer_11
%WER 16.46 [ 735 / 4466, 33 ins, 241 del, 461 sub ]
%SER 51.00 [ 255 / 500 ]
exp/tri2b_mmi/decode_it3/wer_12
%WER 16.77 [ 749 / 4466, 27 ins, 256 del, 466 sub ]
%SER 51.00 [ 255 / 500 ]
exp/tri2b_mmi/decode_it3/wer_13
%WER 16.55 [ 739 / 4466, 25 ins, 267 del, 447 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri2b_mmi/decode_it3/wer_14
%WER 16.57 [ 740 / 4466, 25 ins, 285 del, 430 sub ]
%SER 49.60 [ 248 / 500 ]
exp/tri2b_mmi/decode_it3/wer_15
%WER 16.86 [ 753 / 4466, 22 ins, 305 del, 426 sub ]
%SER 50.20 [ 251 / 500 ]
exp/tri2b_mmi/decode_it3/wer_16
%WER 17.00 [ 759 / 4466, 19 ins, 322 del, 418 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri2b_mmi/decode_it3/wer_17
%WER 17.24 [ 770 / 4466, 18 ins, 339 del, 413 sub ]
%SER 50.40 [ 252 / 500 ]
exp/tri2b_mmi/decode_it3/wer_7
%WER 19.44 [ 868 / 4466, 78 ins, 176 del, 614 sub ]
%SER 57.20 [ 286 / 500 ]
exp/tri2b_mmi/decode_it3/wer_8
%WER 17.62 [ 787 / 4466, 58 ins, 188 del, 541 sub ]
%SER 53.20 [ 266 / 500 ]
exp/tri2b_mmi/decode_it3/wer_9
%WER 17.11 [ 764 / 4466, 45 ins, 202 del, 517 sub ]
%SER 52.40 [ 262 / 500 ]
steps/train_mmi.sh --boost 0.05 data/train data/lang exp/tri2b_ali exp/tri2b_denlats exp/tri2b_mmi_b0.05
steps/train_mmi.sh: feature type is lda
Iteration 0 of MMI training
Iteration 0: objf was 0.159035111240136, MMI auxf change was 0.00585272323297746
Iteration 1 of MMI training
Iteration 1: objf was 0.168067163429439, MMI auxf change was 0.00305293272100094
Iteration 2 of MMI training
Iteration 2: objf was 0.173349491283989, MMI auxf change was 0.00239270427026243
Iteration 3 of MMI training
Iteration 3: objf was 0.177307574622288, MMI auxf change was 0.00190137202734744
MMI training finished
steps/decode.sh --config conf/decode.config --iter 4 --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b_mmi_b0.05/decode_it4
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G --iter 4 exp/tri2b/graph exp/tri2b_mmi_b0.05/decode_it4
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi_b0.05/decode_it4/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,33) and mean=15.5
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi_b0.05/decode_it4/log/analyze_lattice_depth_stats.log
exp/tri2b_mmi_b0.05/decode_it4/wer_10
%WER 16.41 [ 733 / 4466, 36 ins, 215 del, 482 sub ]
%SER 50.60 [ 253 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_11
%WER 15.85 [ 708 / 4466, 32 ins, 226 del, 450 sub ]
%SER 49.20 [ 246 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_12
%WER 15.74 [ 703 / 4466, 27 ins, 238 del, 438 sub ]
%SER 49.40 [ 247 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_13
%WER 15.74 [ 703 / 4466, 23 ins, 253 del, 427 sub ]
%SER 49.00 [ 245 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_14
%WER 15.81 [ 706 / 4466, 22 ins, 272 del, 412 sub ]
%SER 48.80 [ 244 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_15
%WER 16.28 [ 727 / 4466, 20 ins, 298 del, 409 sub ]
%SER 50.00 [ 250 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_16
%WER 16.68 [ 745 / 4466, 21 ins, 320 del, 404 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_17
%WER 17.11 [ 764 / 4466, 19 ins, 339 del, 406 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_7
%WER 18.45 [ 824 / 4466, 71 ins, 164 del, 589 sub ]
%SER 55.40 [ 277 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_8
%WER 17.11 [ 764 / 4466, 57 ins, 184 del, 523 sub ]
%SER 53.40 [ 267 / 500 ]
exp/tri2b_mmi_b0.05/decode_it4/wer_9
%WER 16.59 [ 741 / 4466, 44 ins, 203 del, 494 sub ]
%SER 51.60 [ 258 / 500 ]
steps/decode.sh --config conf/decode.config --iter 3 --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b_mmi_b0.05/decode_it3
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G --iter 3 exp/tri2b/graph exp/tri2b_mmi_b0.05/decode_it3
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi_b0.05/decode_it3/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,32) and mean=14.2
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mmi_b0.05/decode_it3/log/analyze_lattice_depth_stats.log
exp/tri2b_mmi_b0.05/decode_it3/wer_10
%WER 16.86 [ 753 / 4466, 37 ins, 225 del, 491 sub ]
%SER 52.00 [ 260 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_11
%WER 16.79 [ 750 / 4466, 33 ins, 246 del, 471 sub ]
%SER 51.40 [ 257 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_12
%WER 16.66 [ 744 / 4466, 30 ins, 259 del, 455 sub ]
%SER 51.00 [ 255 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_13
%WER 16.75 [ 748 / 4466, 27 ins, 276 del, 445 sub ]
%SER 50.00 [ 250 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_14
%WER 16.61 [ 742 / 4466, 25 ins, 295 del, 422 sub ]
%SER 50.00 [ 250 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_15
%WER 17.02 [ 760 / 4466, 23 ins, 317 del, 420 sub ]
%SER 50.00 [ 250 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_16
%WER 17.08 [ 763 / 4466, 19 ins, 330 del, 414 sub ]
%SER 49.40 [ 247 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_17
%WER 17.42 [ 778 / 4466, 14 ins, 343 del, 421 sub ]
%SER 49.60 [ 248 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_7
%WER 19.37 [ 865 / 4466, 75 ins, 171 del, 619 sub ]
%SER 58.00 [ 290 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_8
%WER 18.03 [ 805 / 4466, 58 ins, 189 del, 558 sub ]
%SER 54.00 [ 270 / 500 ]
exp/tri2b_mmi_b0.05/decode_it3/wer_9
%WER 17.08 [ 763 / 4466, 49 ins, 210 del, 504 sub ]
%SER 52.40 [ 262 / 500 ]
steps/train_mpe.sh data/train data/lang exp/tri2b_ali exp/tri2b_denlats exp/tri2b_mpe
steps/train_mpe.sh: feature type is lda
Iteration 0 of MPE training
Iteration 0: objf was 0.864675666212221, MPE auxf change was 0.0201978892272489
Iteration 1 of MPE training
Iteration 1: objf was 0.889005951132288, MPE auxf change was 0.0102546149603845
Iteration 2 of MPE training
Iteration 2: objf was 0.903431413046233, MPE auxf change was 0.00714264672131428
Iteration 3 of MPE training
Iteration 3: objf was 0.913044970917785, MPE auxf change was 0.0055343214663739
MPE training finished
steps/decode.sh --config conf/decode.config --iter 4 --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b_mpe/decode_it4
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G --iter 4 exp/tri2b/graph exp/tri2b_mpe/decode_it4
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mpe/decode_it4/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,25) and mean=10.3
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mpe/decode_it4/log/analyze_lattice_depth_stats.log
exp/tri2b_mpe/decode_it4/wer_10
%WER 18.16 [ 811 / 4466, 50 ins, 227 del, 534 sub ]
%SER 55.80 [ 279 / 500 ]
exp/tri2b_mpe/decode_it4/wer_11
%WER 18.00 [ 804 / 4466, 45 ins, 245 del, 514 sub ]
%SER 54.80 [ 274 / 500 ]
exp/tri2b_mpe/decode_it4/wer_12
%WER 17.20 [ 768 / 4466, 34 ins, 249 del, 485 sub ]
%SER 52.80 [ 264 / 500 ]
exp/tri2b_mpe/decode_it4/wer_13
%WER 17.13 [ 765 / 4466, 30 ins, 272 del, 463 sub ]
%SER 52.40 [ 262 / 500 ]
exp/tri2b_mpe/decode_it4/wer_14
%WER 17.22 [ 769 / 4466, 27 ins, 300 del, 442 sub ]
%SER 53.20 [ 266 / 500 ]
exp/tri2b_mpe/decode_it4/wer_15
%WER 17.38 [ 776 / 4466, 25 ins, 315 del, 436 sub ]
%SER 52.60 [ 263 / 500 ]
exp/tri2b_mpe/decode_it4/wer_16
%WER 17.26 [ 771 / 4466, 24 ins, 329 del, 418 sub ]
%SER 52.00 [ 260 / 500 ]
exp/tri2b_mpe/decode_it4/wer_17
%WER 17.53 [ 783 / 4466, 19 ins, 345 del, 419 sub ]
%SER 52.00 [ 260 / 500 ]
exp/tri2b_mpe/decode_it4/wer_7
%WER 21.88 [ 977 / 4466, 98 ins, 177 del, 702 sub ]
%SER 64.00 [ 320 / 500 ]
exp/tri2b_mpe/decode_it4/wer_8
%WER 20.35 [ 909 / 4466, 84 ins, 179 del, 646 sub ]
%SER 60.80 [ 304 / 500 ]
exp/tri2b_mpe/decode_it4/wer_9
%WER 18.99 [ 848 / 4466, 62 ins, 195 del, 591 sub ]
%SER 58.00 [ 290 / 500 ]
steps/decode.sh --config conf/decode.config --iter 3 --nj 2 --cmd run.pl --mem 4G exp/tri2b/graph data/test exp/tri2b_mpe/decode_it3
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G --iter 3 exp/tri2b/graph exp/tri2b_mpe/decode_it3
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mpe/decode_it3/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,24) and mean=10.3
steps/diagnostic/analyze_lats.sh: see stats in exp/tri2b_mpe/decode_it3/log/analyze_lattice_depth_stats.log
exp/tri2b_mpe/decode_it3/wer_10
%WER 17.80 [ 795 / 4466, 40 ins, 213 del, 542 sub ]
%SER 54.20 [ 271 / 500 ]
exp/tri2b_mpe/decode_it3/wer_11
%WER 17.24 [ 770 / 4466, 31 ins, 227 del, 512 sub ]
%SER 53.40 [ 267 / 500 ]
exp/tri2b_mpe/decode_it3/wer_12
%WER 17.06 [ 762 / 4466, 27 ins, 234 del, 501 sub ]
%SER 52.60 [ 263 / 500 ]
exp/tri2b_mpe/decode_it3/wer_13
%WER 16.75 [ 748 / 4466, 23 ins, 247 del, 478 sub ]
%SER 53.00 [ 265 / 500 ]
exp/tri2b_mpe/decode_it3/wer_14
%WER 17.00 [ 759 / 4466, 23 ins, 263 del, 473 sub ]
%SER 52.60 [ 263 / 500 ]
exp/tri2b_mpe/decode_it3/wer_15
%WER 16.91 [ 755 / 4466, 20 ins, 275 del, 460 sub ]
%SER 52.00 [ 260 / 500 ]
exp/tri2b_mpe/decode_it3/wer_16
%WER 16.95 [ 757 / 4466, 19 ins, 292 del, 446 sub ]
%SER 51.20 [ 256 / 500 ]
exp/tri2b_mpe/decode_it3/wer_17
%WER 17.13 [ 765 / 4466, 16 ins, 303 del, 446 sub ]
%SER 51.80 [ 259 / 500 ]
exp/tri2b_mpe/decode_it3/wer_7
%WER 22.21 [ 992 / 4466, 93 ins, 168 del, 731 sub ]
%SER 64.60 [ 323 / 500 ]
exp/tri2b_mpe/decode_it3/wer_8
%WER 19.86 [ 887 / 4466, 61 ins, 179 del, 647 sub ]
%SER 60.40 [ 302 / 500 ]
exp/tri2b_mpe/decode_it3/wer_9
%WER 19.03 [ 850 / 4466, 51 ins, 194 del, 605 sub ]
%SER 57.40 [ 287 / 500 ]
steps/train_sat.sh 2000 11000 data/train data/lang exp/tri2b_ali exp/tri3b
steps/train_sat.sh: feature type is lda
steps/train_sat.sh: obtaining initial fMLLR transforms since not present in exp/tri2b_ali
steps/train_sat.sh: Accumulating tree stats
steps/train_sat.sh: Getting questions for tree clustering.
steps/train_sat.sh: Building the tree
steps/train_sat.sh: Initializing the model
steps/train_sat.sh: Converting alignments from exp/tri2b_ali to use current tree
steps/train_sat.sh: Compiling graphs of transcripts
Pass 1
Pass 2
Estimating fMLLR transforms
Pass 3
Pass 4
Estimating fMLLR transforms
Pass 5
Pass 6
Estimating fMLLR transforms
Pass 7
Pass 8
Pass 9
Pass 10
Aligning data
Pass 11
Pass 12
Estimating fMLLR transforms
Pass 13
Pass 14
Pass 15
Pass 16
Pass 17
Pass 18
Pass 19
Pass 20
Aligning data
Pass 21
Pass 22
Pass 23
Pass 24
Pass 25
Pass 26
Pass 27
Pass 28
Pass 29
Pass 30
Aligning data
Pass 31
Pass 32
Pass 33
Pass 34
steps/diagnostic/analyze_alignments.sh --cmd run.pl data/lang exp/tri3b
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri3b/log/analyze_alignments.log
2608 warnings in exp/tri3b/log/align.*.*.log
1 warnings in exp/tri3b/log/build_tree.log
645 warnings in exp/tri3b/log/fmllr.*.*.log
3621 warnings in exp/tri3b/log/acc.*.*.log
steps/train_sat.sh: Likelihood evolution:
-43.8143 -43.9506 -43.7709 -43.4475 -42.6764 -42.1978 -41.9285 -41.7131 -41.54 -40.9717 -40.7908 -40.5139 -40.4036 -40.3333 -40.262 -40.1876 -40.1194 -40.059 -40.0037 -39.8626 -39.7879 -39.7417 -39.6991 -39.6595 -39.6222 -39.5869 -39.5529 -39.5197 -39.4883 -39.4076 -39.3606 -39.3391 -39.3255 -39.316
exp/tri3b: nj=2 align prob=-43.54 over 81.19h [retry=1.2%, fail=0.2%] states=1688 gauss=11014 fmllr-impr=3.90 over 49.94h tree-impr=5.48
steps/train_sat.sh: done training SAT system in exp/tri3b
tree-info exp/tri3b/tree
tree-info exp/tri3b/tree
make-h-transducer --disambig-syms-out=exp/tri3b/graph/disambig_tid.int --transition-scale=1.0 data/lang_test/tmp/ilabels_3_1 exp/tri3b/tree exp/tri3b/final.mdl
fstrmepslocal
fstrmsymbols exp/tri3b/graph/disambig_tid.int
fstminimizeencoded
fstdeterminizestar --use-log=true
fsttablecompose exp/tri3b/graph/Ha.fst data/lang_test/tmp/CLG_3_1.fst
fstisstochastic exp/tri3b/graph/HCLGa.fst
0.000480074 -0.0645502
HCLGa is not stochastic
add-self-loops --self-loop-scale=0.1 --reorder=true exp/tri3b/final.mdl
steps/decode_fmllr.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G exp/tri3b/graph data/test exp/tri3b/decode
steps/decode.sh --scoring-opts  --num-threads 1 --skip-scoring false --acwt 0.083333 --nj 2 --cmd run.pl --mem 4G --beam 10.0 --model exp/tri3b/final.alimdl --max-active 2000 exp/tri3b/graph data/test exp/tri3b/decode.si
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri3b/graph exp/tri3b/decode.si
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b/decode.si/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,3,26) and mean=11.0
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b/decode.si/log/analyze_lattice_depth_stats.log
exp/tri3b/decode.si/wer_10
%WER 23.82 [ 1064 / 4466, 74 ins, 270 del, 720 sub ]
%SER 65.60 [ 328 / 500 ]
exp/tri3b/decode.si/wer_11
%WER 23.15 [ 1034 / 4466, 62 ins, 280 del, 692 sub ]
%SER 64.40 [ 322 / 500 ]
exp/tri3b/decode.si/wer_12
%WER 22.41 [ 1001 / 4466, 55 ins, 288 del, 658 sub ]
%SER 62.40 [ 312 / 500 ]
exp/tri3b/decode.si/wer_13
%WER 22.01 [ 983 / 4466, 50 ins, 303 del, 630 sub ]
%SER 61.00 [ 305 / 500 ]
exp/tri3b/decode.si/wer_14
%WER 21.74 [ 971 / 4466, 43 ins, 322 del, 606 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri3b/decode.si/wer_15
%WER 21.97 [ 981 / 4466, 42 ins, 337 del, 602 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri3b/decode.si/wer_16
%WER 22.08 [ 986 / 4466, 42 ins, 350 del, 594 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri3b/decode.si/wer_17
%WER 22.21 [ 992 / 4466, 40 ins, 361 del, 591 sub ]
%SER 60.40 [ 302 / 500 ]
exp/tri3b/decode.si/wer_7
%WER 27.70 [ 1237 / 4466, 134 ins, 232 del, 871 sub ]
%SER 73.00 [ 365 / 500 ]
exp/tri3b/decode.si/wer_8
%WER 26.13 [ 1167 / 4466, 112 ins, 240 del, 815 sub ]
%SER 70.00 [ 350 / 500 ]
exp/tri3b/decode.si/wer_9
%WER 24.99 [ 1116 / 4466, 91 ins, 258 del, 767 sub ]
%SER 68.20 [ 341 / 500 ]
steps/decode_fmllr.sh: feature type is lda
steps/decode_fmllr.sh: getting first-pass fMLLR transforms.
steps/decode_fmllr.sh: doing main lattice generation phase
steps/decode_fmllr.sh: estimating fMLLR transforms a second time.
steps/decode_fmllr.sh: doing a final pass of acoustic rescoring.
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri3b/graph exp/tri3b/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,2,10) and mean=4.4
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b/decode/log/analyze_lattice_depth_stats.log
exp/tri3b/decode/wer_10
%WER 15.36 [ 686 / 4466, 84 ins, 129 del, 473 sub ]
%SER 51.20 [ 256 / 500 ]
exp/tri3b/decode/wer_11
%WER 14.58 [ 651 / 4466, 75 ins, 128 del, 448 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri3b/decode/wer_12
%WER 14.35 [ 641 / 4466, 67 ins, 136 del, 438 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri3b/decode/wer_13
%WER 13.93 [ 622 / 4466, 60 ins, 138 del, 424 sub ]
%SER 49.20 [ 246 / 500 ]
exp/tri3b/decode/wer_14
%WER 13.66 [ 610 / 4466, 56 ins, 145 del, 409 sub ]
%SER 48.80 [ 244 / 500 ]
exp/tri3b/decode/wer_15
%WER 13.35 [ 596 / 4466, 53 ins, 153 del, 390 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b/decode/wer_16
%WER 13.43 [ 600 / 4466, 50 ins, 164 del, 386 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri3b/decode/wer_17
%WER 13.35 [ 596 / 4466, 49 ins, 171 del, 376 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b/decode/wer_7
%WER 18.38 [ 821 / 4466, 132 ins, 115 del, 574 sub ]
%SER 60.40 [ 302 / 500 ]
exp/tri3b/decode/wer_8
%WER 17.08 [ 763 / 4466, 112 ins, 118 del, 533 sub ]
%SER 57.00 [ 285 / 500 ]
exp/tri3b/decode/wer_9
%WER 16.10 [ 719 / 4466, 95 ins, 125 del, 499 sub ]
%SER 53.80 [ 269 / 500 ]
steps/align_fmllr.sh --nj 2 --cmd run.pl --mem 2G --use-graphs true data/train data/lang exp/tri3b exp/tri3b_ali
steps/align_fmllr.sh: feature type is lda
steps/align_fmllr.sh: aligning data in data/train using exp/tri3b/final.alimdl and speaker-independent features.
steps/align_fmllr.sh: computing fMLLR transforms
steps/align_fmllr.sh: doing final alignment.
steps/align_fmllr.sh: done aligning data.
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/tri3b_ali
steps/diagnostic/analyze_alignments.sh: see stats in exp/tri3b_ali/log/analyze_alignments.log
1333 warnings in exp/tri3b_ali/log/align_pass1.*.log
895 warnings in exp/tri3b_ali/log/align_pass2.*.log
169 warnings in exp/tri3b_ali/log/fmllr.*.log
steps/make_denlats.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 2G --transform-dir exp/tri3b_ali data/train data/lang exp/tri3b exp/tri3b_denlats
Making unigram grammar FST in exp/tri3b_denlats/lang
Compiling decoding graph in exp/tri3b_denlats/dengraph
tree-info exp/tri3b/tree
tree-info exp/tri3b/tree
fstminimizeencoded
fsttablecompose exp/tri3b_denlats/lang/L_disambig.fst exp/tri3b_denlats/lang/G.fst
fstdeterminizestar --use-log=true
fstpushspecial
fstisstochastic exp/tri3b_denlats/lang/tmp/LG.fst
0.000250081 -0.000227189
fstcomposecontext --context-size=3 --central-position=1 --read-disambig-syms=exp/tri3b_denlats/lang/phones/disambig.int --write-disambig-syms=exp/tri3b_denlats/lang/tmp/disambig_ilabels_3_1.int exp/tri3b_denlats/lang/tmp/ilabels_3_1.97550
fstisstochastic exp/tri3b_denlats/lang/tmp/CLG_3_1.fst
0.000250081 -0.000227189
make-h-transducer --disambig-syms-out=exp/tri3b_denlats/dengraph/disambig_tid.int --transition-scale=1.0 exp/tri3b_denlats/lang/tmp/ilabels_3_1 exp/tri3b/tree exp/tri3b/final.mdl
fstrmsymbols exp/tri3b_denlats/dengraph/disambig_tid.int
fstdeterminizestar --use-log=true
fsttablecompose exp/tri3b_denlats/dengraph/Ha.fst exp/tri3b_denlats/lang/tmp/CLG_3_1.fst
fstrmepslocal
fstminimizeencoded
fstisstochastic exp/tri3b_denlats/dengraph/HCLGa.fst
0.000496081 -0.000485934
add-self-loops --self-loop-scale=0.1 --reorder=true exp/tri3b/final.mdl
steps/make_denlats.sh: feature type is lda
steps/make_denlats.sh: using fMLLR transforms from exp/tri3b_ali
steps/make_denlats.sh: done generating denominator lattices.
steps/train_mmi.sh data/train data/lang exp/tri3b_ali exp/tri3b_denlats exp/tri3b_mmi
steps/train_mmi.sh: feature type is lda
Using transforms from exp/tri3b_ali
Iteration 0 of MMI training
Iteration 0: objf was 0.172059856273767, MMI auxf change was 0.00497048298586112
Iteration 1 of MMI training
Iteration 1: objf was 0.17929388714513, MMI auxf change was 0.00234963587163919
Iteration 2 of MMI training
Iteration 2: objf was 0.183507514293073, MMI auxf change was 0.00173311659348108
Iteration 3 of MMI training
Iteration 3: objf was 0.186758549663492, MMI auxf change was 0.00148638632330132
MMI training finished
steps/decode_fmllr.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G --alignment-model exp/tri3b/final.alimdl --adapt-model exp/tri3b/final.mdl exp/tri3b/graph data/test exp/tri3b_mmi/decode
steps/decode.sh --scoring-opts  --num-threads 1 --skip-scoring false --acwt 0.083333 --nj 2 --cmd run.pl --mem 4G --beam 10.0 --model exp/tri3b/final.alimdl --max-active 2000 exp/tri3b/graph data/test exp/tri3b_mmi/decode.si
decode.sh: feature type is lda
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri3b/graph exp/tri3b_mmi/decode.si
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b_mmi/decode.si/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,3,26) and mean=11.0
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b_mmi/decode.si/log/analyze_lattice_depth_stats.log
exp/tri3b_mmi/decode.si/wer_10
%WER 23.82 [ 1064 / 4466, 74 ins, 270 del, 720 sub ]
%SER 65.60 [ 328 / 500 ]
exp/tri3b_mmi/decode.si/wer_11
%WER 23.15 [ 1034 / 4466, 62 ins, 280 del, 692 sub ]
%SER 64.40 [ 322 / 500 ]
exp/tri3b_mmi/decode.si/wer_12
%WER 22.41 [ 1001 / 4466, 55 ins, 288 del, 658 sub ]
%SER 62.40 [ 312 / 500 ]
exp/tri3b_mmi/decode.si/wer_13
%WER 22.01 [ 983 / 4466, 50 ins, 303 del, 630 sub ]
%SER 61.00 [ 305 / 500 ]
exp/tri3b_mmi/decode.si/wer_14
%WER 21.74 [ 971 / 4466, 43 ins, 322 del, 606 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri3b_mmi/decode.si/wer_15
%WER 21.97 [ 981 / 4466, 42 ins, 337 del, 602 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri3b_mmi/decode.si/wer_16
%WER 22.08 [ 986 / 4466, 42 ins, 350 del, 594 sub ]
%SER 60.00 [ 300 / 500 ]
exp/tri3b_mmi/decode.si/wer_17
%WER 22.21 [ 992 / 4466, 40 ins, 361 del, 591 sub ]
%SER 60.40 [ 302 / 500 ]
exp/tri3b_mmi/decode.si/wer_7
%WER 27.70 [ 1237 / 4466, 134 ins, 232 del, 871 sub ]
%SER 73.00 [ 365 / 500 ]
exp/tri3b_mmi/decode.si/wer_8
%WER 26.13 [ 1167 / 4466, 112 ins, 240 del, 815 sub ]
%SER 70.00 [ 350 / 500 ]
exp/tri3b_mmi/decode.si/wer_9
%WER 24.99 [ 1116 / 4466, 91 ins, 258 del, 767 sub ]
%SER 68.20 [ 341 / 500 ]
steps/decode_fmllr.sh: feature type is lda
steps/decode_fmllr.sh: getting first-pass fMLLR transforms.
steps/decode_fmllr.sh: doing main lattice generation phase
steps/decode_fmllr.sh: estimating fMLLR transforms a second time.
steps/decode_fmllr.sh: doing a final pass of acoustic rescoring.
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri3b/graph exp/tri3b_mmi/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b_mmi/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,1,6) and mean=3.1
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b_mmi/decode/log/analyze_lattice_depth_stats.log
exp/tri3b_mmi/decode/wer_10
%WER 11.82 [ 528 / 4466, 59 ins, 106 del, 363 sub ]
%SER 43.00 [ 215 / 500 ]
exp/tri3b_mmi/decode/wer_11
%WER 11.31 [ 505 / 4466, 55 ins, 109 del, 341 sub ]
%SER 41.60 [ 208 / 500 ]
exp/tri3b_mmi/decode/wer_12
%WER 11.35 [ 507 / 4466, 54 ins, 116 del, 337 sub ]
%SER 41.40 [ 207 / 500 ]
exp/tri3b_mmi/decode/wer_13
%WER 11.22 [ 501 / 4466, 52 ins, 123 del, 326 sub ]
%SER 41.00 [ 205 / 500 ]
exp/tri3b_mmi/decode/wer_14
%WER 11.40 [ 509 / 4466, 49 ins, 131 del, 329 sub ]
%SER 41.60 [ 208 / 500 ]
exp/tri3b_mmi/decode/wer_15
%WER 11.51 [ 514 / 4466, 46 ins, 134 del, 334 sub ]
%SER 41.60 [ 208 / 500 ]
exp/tri3b_mmi/decode/wer_16
%WER 11.69 [ 522 / 4466, 45 ins, 143 del, 334 sub ]
%SER 41.60 [ 208 / 500 ]
exp/tri3b_mmi/decode/wer_17
%WER 11.82 [ 528 / 4466, 42 ins, 154 del, 332 sub ]
%SER 42.20 [ 211 / 500 ]
exp/tri3b_mmi/decode/wer_7
%WER 13.23 [ 591 / 4466, 82 ins, 95 del, 414 sub ]
%SER 47.40 [ 237 / 500 ]
exp/tri3b_mmi/decode/wer_8
%WER 12.45 [ 556 / 4466, 72 ins, 97 del, 387 sub ]
%SER 45.60 [ 228 / 500 ]
exp/tri3b_mmi/decode/wer_9
%WER 12.05 [ 538 / 4466, 66 ins, 97 del, 375 sub ]
%SER 44.60 [ 223 / 500 ]
steps/decode.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_mmi/decode2
decode.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/tri3b/graph exp/tri3b_mmi/decode2
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b_mmi/decode2/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,1,11) and mean=6.5
steps/diagnostic/analyze_lats.sh: see stats in exp/tri3b_mmi/decode2/log/analyze_lattice_depth_stats.log
exp/tri3b_mmi/decode2/wer_10
%WER 10.95 [ 489 / 4466, 47 ins, 106 del, 336 sub ]
%SER 40.40 [ 202 / 500 ]
exp/tri3b_mmi/decode2/wer_11
%WER 10.55 [ 471 / 4466, 42 ins, 112 del, 317 sub ]
%SER 39.00 [ 195 / 500 ]
exp/tri3b_mmi/decode2/wer_12
%WER 10.32 [ 461 / 4466, 39 ins, 120 del, 302 sub ]
%SER 38.40 [ 192 / 500 ]
exp/tri3b_mmi/decode2/wer_13
%WER 9.87 [ 441 / 4466, 36 ins, 127 del, 278 sub ]
%SER 37.20 [ 186 / 500 ]
exp/tri3b_mmi/decode2/wer_14
%WER 10.03 [ 448 / 4466, 34 ins, 138 del, 276 sub ]
%SER 37.20 [ 186 / 500 ]
exp/tri3b_mmi/decode2/wer_15
%WER 10.21 [ 456 / 4466, 32 ins, 144 del, 280 sub ]
%SER 37.00 [ 185 / 500 ]
exp/tri3b_mmi/decode2/wer_16
%WER 10.37 [ 463 / 4466, 32 ins, 149 del, 282 sub ]
%SER 37.40 [ 187 / 500 ]
exp/tri3b_mmi/decode2/wer_17
%WER 10.50 [ 469 / 4466, 31 ins, 159 del, 279 sub ]
%SER 37.80 [ 189 / 500 ]
exp/tri3b_mmi/decode2/wer_7
%WER 12.38 [ 553 / 4466, 74 ins, 90 del, 389 sub ]
%SER 46.20 [ 231 / 500 ]
exp/tri3b_mmi/decode2/wer_8
%WER 11.71 [ 523 / 4466, 65 ins, 95 del, 363 sub ]
%SER 43.60 [ 218 / 500 ]
exp/tri3b_mmi/decode2/wer_9
%WER 11.17 [ 499 / 4466, 56 ins, 97 del, 346 sub ]
%SER 42.20 [ 211 / 500 ]
steps/train_diag_ubm.sh --silence-weight 0.5 --nj 2 --cmd run.pl --mem 2G 250 data/train data/lang exp/tri3b_ali exp/dubm3b
steps/train_diag_ubm.sh: feature type is lda
Using transforms from exp/tri3b_ali
Clustering Gaussians in exp/tri3b_ali/final.mdl
Getting Gaussian-selection info
Training pass 0
Training pass 1
Training pass 2
steps/train_mmi_fmmi.sh --learning-rate 0.0025 --boost 0.1 --cmd run.pl --mem 2G data/train data/lang exp/tri3b_ali exp/dubm3b exp/tri3b_denlats exp/tri3b_fmmi_b
steps/train_mmi_fmmi.sh: feature type is lda
Using transforms from exp/tri3b_ali
Iteration 0: doing fMMI
On iter 0, objf was -0.219628, auxf improvement from fMMI was 0.0122453132426176
Iteration 1: doing fMMI
On iter 1, objf was -0.206246, auxf improvement from fMMI was 0.00893526393524836
Iteration 2: doing fMMI
On iter 2, objf was -0.196411, auxf improvement from fMMI was 0.00750526156041259
Iteration 3: doing fMMI
On iter 3, objf was -0.187997, auxf improvement from fMMI was 0.00680643609591516
Iteration 4: doing MMI (getting stats)...
On iter 4, objf was -0.180448, auxf improvement was 0.0460783868343515
Iteration 5: doing MMI (getting stats)...
On iter 5, objf was -0.107277, auxf improvement was 0.02558728914774
Iteration 6: doing MMI (getting stats)...
On iter 6, objf was -0.0675779, auxf improvement was 0.0196356843773773
Iteration 7: doing MMI (getting stats)...
On iter 7, objf was -0.0396216, auxf improvement was 0.0171256229921349
Succeeded with        8 iters iterations of MMI+fMMI training (boosting factor = 0.1)
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 4 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_b/decode_it4
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 3 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_b/decode_it3
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 6 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_b/decode_it6
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 5 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_b/decode_it5
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 7 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_b/decode_it7
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 8 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_b/decode_it8
steps/train_mmi_fmmi.sh --learning-rate 0.001 --boost 0.1 --cmd run.pl --mem 2G data/train data/lang exp/tri3b_ali exp/dubm3b exp/tri3b_denlats exp/tri3b_fmmi_c
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
steps/train_mmi_fmmi.sh: feature type is lda
Using transforms from exp/tri3b_ali
exp/tri3b_fmmi_b/decode_it4/wer_10
%WER 14.26 [ 637 / 4466, 75 ins, 123 del, 439 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_11
%WER 13.73 [ 613 / 4466, 66 ins, 124 del, 423 sub ]
%SER 48.80 [ 244 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_12
%WER 13.43 [ 600 / 4466, 56 ins, 134 del, 410 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_13
%WER 13.17 [ 588 / 4466, 49 ins, 140 del, 399 sub ]
%SER 47.00 [ 235 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_14
%WER 13.17 [ 588 / 4466, 49 ins, 151 del, 388 sub ]
%SER 47.20 [ 236 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_15
%WER 12.74 [ 569 / 4466, 46 ins, 152 del, 371 sub ]
%SER 46.60 [ 233 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_16
%WER 12.67 [ 566 / 4466, 44 ins, 156 del, 366 sub ]
%SER 46.40 [ 232 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_17
%WER 12.72 [ 568 / 4466, 43 ins, 164 del, 361 sub ]
%SER 45.80 [ 229 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_7
%WER 16.93 [ 756 / 4466, 109 ins, 109 del, 538 sub ]
%SER 57.40 [ 287 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_8
%WER 15.88 [ 709 / 4466, 94 ins, 114 del, 501 sub ]
%SER 53.60 [ 268 / 500 ]
exp/tri3b_fmmi_b/decode_it4/wer_9
%WER 14.78 [ 660 / 4466, 82 ins, 118 del, 460 sub ]
%SER 51.40 [ 257 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_10
%WER 14.55 [ 650 / 4466, 76 ins, 124 del, 450 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_11
%WER 13.97 [ 624 / 4466, 66 ins, 125 del, 433 sub ]
%SER 48.80 [ 244 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_12
%WER 13.59 [ 607 / 4466, 61 ins, 132 del, 414 sub ]
%SER 48.40 [ 242 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_13
%WER 13.32 [ 595 / 4466, 53 ins, 142 del, 400 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_14
%WER 13.23 [ 591 / 4466, 50 ins, 149 del, 392 sub ]
%SER 47.20 [ 236 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_15
%WER 12.99 [ 580 / 4466, 46 ins, 154 del, 380 sub ]
%SER 47.20 [ 236 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_16
%WER 12.81 [ 572 / 4466, 46 ins, 158 del, 368 sub ]
%SER 47.00 [ 235 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_17
%WER 12.79 [ 571 / 4466, 43 ins, 167 del, 361 sub ]
%SER 46.60 [ 233 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_7
%WER 17.35 [ 775 / 4466, 114 ins, 112 del, 549 sub ]
%SER 58.60 [ 293 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_8
%WER 16.17 [ 722 / 4466, 99 ins, 117 del, 506 sub ]
%SER 54.40 [ 272 / 500 ]
exp/tri3b_fmmi_b/decode_it3/wer_9
%WER 14.87 [ 664 / 4466, 82 ins, 117 del, 465 sub ]
%SER 51.60 [ 258 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_10
%WER 12.40 [ 554 / 4466, 50 ins, 120 del, 384 sub ]
%SER 44.80 [ 224 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_11
%WER 12.11 [ 541 / 4466, 46 ins, 127 del, 368 sub ]
%SER 44.00 [ 220 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_12
%WER 11.80 [ 527 / 4466, 42 ins, 131 del, 354 sub ]
%SER 43.60 [ 218 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_13
%WER 11.78 [ 526 / 4466, 39 ins, 143 del, 344 sub ]
%SER 42.60 [ 213 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_14
%WER 11.80 [ 527 / 4466, 37 ins, 144 del, 346 sub ]
%SER 42.40 [ 212 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_15
%WER 11.60 [ 518 / 4466, 36 ins, 144 del, 338 sub ]
%SER 42.60 [ 213 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_16
%WER 11.58 [ 517 / 4466, 35 ins, 151 del, 331 sub ]
%SER 43.00 [ 215 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_17
%WER 11.55 [ 516 / 4466, 33 ins, 162 del, 321 sub ]
%SER 42.40 [ 212 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_7
%WER 14.53 [ 649 / 4466, 82 ins, 101 del, 466 sub ]
%SER 50.60 [ 253 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_8
%WER 13.64 [ 609 / 4466, 69 ins, 109 del, 431 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_b/decode_it5/wer_9
%WER 13.03 [ 582 / 4466, 60 ins, 116 del, 406 sub ]
%SER 46.40 [ 232 / 500 ]
Iteration 0: doing fMMI
exp/tri3b_fmmi_b/decode_it6/wer_10
%WER 11.58 [ 517 / 4466, 47 ins, 112 del, 358 sub ]
%SER 42.40 [ 212 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_11
%WER 11.44 [ 511 / 4466, 44 ins, 121 del, 346 sub ]
%SER 41.20 [ 206 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_12
%WER 11.11 [ 496 / 4466, 40 ins, 128 del, 328 sub ]
%SER 40.00 [ 200 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_13
%WER 11.06 [ 494 / 4466, 37 ins, 135 del, 322 sub ]
%SER 40.40 [ 202 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_14
%WER 11.06 [ 494 / 4466, 34 ins, 142 del, 318 sub ]
%SER 40.60 [ 203 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_15
%WER 10.86 [ 485 / 4466, 34 ins, 147 del, 304 sub ]
%SER 40.40 [ 202 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_16
%WER 10.90 [ 487 / 4466, 34 ins, 151 del, 302 sub ]
%SER 40.20 [ 201 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_17
%WER 11.29 [ 504 / 4466, 33 ins, 166 del, 305 sub ]
%SER 40.60 [ 203 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_7
%WER 13.43 [ 600 / 4466, 78 ins, 100 del, 422 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_8
%WER 12.40 [ 554 / 4466, 63 ins, 103 del, 388 sub ]
%SER 45.40 [ 227 / 500 ]
exp/tri3b_fmmi_b/decode_it6/wer_9
%WER 11.80 [ 527 / 4466, 55 ins, 108 del, 364 sub ]
%SER 43.80 [ 219 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_10
%WER 11.13 [ 497 / 4466, 48 ins, 102 del, 347 sub ]
%SER 41.20 [ 206 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_11
%WER 10.84 [ 484 / 4466, 40 ins, 116 del, 328 sub ]
%SER 40.00 [ 200 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_12
%WER 10.61 [ 474 / 4466, 38 ins, 120 del, 316 sub ]
%SER 39.40 [ 197 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_13
%WER 10.48 [ 468 / 4466, 36 ins, 127 del, 305 sub ]
%SER 39.00 [ 195 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_14
%WER 10.19 [ 455 / 4466, 35 ins, 135 del, 285 sub ]
%SER 37.80 [ 189 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_15
%WER 10.39 [ 464 / 4466, 33 ins, 144 del, 287 sub ]
%SER 38.00 [ 190 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_16
%WER 10.43 [ 466 / 4466, 32 ins, 152 del, 282 sub ]
%SER 38.40 [ 192 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_17
%WER 10.50 [ 469 / 4466, 32 ins, 156 del, 281 sub ]
%SER 38.20 [ 191 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_7
%WER 13.01 [ 581 / 4466, 76 ins, 98 del, 407 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_8
%WER 12.32 [ 550 / 4466, 62 ins, 101 del, 387 sub ]
%SER 45.60 [ 228 / 500 ]
exp/tri3b_fmmi_b/decode_it7/wer_9
%WER 11.55 [ 516 / 4466, 52 ins, 104 del, 360 sub ]
%SER 42.80 [ 214 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_10
%WER 11.11 [ 496 / 4466, 48 ins, 107 del, 341 sub ]
%SER 41.40 [ 207 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_11
%WER 10.21 [ 456 / 4466, 40 ins, 112 del, 304 sub ]
%SER 38.60 [ 193 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_12
%WER 9.83 [ 439 / 4466, 39 ins, 117 del, 283 sub ]
%SER 36.80 [ 184 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_13
%WER 9.79 [ 437 / 4466, 37 ins, 128 del, 272 sub ]
%SER 35.80 [ 179 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_14
%WER 9.96 [ 445 / 4466, 34 ins, 142 del, 269 sub ]
%SER 35.40 [ 177 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_15
%WER 10.05 [ 449 / 4466, 31 ins, 151 del, 267 sub ]
%SER 36.00 [ 180 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_16
%WER 10.10 [ 451 / 4466, 31 ins, 154 del, 266 sub ]
%SER 36.80 [ 184 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_17
%WER 10.14 [ 453 / 4466, 28 ins, 162 del, 263 sub ]
%SER 37.40 [ 187 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_7
%WER 12.65 [ 565 / 4466, 71 ins, 93 del, 401 sub ]
%SER 45.60 [ 228 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_8
%WER 11.71 [ 523 / 4466, 55 ins, 100 del, 368 sub ]
%SER 43.60 [ 218 / 500 ]
exp/tri3b_fmmi_b/decode_it8/wer_9
%WER 11.17 [ 499 / 4466, 51 ins, 99 del, 349 sub ]
%SER 42.00 [ 210 / 500 ]
On iter 0, objf was -0.219628, auxf improvement from fMMI was 0.0049004053037063
Iteration 1: doing fMMI
On iter 1, objf was -0.213844, auxf improvement from fMMI was 0.00443940575905718
Iteration 2: doing fMMI
On iter 2, objf was -0.208713, auxf improvement from fMMI was 0.0038825500785832
Iteration 3: doing fMMI
On iter 3, objf was -0.204292, auxf improvement from fMMI was 0.00347245698892393
Iteration 4: doing MMI (getting stats)...
On iter 4, objf was -0.200296, auxf improvement was 0.0501926691212913
Iteration 5: doing MMI (getting stats)...
On iter 5, objf was -0.120331, auxf improvement was 0.026930952531665
Iteration 6: doing MMI (getting stats)...
On iter 6, objf was -0.0779519, auxf improvement was 0.0201198948006297
Iteration 7: doing MMI (getting stats)...
On iter 7, objf was -0.0484375, auxf improvement was 0.0170209686324147
Succeeded with        8 iters iterations of MMI+fMMI training (boosting factor = 0.1)
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 4 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_c/decode_it4
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 6 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_c/decode_it6
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 3 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_c/decode_it3
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 5 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_c/decode_it5
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 8 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_c/decode_it8
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 7 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_c/decode_it7
steps/train_mmi_fmmi_indirect.sh --learning-rate 0.002 --schedule fmmi fmmi fmmi fmmi mmi mmi mmi mmi --boost 0.1 --cmd run.pl --mem 2G data/train data/lang exp/tri3b_ali exp/dubm3b exp/tri3b_denlats exp/tri3b_fmmi_d
decode_fmmi.sh: feature type is lda
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
steps/train_mmi_fmmi_indirect.sh: feature type is lda
Using transforms from exp/tri3b_ali
exp/tri3b_fmmi_c/decode_it3/wer_10
%WER 14.85 [ 663 / 4466, 78 ins, 126 del, 459 sub ]
%SER 50.40 [ 252 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_11
%WER 14.26 [ 637 / 4466, 71 ins, 128 del, 438 sub ]
%SER 49.60 [ 248 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_12
%WER 13.97 [ 624 / 4466, 63 ins, 135 del, 426 sub ]
%SER 49.20 [ 246 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_13
%WER 13.59 [ 607 / 4466, 58 ins, 139 del, 410 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_14
%WER 13.37 [ 597 / 4466, 52 ins, 145 del, 400 sub ]
%SER 48.20 [ 241 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_15
%WER 13.10 [ 585 / 4466, 49 ins, 153 del, 383 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_16
%WER 13.12 [ 586 / 4466, 48 ins, 164 del, 374 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_17
%WER 13.12 [ 586 / 4466, 48 ins, 169 del, 369 sub ]
%SER 47.60 [ 238 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_7
%WER 17.82 [ 796 / 4466, 123 ins, 113 del, 560 sub ]
%SER 59.00 [ 295 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_8
%WER 16.75 [ 748 / 4466, 102 ins, 119 del, 527 sub ]
%SER 56.40 [ 282 / 500 ]
exp/tri3b_fmmi_c/decode_it3/wer_9
%WER 15.49 [ 692 / 4466, 85 ins, 125 del, 482 sub ]
%SER 52.60 [ 263 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_10
%WER 14.71 [ 657 / 4466, 77 ins, 125 del, 455 sub ]
%SER 50.00 [ 250 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_11
%WER 14.26 [ 637 / 4466, 71 ins, 127 del, 439 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_12
%WER 13.97 [ 624 / 4466, 63 ins, 135 del, 426 sub ]
%SER 49.20 [ 246 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_13
%WER 13.57 [ 606 / 4466, 58 ins, 139 del, 409 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_14
%WER 13.41 [ 599 / 4466, 52 ins, 148 del, 399 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_15
%WER 13.10 [ 585 / 4466, 48 ins, 153 del, 384 sub ]
%SER 47.40 [ 237 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_16
%WER 13.08 [ 584 / 4466, 48 ins, 162 del, 374 sub ]
%SER 47.60 [ 238 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_17
%WER 13.10 [ 585 / 4466, 48 ins, 169 del, 368 sub ]
%SER 47.60 [ 238 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_7
%WER 17.60 [ 786 / 4466, 119 ins, 112 del, 555 sub ]
%SER 59.00 [ 295 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_8
%WER 16.73 [ 747 / 4466, 100 ins, 120 del, 527 sub ]
%SER 56.40 [ 282 / 500 ]
exp/tri3b_fmmi_c/decode_it4/wer_9
%WER 15.36 [ 686 / 4466, 83 ins, 124 del, 479 sub ]
%SER 52.60 [ 263 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_10
%WER 12.72 [ 568 / 4466, 56 ins, 121 del, 391 sub ]
%SER 46.00 [ 230 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_11
%WER 12.54 [ 560 / 4466, 49 ins, 131 del, 380 sub ]
%SER 45.40 [ 227 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_12
%WER 12.20 [ 545 / 4466, 44 ins, 136 del, 365 sub ]
%SER 45.40 [ 227 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_13
%WER 12.07 [ 539 / 4466, 41 ins, 146 del, 352 sub ]
%SER 44.20 [ 221 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_14
%WER 11.89 [ 531 / 4466, 37 ins, 148 del, 346 sub ]
%SER 43.00 [ 215 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_15
%WER 11.82 [ 528 / 4466, 36 ins, 149 del, 343 sub ]
%SER 43.20 [ 216 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_16
%WER 12.09 [ 540 / 4466, 35 ins, 156 del, 349 sub ]
%SER 44.20 [ 221 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_17
%WER 12.02 [ 537 / 4466, 35 ins, 162 del, 340 sub ]
%SER 44.00 [ 220 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_7
%WER 14.98 [ 669 / 4466, 86 ins, 105 del, 478 sub ]
%SER 51.80 [ 259 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_8
%WER 14.06 [ 628 / 4466, 69 ins, 114 del, 445 sub ]
%SER 49.20 [ 246 / 500 ]
exp/tri3b_fmmi_c/decode_it5/wer_9
%WER 13.35 [ 596 / 4466, 62 ins, 119 del, 415 sub ]
%SER 47.60 [ 238 / 500 ]
Getting MMI stats (needed for fMMI and MMI iterations).
exp/tri3b_fmmi_c/decode_it6/wer_10
%WER 11.78 [ 526 / 4466, 47 ins, 115 del, 364 sub ]
%SER 43.40 [ 217 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_11
%WER 11.62 [ 519 / 4466, 45 ins, 117 del, 357 sub ]
%SER 42.20 [ 211 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_12
%WER 11.37 [ 508 / 4466, 40 ins, 129 del, 339 sub ]
%SER 41.60 [ 208 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_13
%WER 11.17 [ 499 / 4466, 39 ins, 137 del, 323 sub ]
%SER 41.00 [ 205 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_14
%WER 11.20 [ 500 / 4466, 34 ins, 142 del, 324 sub ]
%SER 40.80 [ 204 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_15
%WER 11.22 [ 501 / 4466, 34 ins, 148 del, 319 sub ]
%SER 41.00 [ 205 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_16
%WER 11.22 [ 501 / 4466, 34 ins, 156 del, 311 sub ]
%SER 41.00 [ 205 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_17
%WER 11.31 [ 505 / 4466, 34 ins, 165 del, 306 sub ]
%SER 41.00 [ 205 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_7
%WER 13.75 [ 614 / 4466, 83 ins, 99 del, 432 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_8
%WER 12.90 [ 576 / 4466, 67 ins, 106 del, 403 sub ]
%SER 46.40 [ 232 / 500 ]
exp/tri3b_fmmi_c/decode_it6/wer_9
%WER 12.23 [ 546 / 4466, 57 ins, 110 del, 379 sub ]
%SER 44.60 [ 223 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_10
%WER 11.20 [ 500 / 4466, 47 ins, 106 del, 347 sub ]
%SER 41.20 [ 206 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_11
%WER 10.86 [ 485 / 4466, 40 ins, 114 del, 331 sub ]
%SER 40.20 [ 201 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_12
%WER 10.79 [ 482 / 4466, 38 ins, 119 del, 325 sub ]
%SER 39.40 [ 197 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_13
%WER 10.59 [ 473 / 4466, 36 ins, 130 del, 307 sub ]
%SER 39.60 [ 198 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_14
%WER 10.57 [ 472 / 4466, 35 ins, 138 del, 299 sub ]
%SER 39.20 [ 196 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_15
%WER 10.32 [ 461 / 4466, 33 ins, 142 del, 286 sub ]
%SER 38.60 [ 193 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_16
%WER 10.61 [ 474 / 4466, 32 ins, 152 del, 290 sub ]
%SER 38.60 [ 193 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_17
%WER 10.66 [ 476 / 4466, 30 ins, 157 del, 289 sub ]
%SER 38.80 [ 194 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_7
%WER 13.52 [ 604 / 4466, 81 ins, 100 del, 423 sub ]
%SER 49.00 [ 245 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_8
%WER 12.38 [ 553 / 4466, 63 ins, 104 del, 386 sub ]
%SER 46.00 [ 230 / 500 ]
exp/tri3b_fmmi_c/decode_it7/wer_9
%WER 11.73 [ 524 / 4466, 52 ins, 106 del, 366 sub ]
%SER 43.60 [ 218 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_10
%WER 11.02 [ 492 / 4466, 47 ins, 106 del, 339 sub ]
%SER 41.40 [ 207 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_11
%WER 10.50 [ 469 / 4466, 41 ins, 116 del, 312 sub ]
%SER 39.60 [ 198 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_12
%WER 10.14 [ 453 / 4466, 38 ins, 121 del, 294 sub ]
%SER 38.00 [ 190 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_13
%WER 10.08 [ 450 / 4466, 36 ins, 127 del, 287 sub ]
%SER 37.20 [ 186 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_14
%WER 10.05 [ 449 / 4466, 35 ins, 136 del, 278 sub ]
%SER 36.60 [ 183 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_15
%WER 9.94 [ 444 / 4466, 31 ins, 145 del, 268 sub ]
%SER 36.20 [ 181 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_16
%WER 10.14 [ 453 / 4466, 31 ins, 150 del, 272 sub ]
%SER 36.60 [ 183 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_17
%WER 10.32 [ 461 / 4466, 30 ins, 160 del, 271 sub ]
%SER 37.40 [ 187 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_7
%WER 12.85 [ 574 / 4466, 72 ins, 94 del, 408 sub ]
%SER 46.20 [ 231 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_8
%WER 11.82 [ 528 / 4466, 61 ins, 101 del, 366 sub ]
%SER 44.40 [ 222 / 500 ]
exp/tri3b_fmmi_c/decode_it8/wer_9
%WER 11.33 [ 506 / 4466, 53 ins, 101 del, 352 sub ]
%SER 42.60 [ 213 / 500 ]
Iteration 0: doing fMMI
On iter 0, objf was -0.219628, auxf improvement from fMMI was 0.00638169071120837
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 1: doing fMMI
On iter 1, objf was -0.21241, auxf improvement from fMMI was 0.00524997209045902
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 2: doing fMMI
On iter 2, objf was -0.206488, auxf improvement from fMMI was 0.00472988408494072
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 3: doing fMMI
On iter 3, objf was -0.201186, auxf improvement from fMMI was 0.00445487967812605
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 4: doing MMI update
On iter 4, objf was -0.196257, auxf improvement was 0.0447942569576406
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 5: doing MMI update
On iter 5, objf was -0.109945, auxf improvement was 0.0257853690055552
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 6: doing MMI update
On iter 6, objf was -0.0660663, auxf improvement was 0.0199522150316046
Getting MMI stats (needed for fMMI and MMI iterations).
Iteration 7: doing MMI update
On iter 7, objf was -0.0348436, auxf improvement was 0.0174311986594109
Succeeded with        8 iters iterations of MMI+fMMI training (boosting factor = 0.1)
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 4 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_d/decode_it4
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 3 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_d/decode_it3
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 5 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_d/decode_it5
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 6 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_d/decode_it6
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 7 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_d/decode_it7
steps/decode_fmmi.sh --nj 2 --config conf/decode.config --cmd run.pl --mem 4G --iter 8 --transform-dir exp/tri3b/decode exp/tri3b/graph data/test exp/tri3b_fmmi_d/decode_it8
local/run_sgmm2.sh --nj 2
steps/train_ubm.sh --silence-weight 0.5 --cmd run.pl --mem 2G 400 data/train data/lang exp/tri3b_ali exp/ubm4a
decode_fmmi.sh: feature type is lda
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
decode_fmmi.sh: feature type is lda
Using fMLLR transforms from exp/tri3b/decode
steps/train_ubm.sh: feature type is lda
steps/train_ubm.sh: using transforms from exp/tri3b_ali
steps/train_ubm.sh: clustering model exp/tri3b_ali/final.mdl to get initial UBM
steps/train_ubm.sh: doing Gaussian selection
exp/tri3b_fmmi_d/decode_it3/wer_10
%WER 14.71 [ 657 / 4466, 78 ins, 126 del, 453 sub ]
%SER 50.20 [ 251 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_11
%WER 14.02 [ 626 / 4466, 68 ins, 128 del, 430 sub ]
%SER 49.80 [ 249 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_12
%WER 13.88 [ 620 / 4466, 62 ins, 136 del, 422 sub ]
%SER 48.80 [ 244 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_13
%WER 13.57 [ 606 / 4466, 57 ins, 140 del, 409 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_14
%WER 13.30 [ 594 / 4466, 53 ins, 147 del, 394 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_15
%WER 13.19 [ 589 / 4466, 48 ins, 155 del, 386 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_16
%WER 13.17 [ 588 / 4466, 48 ins, 163 del, 377 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_17
%WER 13.01 [ 581 / 4466, 46 ins, 168 del, 367 sub ]
%SER 47.40 [ 237 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_7
%WER 17.49 [ 781 / 4466, 121 ins, 112 del, 548 sub ]
%SER 58.00 [ 290 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_8
%WER 16.66 [ 744 / 4466, 102 ins, 118 del, 524 sub ]
%SER 55.80 [ 279 / 500 ]
exp/tri3b_fmmi_d/decode_it3/wer_9
%WER 15.47 [ 691 / 4466, 86 ins, 127 del, 478 sub ]
%SER 52.00 [ 260 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_10
%WER 14.51 [ 648 / 4466, 76 ins, 126 del, 446 sub ]
%SER 49.60 [ 248 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_11
%WER 13.88 [ 620 / 4466, 65 ins, 127 del, 428 sub ]
%SER 49.40 [ 247 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_12
%WER 13.70 [ 612 / 4466, 60 ins, 136 del, 416 sub ]
%SER 48.60 [ 243 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_13
%WER 13.48 [ 602 / 4466, 56 ins, 139 del, 407 sub ]
%SER 48.40 [ 242 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_14
%WER 13.17 [ 588 / 4466, 51 ins, 145 del, 392 sub ]
%SER 47.40 [ 237 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_15
%WER 13.12 [ 586 / 4466, 47 ins, 151 del, 388 sub ]
%SER 47.60 [ 238 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_16
%WER 13.19 [ 589 / 4466, 47 ins, 167 del, 375 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_17
%WER 12.99 [ 580 / 4466, 45 ins, 169 del, 366 sub ]
%SER 47.00 [ 235 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_7
%WER 17.35 [ 775 / 4466, 118 ins, 112 del, 545 sub ]
%SER 57.40 [ 287 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_8
%WER 16.48 [ 736 / 4466, 99 ins, 118 del, 519 sub ]
%SER 55.20 [ 276 / 500 ]
exp/tri3b_fmmi_d/decode_it4/wer_9
%WER 15.25 [ 681 / 4466, 83 ins, 126 del, 472 sub ]
%SER 51.60 [ 258 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_10
%WER 12.40 [ 554 / 4466, 55 ins, 118 del, 381 sub ]
%SER 45.40 [ 227 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_11
%WER 12.00 [ 536 / 4466, 47 ins, 123 del, 366 sub ]
%SER 44.40 [ 222 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_12
%WER 11.67 [ 521 / 4466, 41 ins, 129 del, 351 sub ]
%SER 43.40 [ 217 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_13
%WER 11.82 [ 528 / 4466, 40 ins, 137 del, 351 sub ]
%SER 42.80 [ 214 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_14
%WER 11.85 [ 529 / 4466, 38 ins, 146 del, 345 sub ]
%SER 43.00 [ 215 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_15
%WER 11.85 [ 529 / 4466, 37 ins, 149 del, 343 sub ]
%SER 43.60 [ 218 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_16
%WER 11.93 [ 533 / 4466, 35 ins, 156 del, 342 sub ]
%SER 43.80 [ 219 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_17
%WER 11.78 [ 526 / 4466, 34 ins, 165 del, 327 sub ]
%SER 43.80 [ 219 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_7
%WER 14.60 [ 652 / 4466, 84 ins, 106 del, 462 sub ]
%SER 50.80 [ 254 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_8
%WER 13.46 [ 601 / 4466, 67 ins, 111 del, 423 sub ]
%SER 47.20 [ 236 / 500 ]
exp/tri3b_fmmi_d/decode_it5/wer_9
%WER 12.85 [ 574 / 4466, 60 ins, 117 del, 397 sub ]
%SER 46.40 [ 232 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_10
%WER 11.40 [ 509 / 4466, 45 ins, 108 del, 356 sub ]
%SER 42.20 [ 211 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_11
%WER 11.29 [ 504 / 4466, 42 ins, 117 del, 345 sub ]
%SER 41.20 [ 206 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_12
%WER 11.08 [ 495 / 4466, 38 ins, 127 del, 330 sub ]
%SER 40.60 [ 203 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_13
%WER 10.86 [ 485 / 4466, 37 ins, 131 del, 317 sub ]
%SER 40.00 [ 200 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_14
%WER 11.02 [ 492 / 4466, 33 ins, 142 del, 317 sub ]
%SER 40.00 [ 200 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_15
%WER 10.73 [ 479 / 4466, 32 ins, 146 del, 301 sub ]
%SER 40.00 [ 200 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_16
%WER 10.84 [ 484 / 4466, 32 ins, 156 del, 296 sub ]
%SER 40.00 [ 200 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_17
%WER 10.95 [ 489 / 4466, 30 ins, 164 del, 295 sub ]
%SER 40.20 [ 201 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_7
%WER 13.41 [ 599 / 4466, 79 ins, 98 del, 422 sub ]
%SER 48.00 [ 240 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_8
%WER 12.36 [ 552 / 4466, 63 ins, 102 del, 387 sub ]
%SER 46.20 [ 231 / 500 ]
exp/tri3b_fmmi_d/decode_it6/wer_9
%WER 11.85 [ 529 / 4466, 55 ins, 104 del, 370 sub ]
%SER 43.80 [ 219 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_10
%WER 10.95 [ 489 / 4466, 45 ins, 103 del, 341 sub ]
%SER 40.80 [ 204 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_11
%WER 10.61 [ 474 / 4466, 40 ins, 113 del, 321 sub ]
%SER 39.40 [ 197 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_12
%WER 10.32 [ 461 / 4466, 39 ins, 118 del, 304 sub ]
%SER 38.20 [ 191 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_13
%WER 10.19 [ 455 / 4466, 37 ins, 127 del, 291 sub ]
%SER 38.20 [ 191 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_14
%WER 9.99 [ 446 / 4466, 35 ins, 130 del, 281 sub ]
%SER 37.20 [ 186 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_15
%WER 10.05 [ 449 / 4466, 33 ins, 144 del, 272 sub ]
%SER 36.60 [ 183 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_16
%WER 9.81 [ 438 / 4466, 30 ins, 144 del, 264 sub ]
%SER 36.20 [ 181 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_17
%WER 9.96 [ 445 / 4466, 30 ins, 151 del, 264 sub ]
%SER 36.60 [ 183 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_7
%WER 12.90 [ 576 / 4466, 74 ins, 94 del, 408 sub ]
%SER 47.80 [ 239 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_8
%WER 12.05 [ 538 / 4466, 63 ins, 97 del, 378 sub ]
%SER 45.40 [ 227 / 500 ]
exp/tri3b_fmmi_d/decode_it7/wer_9
%WER 11.35 [ 507 / 4466, 52 ins, 99 del, 356 sub ]
%SER 43.60 [ 218 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_10
%WER 10.75 [ 480 / 4466, 48 ins, 107 del, 325 sub ]
%SER 40.60 [ 203 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_11
%WER 10.21 [ 456 / 4466, 39 ins, 112 del, 305 sub ]
%SER 39.00 [ 195 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_12
%WER 9.63 [ 430 / 4466, 39 ins, 114 del, 277 sub ]
%SER 37.00 [ 185 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_13
%WER 9.61 [ 429 / 4466, 37 ins, 121 del, 271 sub ]
%SER 35.80 [ 179 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_14
%WER 9.74 [ 435 / 4466, 35 ins, 134 del, 266 sub ]
%SER 36.00 [ 180 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_15
%WER 9.85 [ 440 / 4466, 33 ins, 144 del, 263 sub ]
%SER 35.60 [ 178 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_16
%WER 9.94 [ 444 / 4466, 30 ins, 150 del, 264 sub ]
%SER 36.60 [ 183 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_17
%WER 9.92 [ 443 / 4466, 26 ins, 153 del, 264 sub ]
%SER 36.80 [ 184 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_7
%WER 12.52 [ 559 / 4466, 72 ins, 91 del, 396 sub ]
%SER 45.40 [ 227 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_8
%WER 11.55 [ 516 / 4466, 59 ins, 95 del, 362 sub ]
%SER 43.20 [ 216 / 500 ]
exp/tri3b_fmmi_d/decode_it8/wer_9
%WER 11.31 [ 505 / 4466, 55 ins, 98 del, 352 sub ]
%SER 42.00 [ 210 / 500 ]
Pass 0
Pass 1
Pass 2
steps/train_sgmm2.sh --cmd run.pl --mem 2G 8000 19000 data/train data/lang exp/tri3b_ali exp/ubm4a/final.ubm exp/sgmm2_4a
steps/train_sgmm2.sh: feature type is lda
steps/train_sgmm2.sh: using transforms from exp/tri3b_ali
steps/train_sgmm2.sh: accumulating tree stats
steps/train_sgmm2.sh: Getting questions for tree clustering.
steps/train_sgmm2.sh: Building the tree
steps/train_sgmm2.sh: Initializing the model
steps/train_sgmm2.sh: doing Gaussian selection
steps/train_sgmm2.sh: compiling training graphs
steps/train_sgmm2.sh: converting alignments
steps/train_sgmm2.sh: training pass 0 ...
steps/train_sgmm2.sh: training pass 1 ...
steps/train_sgmm2.sh: training pass 2 ...
steps/train_sgmm2.sh: training pass 3 ...
steps/train_sgmm2.sh: training pass 4 ...
steps/train_sgmm2.sh: training pass 5 ...
steps/train_sgmm2.sh: re-aligning data
steps/train_sgmm2.sh: training pass 6 ...
steps/train_sgmm2.sh: training pass 7 ...
steps/train_sgmm2.sh: training pass 8 ...
steps/train_sgmm2.sh: training pass 9 ...
steps/train_sgmm2.sh: training pass 10 ...
steps/train_sgmm2.sh: re-aligning data
steps/train_sgmm2.sh: training pass 11 ...
steps/train_sgmm2.sh: training pass 12 ...
steps/train_sgmm2.sh: training pass 13 ...
steps/train_sgmm2.sh: training pass 14 ...
steps/train_sgmm2.sh: training pass 15 ...
steps/train_sgmm2.sh: re-aligning data
steps/train_sgmm2.sh: training pass 16 ...
steps/train_sgmm2.sh: training pass 17 ...
steps/train_sgmm2.sh: training pass 18 ...
steps/train_sgmm2.sh: training pass 19 ...
steps/train_sgmm2.sh: training pass 20 ...
steps/train_sgmm2.sh: training pass 21 ...
steps/train_sgmm2.sh: training pass 22 ...
steps/train_sgmm2.sh: training pass 23 ...
steps/train_sgmm2.sh: training pass 24 ...
steps/train_sgmm2.sh: building alignment model (pass 25)
steps/train_sgmm2.sh: building alignment model (pass 26)
steps/train_sgmm2.sh: building alignment model (pass 27)
93 warnings in exp/sgmm2_4a/log/spkvecs.*.*.log
168 warnings in exp/sgmm2_4a/log/acc_ali.*.*.log
794 warnings in exp/sgmm2_4a/log/update.*.log
1 warnings in exp/sgmm2_4a/log/build_tree.log
68 warnings in exp/sgmm2_4a/log/update_ali.*.log
920 warnings in exp/sgmm2_4a/log/acc.*.*.log
1376 warnings in exp/sgmm2_4a/log/align.*.*.log
Done
tree-info exp/sgmm2_4a/tree
tree-info exp/sgmm2_4a/tree
make-h-transducer --disambig-syms-out=exp/sgmm2_4a/graph/disambig_tid.int --transition-scale=1.0 data/lang_test/tmp/ilabels_3_1 exp/sgmm2_4a/tree exp/sgmm2_4a/final.mdl
fstrmepslocal
fstrmsymbols exp/sgmm2_4a/graph/disambig_tid.int
fstminimizeencoded
fstdeterminizestar --use-log=true
fsttablecompose exp/sgmm2_4a/graph/Ha.fst data/lang_test/tmp/CLG_3_1.fst
fstisstochastic exp/sgmm2_4a/graph/HCLGa.fst
0.000485195 -0.0644299
HCLGa is not stochastic
add-self-loops --self-loop-scale=0.1 --reorder=true exp/sgmm2_4a/final.mdl
steps/decode_sgmm2.sh --config conf/decode.config --nj 2 --cmd run.pl --mem 4G --transform-dir exp/tri3b/decode exp/sgmm2_4a/graph data/test exp/sgmm2_4a/decode
steps/decode_sgmm2.sh: feature type is lda
steps/decode_sgmm2.sh: using transforms from exp/tri3b/decode
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/sgmm2_4a/graph exp/sgmm2_4a/decode
steps/diagnostic/analyze_lats.sh: see stats in exp/sgmm2_4a/decode/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,1,6) and mean=3.2
steps/diagnostic/analyze_lats.sh: see stats in exp/sgmm2_4a/decode/log/analyze_lattice_depth_stats.log
exp/sgmm2_4a/decode/wer_10
%WER 10.03 [ 448 / 4466, 60 ins, 101 del, 287 sub ]
%SER 38.20 [ 191 / 500 ]
exp/sgmm2_4a/decode/wer_11
%WER 9.67 [ 432 / 4466, 52 ins, 103 del, 277 sub ]
%SER 37.00 [ 185 / 500 ]
exp/sgmm2_4a/decode/wer_12
%WER 9.43 [ 421 / 4466, 49 ins, 109 del, 263 sub ]
%SER 37.20 [ 186 / 500 ]
exp/sgmm2_4a/decode/wer_13
%WER 9.45 [ 422 / 4466, 46 ins, 119 del, 257 sub ]
%SER 37.80 [ 189 / 500 ]
exp/sgmm2_4a/decode/wer_14
%WER 9.49 [ 424 / 4466, 42 ins, 129 del, 253 sub ]
%SER 38.20 [ 191 / 500 ]
exp/sgmm2_4a/decode/wer_15
%WER 9.40 [ 420 / 4466, 41 ins, 132 del, 247 sub ]
%SER 38.00 [ 190 / 500 ]
exp/sgmm2_4a/decode/wer_16
%WER 9.54 [ 426 / 4466, 36 ins, 140 del, 250 sub ]
%SER 38.40 [ 192 / 500 ]
exp/sgmm2_4a/decode/wer_17
%WER 9.61 [ 429 / 4466, 36 ins, 143 del, 250 sub ]
%SER 38.40 [ 192 / 500 ]
exp/sgmm2_4a/decode/wer_7
%WER 11.31 [ 505 / 4466, 84 ins, 88 del, 333 sub ]
%SER 42.00 [ 210 / 500 ]
exp/sgmm2_4a/decode/wer_8
%WER 10.55 [ 471 / 4466, 72 ins, 88 del, 311 sub ]
%SER 39.80 [ 199 / 500 ]
exp/sgmm2_4a/decode/wer_9
%WER 10.39 [ 464 / 4466, 67 ins, 98 del, 299 sub ]
%SER 38.80 [ 194 / 500 ]
steps/decode_sgmm2.sh --use-fmllr true --config conf/decode.config --nj 2 --cmd run.pl --mem 4G --transform-dir exp/tri3b/decode exp/sgmm2_4a/graph data/test exp/sgmm2_4a/decode_fmllr
steps/decode_sgmm2.sh: feature type is lda
steps/decode_sgmm2.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2.sh: computing fMLLR transforms.
steps/decode_sgmm2.sh: computing pre-transform for fMLLR computation.
sgmm2-comp-prexform exp/sgmm2_4a/final.mdl exp/sgmm2_4a/final.occs exp/sgmm2_4a/final.fmllr_mdl
LOG (sgmm2-comp-prexform[5.4.228~1-5b27]:main():sgmm2-comp-prexform.cc:77) Written model to exp/sgmm2_4a/final.fmllr_mdl
steps/diagnostic/analyze_lats.sh --cmd run.pl --mem 4G exp/sgmm2_4a/graph exp/sgmm2_4a/decode_fmllr
steps/diagnostic/analyze_lats.sh: see stats in exp/sgmm2_4a/decode_fmllr/log/analyze_alignments.log
Overall, lattice depth (10,50,90-percentile)=(1,1,6) and mean=2.9
steps/diagnostic/analyze_lats.sh: see stats in exp/sgmm2_4a/decode_fmllr/log/analyze_lattice_depth_stats.log
exp/sgmm2_4a/decode_fmllr/wer_10
%WER 9.90 [ 442 / 4466, 59 ins, 101 del, 282 sub ]
%SER 38.40 [ 192 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_11
%WER 9.72 [ 434 / 4466, 54 ins, 105 del, 275 sub ]
%SER 38.00 [ 190 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_12
%WER 9.29 [ 415 / 4466, 47 ins, 112 del, 256 sub ]
%SER 37.80 [ 189 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_13
%WER 9.31 [ 416 / 4466, 46 ins, 115 del, 255 sub ]
%SER 37.60 [ 188 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_14
%WER 9.34 [ 417 / 4466, 44 ins, 121 del, 252 sub ]
%SER 37.40 [ 187 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_15
%WER 9.16 [ 409 / 4466, 42 ins, 127 del, 240 sub ]
%SER 37.20 [ 186 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_16
%WER 9.36 [ 418 / 4466, 38 ins, 138 del, 242 sub ]
%SER 38.20 [ 191 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_17
%WER 9.47 [ 423 / 4466, 37 ins, 142 del, 244 sub ]
%SER 38.00 [ 190 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_7
%WER 10.88 [ 486 / 4466, 79 ins, 83 del, 324 sub ]
%SER 41.80 [ 209 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_8
%WER 10.30 [ 460 / 4466, 69 ins, 85 del, 306 sub ]
%SER 40.20 [ 201 / 500 ]
exp/sgmm2_4a/decode_fmllr/wer_9
%WER 9.90 [ 442 / 4466, 62 ins, 92 del, 288 sub ]
%SER 37.80 [ 189 / 500 ]
steps/align_sgmm2.sh --nj 2 --cmd run.pl --mem 2G --transform-dir exp/tri3b --use-graphs true --use-gselect true data/train data/lang exp/sgmm2_4a exp/sgmm2_4a_ali
steps/align_sgmm2.sh: feature type is lda
steps/align_sgmm2.sh: using transforms from exp/tri3b
steps/align_sgmm2.sh: aligning data in data/train using model exp/sgmm2_4a/final.alimdl
steps/align_sgmm2.sh: computing speaker vectors (1st pass)
steps/align_sgmm2.sh: computing speaker vectors (2nd pass)
steps/align_sgmm2.sh: doing final alignment.
steps/align_sgmm2.sh: done aligning data.
steps/diagnostic/analyze_alignments.sh --cmd run.pl --mem 2G data/lang exp/sgmm2_4a_ali
steps/diagnostic/analyze_alignments.sh: see stats in exp/sgmm2_4a_ali/log/analyze_alignments.log
32 warnings in exp/sgmm2_4a_ali/log/spk_vecs2.*.log
309 warnings in exp/sgmm2_4a_ali/log/align_pass1.*.log
337 warnings in exp/sgmm2_4a_ali/log/align_pass2.*.log
57 warnings in exp/sgmm2_4a_ali/log/spk_vecs1.*.log
steps/make_denlats_sgmm2.sh --nj 2 --sub-split 20 --cmd run.pl --mem 4G --transform-dir exp/tri3b data/train data/lang exp/sgmm2_4a_ali exp/sgmm2_4a_denlats
steps/make_denlats_sgmm2.sh: Making unigram grammar FST in exp/sgmm2_4a_denlats/lang
steps/make_denlats_sgmm2.sh: Compiling decoding graph in exp/sgmm2_4a_denlats/dengraph
tree-info exp/sgmm2_4a_ali/tree
tree-info exp/sgmm2_4a_ali/tree
fstdeterminizestar --use-log=true
fstminimizeencoded
fsttablecompose exp/sgmm2_4a_denlats/lang/L_disambig.fst exp/sgmm2_4a_denlats/lang/G.fst
fstpushspecial
fstisstochastic exp/sgmm2_4a_denlats/lang/tmp/LG.fst
0.000250081 -0.000227189
fstcomposecontext --context-size=3 --central-position=1 --read-disambig-syms=exp/sgmm2_4a_denlats/lang/phones/disambig.int --write-disambig-syms=exp/sgmm2_4a_denlats/lang/tmp/disambig_ilabels_3_1.int exp/sgmm2_4a_denlats/lang/tmp/ilabels_3_1.23182
fstisstochastic exp/sgmm2_4a_denlats/lang/tmp/CLG_3_1.fst
0.000250081 -0.000227189
make-h-transducer --disambig-syms-out=exp/sgmm2_4a_denlats/dengraph/disambig_tid.int --transition-scale=1.0 exp/sgmm2_4a_denlats/lang/tmp/ilabels_3_1 exp/sgmm2_4a_ali/tree exp/sgmm2_4a_ali/final.mdl
fstdeterminizestar --use-log=true
fstminimizeencoded
fstrmepslocal
fsttablecompose exp/sgmm2_4a_denlats/dengraph/Ha.fst exp/sgmm2_4a_denlats/lang/tmp/CLG_3_1.fst
fstrmsymbols exp/sgmm2_4a_denlats/dengraph/disambig_tid.int
fstisstochastic exp/sgmm2_4a_denlats/dengraph/HCLGa.fst
0.000492888 -0.000570047
add-self-loops --self-loop-scale=0.1 --reorder=true exp/sgmm2_4a_ali/final.mdl
steps/make_denlats_sgmm2.sh: feature type is lda
steps/make_denlats_sgmm2.sh: using fMLLR transforms from exp/tri3b
steps/make_denlats_sgmm2.sh: Merging archives for data subset 1
steps/make_denlats_sgmm2.sh: Merging archives for data subset 2
steps/make_denlats_sgmm2.sh: done generating denominator lattices with SGMMs.
steps/train_mmi_sgmm2.sh --cmd run.pl --mem 4G --transform-dir exp/tri3b --boost 0.15 data/train data/lang exp/sgmm2_4a_ali exp/sgmm2_4a_denlats exp/sgmm2_4a_mmi_b0.15
steps/train_mmi_sgmm2.sh: feature type is lda
steps/train_mmi_sgmm2.sh: using transforms from exp/tri3b
steps/train_mmi_sgmm2.sh: using speaker vectors from exp/sgmm2_4a_ali
steps/train_mmi_sgmm2.sh: using Gaussian-selection info from exp/sgmm2_4a_ali
Iteration 0 of MMI training
Iteration 0: objf was 0.168695799146471, MMI auxf change was 0.00410538710610928
Iteration 1 of MMI training
Iteration 1: objf was 0.175061329096331, MMI auxf change was 0.00224472551172184
Iteration 2 of MMI training
Iteration 2: objf was 0.179142240741879, MMI auxf change was 0.00210383873908492
Iteration 3 of MMI training
Iteration 3: objf was 0.182983574700464, MMI auxf change was 0.00298113964023261
MMI training finished
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 1 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15/decode_it1
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 2 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15/decode_it2
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 3 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15/decode_it3
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 4 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15/decode_it4
steps/train_mmi_sgmm2.sh --cmd run.pl --mem 4G --transform-dir exp/tri3b --boost 0.15 --drop-frames true data/train data/lang exp/sgmm2_4a_ali exp/sgmm2_4a_denlats exp/sgmm2_4a_mmi_b0.15_x
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15/3.mdl
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15/2.mdl
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15/1.mdl
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15/4.mdl
steps/train_mmi_sgmm2.sh: feature type is lda
steps/train_mmi_sgmm2.sh: using transforms from exp/tri3b
steps/train_mmi_sgmm2.sh: using speaker vectors from exp/sgmm2_4a_ali
steps/train_mmi_sgmm2.sh: using Gaussian-selection info from exp/sgmm2_4a_ali
Iteration 0 of MMI training
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_10
%WER 8.53 [ 381 / 4466, 53 ins, 87 del, 241 sub ]
%SER 33.20 [ 166 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_11
%WER 8.37 [ 374 / 4466, 49 ins, 92 del, 233 sub ]
%SER 33.40 [ 167 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_12
%WER 8.28 [ 370 / 4466, 46 ins, 95 del, 229 sub ]
%SER 33.20 [ 166 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_13
%WER 8.13 [ 363 / 4466, 42 ins, 101 del, 220 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_14
%WER 8.08 [ 361 / 4466, 39 ins, 105 del, 217 sub ]
%SER 32.80 [ 164 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_15
%WER 7.99 [ 357 / 4466, 36 ins, 109 del, 212 sub ]
%SER 32.80 [ 164 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_16
%WER 8.04 [ 359 / 4466, 36 ins, 110 del, 213 sub ]
%SER 33.00 [ 165 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_17
%WER 8.15 [ 364 / 4466, 36 ins, 116 del, 212 sub ]
%SER 33.60 [ 168 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_7
%WER 9.36 [ 418 / 4466, 69 ins, 71 del, 278 sub ]
%SER 37.00 [ 185 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_8
%WER 8.98 [ 401 / 4466, 61 ins, 75 del, 265 sub ]
%SER 35.60 [ 178 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it2/wer_9
%WER 8.62 [ 385 / 4466, 54 ins, 79 del, 252 sub ]
%SER 33.80 [ 169 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_10
%WER 8.84 [ 395 / 4466, 53 ins, 90 del, 252 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_11
%WER 8.78 [ 392 / 4466, 50 ins, 94 del, 248 sub ]
%SER 35.00 [ 175 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_12
%WER 8.73 [ 390 / 4466, 44 ins, 101 del, 245 sub ]
%SER 35.00 [ 175 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_13
%WER 8.64 [ 386 / 4466, 43 ins, 104 del, 239 sub ]
%SER 34.20 [ 171 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_14
%WER 8.58 [ 383 / 4466, 41 ins, 110 del, 232 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_15
%WER 8.53 [ 381 / 4466, 37 ins, 115 del, 229 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_16
%WER 8.80 [ 393 / 4466, 37 ins, 125 del, 231 sub ]
%SER 35.00 [ 175 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_17
%WER 8.67 [ 387 / 4466, 35 ins, 125 del, 227 sub ]
%SER 34.80 [ 174 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_7
%WER 10.08 [ 450 / 4466, 67 ins, 76 del, 307 sub ]
%SER 38.00 [ 190 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_8
%WER 9.58 [ 428 / 4466, 63 ins, 80 del, 285 sub ]
%SER 36.40 [ 182 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it1/wer_9
%WER 9.02 [ 403 / 4466, 57 ins, 86 del, 260 sub ]
%SER 35.00 [ 175 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_10
%WER 8.24 [ 368 / 4466, 56 ins, 76 del, 236 sub ]
%SER 33.20 [ 166 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_11
%WER 8.02 [ 358 / 4466, 54 ins, 82 del, 222 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_12
%WER 7.75 [ 346 / 4466, 45 ins, 88 del, 213 sub ]
%SER 31.80 [ 159 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_13
%WER 7.68 [ 343 / 4466, 42 ins, 93 del, 208 sub ]
%SER 31.20 [ 156 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_14
%WER 7.79 [ 348 / 4466, 40 ins, 96 del, 212 sub ]
%SER 32.20 [ 161 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_15
%WER 7.75 [ 346 / 4466, 37 ins, 102 del, 207 sub ]
%SER 32.00 [ 160 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_16
%WER 7.79 [ 348 / 4466, 36 ins, 108 del, 204 sub ]
%SER 32.20 [ 161 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_17
%WER 7.99 [ 357 / 4466, 36 ins, 112 del, 209 sub ]
%SER 33.00 [ 165 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_7
%WER 8.87 [ 396 / 4466, 69 ins, 56 del, 271 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_8
%WER 8.46 [ 378 / 4466, 64 ins, 62 del, 252 sub ]
%SER 33.60 [ 168 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it4/wer_9
%WER 8.28 [ 370 / 4466, 59 ins, 70 del, 241 sub ]
%SER 32.80 [ 164 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_10
%WER 8.20 [ 366 / 4466, 54 ins, 82 del, 230 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_11
%WER 8.22 [ 367 / 4466, 51 ins, 87 del, 229 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_12
%WER 8.11 [ 362 / 4466, 49 ins, 92 del, 221 sub ]
%SER 32.40 [ 162 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_13
%WER 7.88 [ 352 / 4466, 41 ins, 96 del, 215 sub ]
%SER 31.40 [ 157 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_14
%WER 7.81 [ 349 / 4466, 39 ins, 99 del, 211 sub ]
%SER 31.80 [ 159 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_15
%WER 7.77 [ 347 / 4466, 36 ins, 103 del, 208 sub ]
%SER 32.00 [ 160 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_16
%WER 7.93 [ 354 / 4466, 36 ins, 109 del, 209 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_17
%WER 8.04 [ 359 / 4466, 36 ins, 112 del, 211 sub ]
%SER 33.20 [ 166 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_7
%WER 9.31 [ 416 / 4466, 68 ins, 66 del, 282 sub ]
%SER 36.60 [ 183 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_8
%WER 8.60 [ 384 / 4466, 61 ins, 71 del, 252 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15/decode_it3/wer_9
%WER 8.22 [ 367 / 4466, 55 ins, 74 del, 238 sub ]
%SER 32.80 [ 164 / 500 ]
Iteration 0: objf was 0.175181019383194, MMI auxf change was 0.0034125280621873
Iteration 1 of MMI training
Iteration 1: objf was 0.180263810922761, MMI auxf change was 0.00174171810916869
Iteration 2 of MMI training
Iteration 2: objf was 0.183178942393599, MMI auxf change was 0.00132674699803115
Iteration 3 of MMI training
Iteration 3: objf was 0.185371432176875, MMI auxf change was 0.0010556939157118
MMI training finished
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 2 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15_x/decode_it2
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 1 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15_x/decode_it1
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 4 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15_x/decode_it4
steps/decode_sgmm2_rescore.sh --cmd run.pl --mem 4G --iter 3 --transform-dir exp/tri3b/decode data/lang data/test exp/sgmm2_4a/decode exp/sgmm2_4a_mmi_b0.15_x/decode_it3
steps/decode_combine.sh data/test data/lang exp/tri1/decode exp/tri2a/decode exp/combine_1_2a/decode
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15_x/2.mdl
steps/decode_sgmm2_rescore.sh: using speaker vectors from exp/sgmm2_4a/decode
steps/decode_sgmm2_rescore.sh: feature type is lda
steps/decode_sgmm2_rescore.sh: using transforms from exp/tri3b/decode
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15_x/1.mdl
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15_x/4.mdl
steps/decode_sgmm2_rescore.sh: rescoring lattices with SGMM model in exp/sgmm2_4a_mmi_b0.15_x/3.mdl
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_10
%WER 8.93 [ 399 / 4466, 54 ins, 88 del, 257 sub ]
%SER 35.00 [ 175 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_11
%WER 8.84 [ 395 / 4466, 49 ins, 95 del, 251 sub ]
%SER 34.80 [ 174 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_12
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_10
%WER 8.71 [ 389 / 4466, 45 ins, 100 del, 244 sub ]
%SER 34.80 [ 174 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_13
%WER 8.53 [ 381 / 4466, 53 ins, 84 del, 244 sub ]
%SER 33.20 [ 166 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_11
%WER 8.62 [ 385 / 4466, 42 ins, 105 del, 238 sub ]
%SER 34.20 [ 171 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_14
%WER 8.44 [ 377 / 4466, 49 ins, 93 del, 235 sub ]
%SER 33.20 [ 166 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_12
%WER 8.62 [ 385 / 4466, 42 ins, 110 del, 233 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_15
%WER 8.26 [ 369 / 4466, 45 ins, 91 del, 233 sub ]
%SER 33.00 [ 165 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_13
%WER 8.73 [ 390 / 4466, 40 ins, 116 del, 234 sub ]
%SER 35.00 [ 175 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_16
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_10
%WER 8.24 [ 368 / 4466, 41 ins, 99 del, 228 sub ]
%SER 32.80 [ 164 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_14
%WER 8.82 [ 394 / 4466, 38 ins, 124 del, 232 sub ]
%SER 35.20 [ 176 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_17
%WER 8.26 [ 369 / 4466, 52 ins, 76 del, 241 sub ]
%SER 32.60 [ 163 / 500 ]
%WER 8.20 [ 366 / 4466, 41 ins, 103 del, 222 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_11
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_15
%WER 8.49 [ 379 / 4466, 35 ins, 123 del, 221 sub ]
%SER 34.60 [ 173 / 500 ]
%WER 8.11 [ 362 / 4466, 38 ins, 109 del, 215 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_16
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_7
%WER 8.04 [ 359 / 4466, 51 ins, 80 del, 228 sub ]
%SER 32.00 [ 160 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_12
%WER 8.04 [ 359 / 4466, 36 ins, 109 del, 214 sub ]
%SER 32.80 [ 164 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_17
%WER 10.28 [ 459 / 4466, 70 ins, 73 del, 316 sub ]
%SER 38.40 [ 192 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_8
%WER 7.97 [ 356 / 4466, 46 ins, 86 del, 224 sub ]
%SER 32.00 [ 160 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_13
%WER 8.08 [ 361 / 4466, 35 ins, 115 del, 211 sub ]
%SER 33.40 [ 167 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_7
%WER 9.58 [ 428 / 4466, 62 ins, 80 del, 286 sub ]
%SER 37.40 [ 187 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it1/wer_9
%WER 7.73 [ 345 / 4466, 44 ins, 89 del, 212 sub ]
%SER 31.20 [ 156 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_14
%WER 9.76 [ 436 / 4466, 71 ins, 71 del, 294 sub ]
%SER 38.20 [ 191 / 500 ]
%WER 9.18 [ 410 / 4466, 58 ins, 87 del, 265 sub ]
%SER 35.80 [ 179 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_8
%WER 7.68 [ 343 / 4466, 43 ins, 92 del, 208 sub ]
%SER 30.80 [ 154 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_15
%WER 9.27 [ 414 / 4466, 64 ins, 75 del, 275 sub ]
%SER 37.00 [ 185 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it2/wer_9
%WER 7.77 [ 347 / 4466, 40 ins, 99 del, 208 sub ]
%SER 31.40 [ 157 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_16
%WER 8.62 [ 385 / 4466, 54 ins, 81 del, 250 sub ]
%SER 34.00 [ 170 / 500 ]
%WER 7.68 [ 343 / 4466, 38 ins, 102 del, 203 sub ]
%SER 31.40 [ 157 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_10
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_17
%WER 7.73 [ 345 / 4466, 37 ins, 104 del, 204 sub ]
%SER 31.80 [ 159 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_7
%WER 8.28 [ 370 / 4466, 54 ins, 79 del, 237 sub ]
%SER 32.80 [ 164 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_11
%WER 9.29 [ 415 / 4466, 72 ins, 62 del, 281 sub ]
%SER 35.80 [ 179 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_8
%WER 8.20 [ 366 / 4466, 49 ins, 85 del, 232 sub ]
%SER 32.40 [ 162 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_12
%WER 8.89 [ 397 / 4466, 63 ins, 64 del, 270 sub ]
%SER 34.40 [ 172 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it4/wer_9
%WER 8.17 [ 365 / 4466, 47 ins, 91 del, 227 sub ]
%SER 32.40 [ 162 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_13
%WER 8.51 [ 380 / 4466, 58 ins, 73 del, 249 sub ]
%SER 33.80 [ 169 / 500 ]
%WER 7.99 [ 357 / 4466, 43 ins, 92 del, 222 sub ]
%SER 31.80 [ 159 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_14
%WER 8.02 [ 358 / 4466, 42 ins, 101 del, 215 sub ]
%SER 32.00 [ 160 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_15
%WER 8.08 [ 361 / 4466, 41 ins, 105 del, 215 sub ]
%SER 32.60 [ 163 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_16
%WER 7.97 [ 356 / 4466, 39 ins, 105 del, 212 sub ]
%SER 32.40 [ 162 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_17
%WER 8.11 [ 362 / 4466, 37 ins, 110 del, 215 sub ]
%SER 33.00 [ 165 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_7
%WER 9.54 [ 426 / 4466, 73 ins, 67 del, 286 sub ]
%SER 37.20 [ 186 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_8
%WER 8.93 [ 399 / 4466, 64 ins, 69 del, 266 sub ]
%SER 35.40 [ 177 / 500 ]
exp/sgmm2_4a_mmi_b0.15_x/decode_it3/wer_9
%WER 8.64 [ 386 / 4466, 58 ins, 76 del, 252 sub ]
%SER 34.00 [ 170 / 500 ]
exp/combine_1_2a/decode/wer_10
%WER 20.98 [ 937 / 4466, 73 ins, 214 del, 650 sub ]
%SER 59.20 [ 296 / 500 ]
exp/combine_1_2a/decode/wer_11
%WER 20.56 [ 918 / 4466, 64 ins, 228 del, 626 sub ]
%SER 58.40 [ 292 / 500 ]
exp/combine_1_2a/decode/wer_12
%WER 20.31 [ 907 / 4466, 53 ins, 247 del, 607 sub ]
%SER 58.00 [ 290 / 500 ]
exp/combine_1_2a/decode/wer_13
%WER 20.17 [ 901 / 4466, 44 ins, 269 del, 588 sub ]
%SER 58.60 [ 293 / 500 ]
exp/combine_1_2a/decode/wer_14
%WER 20.17 [ 901 / 4466, 39 ins, 290 del, 572 sub ]
%SER 59.20 [ 296 / 500 ]
exp/combine_1_2a/decode/wer_15
%WER 19.79 [ 884 / 4466, 33 ins, 304 del, 547 sub ]
%SER 58.80 [ 294 / 500 ]
exp/combine_1_2a/decode/wer_16
%WER 19.93 [ 890 / 4466, 31 ins, 320 del, 539 sub ]
%SER 58.40 [ 292 / 500 ]
exp/combine_1_2a/decode/wer_17
%WER 20.11 [ 898 / 4466, 28 ins, 338 del, 532 sub ]
%SER 58.20 [ 291 / 500 ]
exp/combine_1_2a/decode/wer_7
%WER 25.53 [ 1140 / 4466, 132 ins, 184 del, 824 sub ]
%SER 69.20 [ 346 / 500 ]
exp/combine_1_2a/decode/wer_8
%WER 23.65 [ 1056 / 4466, 113 ins, 187 del, 756 sub ]
%SER 64.40 [ 322 / 500 ]
exp/combine_1_2a/decode/wer_9
%WER 22.08 [ 986 / 4466, 92 ins, 196 del, 698 sub ]
%SER 61.00 [ 305 / 500 ]
steps/decode_combine.sh data/test data/lang exp/sgmm2_4a/decode exp/tri3b_mmi/decode exp/combine_sgmm2_4a_3b/decode
exp/combine_sgmm2_4a_3b/decode/wer_10
%WER 9.61 [ 429 / 4466, 52 ins, 91 del, 286 sub ]
%SER 37.20 [ 186 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_11
%WER 9.58 [ 428 / 4466, 49 ins, 95 del, 284 sub ]
%SER 37.20 [ 186 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_12
%WER 9.52 [ 425 / 4466, 47 ins, 101 del, 277 sub ]
%SER 36.60 [ 183 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_13
%WER 9.70 [ 433 / 4466, 44 ins, 110 del, 279 sub ]
%SER 37.60 [ 188 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_14
%WER 9.47 [ 423 / 4466, 42 ins, 113 del, 268 sub ]
%SER 36.60 [ 183 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_15
%WER 9.63 [ 430 / 4466, 41 ins, 119 del, 270 sub ]
%SER 37.80 [ 189 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_16
%WER 9.87 [ 441 / 4466, 41 ins, 124 del, 276 sub ]
%SER 38.40 [ 192 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_17
%WER 9.92 [ 443 / 4466, 40 ins, 131 del, 272 sub ]
%SER 38.60 [ 193 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_7
%WER 10.66 [ 476 / 4466, 66 ins, 89 del, 321 sub ]
%SER 41.40 [ 207 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_8
%WER 10.10 [ 451 / 4466, 57 ins, 89 del, 305 sub ]
%SER 39.20 [ 196 / 500 ]
exp/combine_sgmm2_4a_3b/decode/wer_9
%WER 9.94 [ 444 / 4466, 55 ins, 90 del, 299 sub ]
%SER 38.00 [ 190 / 500 ]
steps/decode_combine.sh data/test data/lang exp/sgmm2_4a/decode exp/tri3b_fmmi_c/decode_it5 exp/combine_sgmm2_4a_3b_fmmic5/decode
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_10
%WER 10.30 [ 460 / 4466, 52 ins, 100 del, 308 sub ]
%SER 39.00 [ 195 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_11
%WER 10.19 [ 455 / 4466, 48 ins, 110 del, 297 sub ]
%SER 39.00 [ 195 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_12
%WER 10.03 [ 448 / 4466, 45 ins, 115 del, 288 sub ]
%SER 38.60 [ 193 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_13
%WER 10.23 [ 457 / 4466, 44 ins, 125 del, 288 sub ]
%SER 39.00 [ 195 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_14
%WER 10.12 [ 452 / 4466, 44 ins, 127 del, 281 sub ]
%SER 38.60 [ 193 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_15
%WER 10.01 [ 447 / 4466, 42 ins, 128 del, 277 sub ]
%SER 39.20 [ 196 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_16
%WER 9.94 [ 444 / 4466, 39 ins, 131 del, 274 sub ]
%SER 39.00 [ 195 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_17
%WER 9.99 [ 446 / 4466, 38 ins, 137 del, 271 sub ]
%SER 39.40 [ 197 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_7
%WER 11.60 [ 518 / 4466, 69 ins, 90 del, 359 sub ]
%SER 44.00 [ 220 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_8
%WER 11.11 [ 496 / 4466, 63 ins, 95 del, 338 sub ]
%SER 41.40 [ 207 / 500 ]
exp/combine_sgmm2_4a_3b_fmmic5/decode/wer_9
%WER 10.70 [ 478 / 4466, 55 ins, 98 del, 325 sub ]
%SER 39.80 [ 199 / 500 ]
steps/decode_combine.sh data/test data/lang exp/sgmm2_4a_mmi_b0.15/decode_it4 exp/tri3b_fmmi_c/decode_it5 exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_10
%WER 9.27 [ 414 / 4466, 53 ins, 87 del, 274 sub ]
%SER 36.20 [ 181 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_11
%WER 8.91 [ 398 / 4466, 47 ins, 94 del, 257 sub ]
%SER 35.60 [ 178 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_12
%WER 8.82 [ 394 / 4466, 46 ins, 97 del, 251 sub ]
%SER 35.00 [ 175 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_13
%WER 8.82 [ 394 / 4466, 46 ins, 98 del, 250 sub ]
%SER 35.00 [ 175 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_14
%WER 8.89 [ 397 / 4466, 42 ins, 105 del, 250 sub ]
%SER 35.20 [ 176 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_15
%WER 9.02 [ 403 / 4466, 42 ins, 111 del, 250 sub ]
%SER 35.60 [ 178 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_16
%WER 9.09 [ 406 / 4466, 41 ins, 115 del, 250 sub ]
%SER 35.20 [ 176 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_17
%WER 9.14 [ 408 / 4466, 41 ins, 118 del, 249 sub ]
%SER 35.40 [ 177 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_7
%WER 10.17 [ 454 / 4466, 63 ins, 78 del, 313 sub ]
%SER 39.00 [ 195 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_8
%WER 9.90 [ 442 / 4466, 60 ins, 83 del, 299 sub ]
%SER 38.20 [ 191 / 500 ]
exp/combine_sgmm2_4a_mmi_3b_fmmic5/decode/wer_9
%WER 9.74 [ 435 / 4466, 57 ins, 85 del, 293 sub ]
%SER 38.00 [ 190 / 500 ]
[wrist@wrist-pro 21:56:35] >                                                             [~/work/asr/kaldi/egs/voxforge/s5 (git)-[master]-]
# * Finished at 8/8(Wed)
```

## 今後 ##

* 具体的な処理の追跡・調査
* リアルタイム認識方法の調査
* AWSのcfnclusterを用いた並列学習
* DNN学習レシピの調査
* 他コーパスレシピの調査
    * librispeech, tediumなど
* 各種コーパスのまとめ
