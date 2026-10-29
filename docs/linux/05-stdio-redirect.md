# Linux 5. 標準入力・標準出力・標準エラー出力とリダイレクト

[← 前: シェルスクリプトとワンライナー](04-shell-script.md) | [目次](../index.md)

---

> 例は bash で動かした実際の出力です（`$` で始まる行が入力したコマンド）。`ls` のエラーメッセージの文言は環境によって少し違います。

## 5.1 3つの「出入口」

Linux のプログラムは、起動したときから **3つの出入口** を持っています。それぞれに **ファイル記述子**（file descriptor）という番号が付いています。

| 番号 | 名前 | 略称 | 既定のつながり先 | 使い道 |
|------|------|------|----------------|--------|
| **0** | 標準入力 | stdin | キーボード | プログラムが読み込むデータ |
| **1** | 標準出力 | stdout | 画面（端末） | プログラムの **結果** |
| **2** | 標準エラー出力 | stderr | 画面（端末） | **エラーメッセージ** や警告 |

```
                   ┌──────────────┐
  キーボード ──0──▶│              │──1──▶ 画面（結果）
  （標準入力）      │  プログラム    │
                   │              │──2──▶ 画面（エラー）
                   └──────────────┘
```

何もしなければ、標準出力と標準エラー出力はどちらも画面に出るので、区別が付きません。**リダイレクト** を使うと、それぞれの行き先を別々に変えられます。

### なぜ出力とエラーが分かれているのか

結果だけをファイルや次のコマンドに渡し、エラーは画面に残して人間が気づけるようにするためです。

```bash
$ ls exists.txt nofile
ls: cannot access 'nofile': No such file or directory   ← 標準エラー出力
exists.txt                                               ← 標準出力
```

`exists.txt` はあり、`nofile` はない状態です。この2行が、それぞれ別の出入口から出ています。以降の例でも、このコマンドを使います。

## 5.2 出力の行き先を変える

### 標準出力だけをファイルへ（`>`）

```bash
$ ls exists.txt nofile > out.txt
ls: cannot access 'nofile': No such file or directory   ← エラーは画面に残る
$ cat out.txt
exists.txt                                               ← 結果だけがファイルに入った
```

`>` は `1>` の省略形です（番号を書かなければ 1 番）。

### 標準エラー出力だけをファイルへ（`2>`）

```bash
$ ls exists.txt nofile 2> err.txt
exists.txt                                               ← 結果は画面に出る
$ cat err.txt
ls: cannot access 'nofile': No such file or directory   ← エラーだけがファイルに入った
```

### 両方を同じファイルへ（`> file 2>&1`）

```bash
$ ls exists.txt nofile > all.txt 2>&1
$ cat all.txt
ls: cannot access 'nofile': No such file or directory
exists.txt
```

`2>&1` は「**2番（エラー）の行き先を、1番（出力）と同じにする**」という意味です。`&1` の `&` は「ファイル名の 1 ではなく、ファイル記述子の 1」という印です。

bash では `&> all.txt` と書いても同じ意味になります（`> all.txt 2>&1` と同等。bash のマニュアルでは `&>` の形を推奨）。

!!! note "ファイルの中の順番が、実行の順番と違うことがある"
    上の例では、エラーのほうが先に書かれています。標準エラー出力はためずに（バッファリングせずに）すぐ書き出されますが、標準出力は、ファイルやパイプに向いているときは、ある程度ためてからまとめて書き出されることがあるためです。

### 書く順番で結果が変わる（`2>&1` の位置）

リダイレクトは **左から順に** 処理されます。

```bash
$ ls exists.txt nofile 2>&1 > only.txt
ls: cannot access 'nofile': No such file or directory   ← エラーは画面に出てしまう
$ cat only.txt
exists.txt
```

```
正しい：  cmd > file 2>&1
  ① > file  … 1番の行き先を file にする            1 → file
  ② 2>&1    … 2番を「今の1番の行き先」にする       2 → file   ✓ 両方 file へ

逆の順番：cmd 2>&1 > file
  ① 2>&1    … 2番を「今の1番の行き先（画面）」にする 2 → 画面
  ② > file  … 1番の行き先を file にする            1 → file   ✗ エラーは画面のまま
```

`2>&1` は「1番と **ずっと** 同じにする」のではなく、「**その時点の** 1番の行き先をコピーする」という動きです。

### 追記（`>>`）と上書き防止

```bash
cmd >> log.txt          # 末尾に追記する（> は中身を消して上書き）
cmd >> log.txt 2>&1     # 出力もエラーも追記する
```

`>` は、すでにあるファイルの中身を **確認なしに消して** 上書きします。誤って大事なファイルを消さないように、上書きを禁止する設定があります。

```bash
$ set -o noclobber             # 上書き禁止を有効にする
$ echo a > exists.txt
bash: exists.txt: cannot overwrite existing file
$ echo b >| exists.txt         # >| なら、禁止を無視して上書きできる
$ set +o noclobber             # 元に戻す
```

### 出力を捨てる（`/dev/null`）

`/dev/null` は、書き込んだものをすべて捨てる特殊なファイルです。

```bash
cmd > /dev/null          # 結果を捨てる（エラーは画面に出る）
cmd 2> /dev/null         # エラーを捨てる（結果は画面に出る）
cmd > /dev/null 2>&1     # 両方捨てる
```

```bash
# 例：権限のないディレクトリで出る「Permission denied」を捨てて、結果だけ見る
find / -name "*.conf" 2>/dev/null
```

!!! warning "エラーを捨てると、失敗に気づけない"
    `2>/dev/null` は、エラーが出るのが分かっていて不要なときだけ使います。スクリプトでむやみに使うと、本当の失敗を見逃します。

## 5.3 入力の元を変える

### ファイルを標準入力にする（`<`）

```bash
$ wc -l < exists.txt     # ファイルの中身を標準入力として wc に渡す
```

`wc -l exists.txt`（ファイル名を引数で渡す）と結果の数は同じですが、`<` の場合、`wc` はファイル名を知らないので、数字だけが表示されます。

### 標準入力を1行ずつ読む

```bash
$ printf '1\n2\n3\n' | while read -r n; do echo "読んだ: $n"; done
読んだ: 1
読んだ: 2
読んだ: 3
```

```bash
# ファイルを1行ずつ処理する定番の形
while read -r line; do
  echo "$line"
done < input.txt
```

### ヒアドキュメント（`<<`）：複数行を渡す

```bash
cat <<EOF > config.txt
user=$USER
date=$(date +%F)
EOF
```

| 書き方 | 動き |
|-------|------|
| `<<EOF` | 中の変数やコマンド（`$USER`、`$(…)`）が展開される |
| `<<'EOF'` | 区切りの文字を引用符で囲むと、展開されずにそのまま渡される |
| `<<-EOF` | 各行の先頭の **タブ** が取り除かれる（スクリプトの字下げ用。空白は取り除かれない） |

### ヒアストリング（`<<<`）：1つの文字列を渡す

```bash
$ tr a-z A-Z <<< "hello world"
HELLO WORLD
$ wc -w <<< "one two three"
3
```

`echo "…" | cmd` と同じような使い方ができます（末尾に改行が1つ付いて渡されます）。

## 5.4 パイプ（`|`）

パイプは、前のコマンドの **標準出力** を、次のコマンドの **標準入力** につなぎます。

```
  cmd1 ──1(標準出力)──▶ ｜パイプ｜ ──0(標準入力)──▶ cmd2
       ──2(エラー)──▶ 画面        （パイプには流れない）
```

```bash
$ ls exists.txt nofile | wc -l
ls: cannot access 'nofile': No such file or directory   ← エラーはパイプに入らず画面へ
1                                                        ← wc が数えたのは標準出力の1行だけ
```

### エラーもパイプに流す

```bash
$ ls exists.txt nofile 2>&1 | wc -l
2
$ ls exists.txt nofile |& wc -l        # bash では |& が「2>&1 |」の省略形
2
```

### エラーだけを捨ててパイプする

```bash
$ ls exists.txt nofile 2>/dev/null | wc -l
1
```

### 画面に出しながらファイルにも残す（`tee`）

```bash
$ echo "log line" | tee t.txt          # 画面に表示し、t.txt にも書く
log line
$ echo "again" | tee -a t.txt > /dev/null   # -a で追記。画面には出さない
$ cat t.txt
log line
again
```

```bash
# 管理者権限が必要なファイルに書き込む定番の形
echo "127.0.0.1 test.local" | sudo tee -a /etc/hosts
```

> `sudo echo "…" >> /etc/hosts` は失敗します。`>>` の処理（ファイルを開くこと）は、`sudo` ではなく今のシェル（一般ユーザーの権限）が行うためです。`sudo tee` を使えば、ファイルを開くのが `tee`（管理者権限で動く）になります。

## 5.5 終了ステータス：成功・失敗の判定

標準エラー出力とは別に、コマンドは終わるときに **終了ステータス**（0〜255 の数値）を返します。

| 値 | 意味 |
|----|------|
| `0` | 成功 |
| `0` 以外 | 失敗（値の意味はコマンドごとに違う） |

```bash
$ ls nofile 2>/dev/null
$ echo $?            # 直前のコマンドの終了ステータス
2
$ ls exists.txt > /dev/null
$ echo $?
0
```

- エラーメッセージを `2>/dev/null` で捨てても、**終了ステータスは残ります**。スクリプトでは、メッセージではなく終了ステータスで成功・失敗を判定します。
- `if cmd; then …` や `cmd && 次の処理`、`cmd || エラー処理` は、この終了ステータスを見ています（[4章](04-shell-script.md)）。

### パイプの終了ステータス

```bash
$ false | true
$ echo "$? / ${PIPESTATUS[*]}"
0 / 1 0              # $? は最後のコマンドの結果だけ。PIPESTATUS には全部の結果が入る

$ set -o pipefail
$ false | true
$ echo $?
1                    # pipefail を有効にすると、途中の失敗もパイプ全体の失敗になる
```

## 5.6 スクリプトでの使い方

### エラーメッセージは標準エラー出力に出す

```bash
#!/bin/bash
err() {
  echo "エラー: $*" >&2      # >&2 で標準エラー出力へ（1>&2 の省略形）
}

if [[ ! -f "$1" ]]; then
  err "ファイルがありません: $1"
  exit 1                     # 失敗の終了ステータスを返す
fi
```

エラーを標準エラー出力に出しておくと、このスクリプトを使う人が `> result.txt` で結果だけをファイルに保存しても、エラーが結果に混ざりません。

### スクリプト全体の出力をまとめてログにする（`exec`）

```bash
#!/bin/bash
exec > /var/log/myscript.log 2>&1   # 以降の出力とエラーはすべてログファイルへ

echo "開始"
some_command
echo "終了"
```

```bash
# 画面にも出しながらログにも残す（bash のプロセス置換を使う）
exec > >(tee -a /var/log/myscript.log) 2>&1
```

### まとめてリダイレクトする（`{ }`）

```bash
$ { echo "1行目"; echo "2行目"; } > g.txt
$ cat g.txt
1行目
2行目
```

### ファイルを空にする

```bash
: > app.log          # 中身を空にする（ファイル自体は残る）
```

ログを書き込み中のプログラムがある場合、`rm` で消すと、プログラムは消えたファイルに書き続けてしまいます。中身だけを空にしたいときはこの書き方を使います。

## 5.7 プロセス置換（`<( )`）：コマンドの出力をファイルのように渡す

ファイル名しか受け付けないコマンドに、別のコマンドの出力を渡せます（bash の機能）。

```bash
$ printf 'a\nb\nc\n' > x.txt
$ printf 'a\nc\nd\n' > y.txt
$ diff <(sort x.txt) <(sort y.txt)    # 並べ替えた結果どうしを比べる
2d1
< b
3a3
> d
$ echo <(true)
/dev/fd/63                             # 実体は /dev/fd/番号 という特殊なファイル名
```

## 5.8 特殊なファイル

| ファイル | 内容 |
|---------|------|
| `/dev/null` | 書き込んだものを捨てる。読み込むと何もない（空） |
| `/dev/stdin` | 標準入力（ファイル記述子 0） |
| `/dev/stdout` | 標準出力（ファイル記述子 1） |
| `/dev/stderr` | 標準エラー出力（ファイル記述子 2） |
| `/dev/fd/番号` | その番号のファイル記述子 |

```bash
$ echo "from pipe" | cat /dev/stdin
from pipe
```

`-`（ハイフン）をファイル名として渡すと、標準入力・標準出力の意味になるコマンドも多くあります（例：`tar -czf - dir | ssh host "cat > backup.tgz"`）。

## 5.9 早見表

| 書き方 | 意味 |
|-------|------|
| `cmd > file` | 標準出力を file へ（上書き） |
| `cmd >> file` | 標準出力を file へ（追記） |
| `cmd 2> file` | 標準エラー出力を file へ |
| `cmd > file 2>&1` | 両方を file へ（**この順番で書く**） |
| `cmd &> file` | 両方を file へ（bash） |
| `cmd > /dev/null 2>&1` | 両方を捨てる |
| `cmd 2> /dev/null` | エラーだけを捨てる |
| `cmd < file` | file を標準入力にする |
| `cmd <<EOF` … `EOF` | 複数行を標準入力にする（ヒアドキュメント） |
| `cmd <<< "文字列"` | 文字列を標準入力にする（ヒアストリング） |
| `cmd1 | cmd2` | cmd1 の標準出力を cmd2 の標準入力へ |
| `cmd1 2>&1 | cmd2` | エラーも一緒にパイプへ（bash では `cmd1 |& cmd2`） |
| `cmd | tee file` | 画面に出しながら file にも書く（`-a` で追記） |
| `echo "…" >&2` | 標準エラー出力に出す |
| `cmd >| file` | noclobber を無視して上書き |
| `exec > file 2>&1` | 以降のスクリプト全体の出力を file へ |
| `$?` / `${PIPESTATUS[@]}` | 直前の終了ステータス / パイプの各コマンドの終了ステータス |

## 参考資料

- [bash(1) — REDIRECTION、Pipelines、Process Substitution](https://man7.org/linux/man-pages/man1/bash.1.html)
- [GNU Bash マニュアル：Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [stdin(3) — 標準入出力のストリーム](https://man7.org/linux/man-pages/man3/stdin.3.html)
