# Linux 4. シェルスクリプトとワンライナー

[← 前: ログの場所と見方](03-logs.md) | [目次](../index.md) | [次: 標準入力・標準出力・標準エラー出力とリダイレクト →](05-stdio-redirect.md)

---

> **bash** を対象にします。多くの Linux ディストリビューションで、対話用の標準シェルになっています。`sh`（Debian / Ubuntu では dash）では使えない書き方には注記を付けています。

## 4.1 スクリプトの基本

```bash
#!/usr/bin/env bash
# ↑ 1行目（シバン）：どのプログラムで実行するかを指定する

set -euo pipefail   # エラーで止める設定（4.10 を参照）

echo "Hello, World"
```

```bash
chmod +x hello.sh     # 実行権限を付ける
./hello.sh            # 実行
bash hello.sh         # 実行権限がなくても、bash に渡せば実行できる
bash -n hello.sh      # 文法チェックだけ（実行しない）
bash -x hello.sh      # 実行するコマンドを 1 行ずつ表示（デバッグ用）
```

## 4.2 変数

```bash
name="Taro"           # = の前後に空白を入れない（入れるとコマンドとして解釈される）
echo "$name"          # Taro
echo "${name}さん"     # Taroさん（変数名の区切りを {} で明示）

readonly MAX=10       # 変更できない変数
unset name            # 変数を削除

today=$(date +%F)     # コマンドの実行結果を代入（コマンド置換）
echo "今日は $today"
```

### 引用符（クォート）の違い

| 書き方 | 変数の展開 | 例 | 結果 |
|-------|----------|----|------|
| `"..."` | される | `echo "$HOME"` | `/home/taro` |
| `'...'` | されない | `echo '$HOME'` | `$HOME` |
| クォートなし | される＋**空白で分割・`*` が展開される** | `echo $var` | 予期しない結果になりやすい |

!!! warning "変数は基本的に `\"$var\"` と書く"
    クォートしないと、値に空白や `*` が含まれていたときに、複数の引数に分かれたりファイル名に展開されたりします。

    ```bash
    file="my report.txt"
    rm $file       # NG："my" と "report.txt" の 2 つのファイルを消そうとする
    rm "$file"     # OK
    ```

### 特殊な変数

| 変数 | 内容 |
|------|------|
| `$0` | スクリプトの名前 |
| `$1` 〜 `$9`、`${10}` | 1 番目〜の引数 |
| `$#` | 引数の数 |
| `"$@"` | すべての引数（1 つずつ別々に扱う） |
| `$?` | 直前のコマンドの終了ステータス（0 が成功） |
| `$$` | このシェルのプロセス ID |
| `$!` | 最後にバックグラウンドで起動したプロセスの ID |

### 変数の加工（パラメータ展開）

```bash
path="/var/log/app/error.log"
echo "${path##*/}"        # error.log（最後の / より後ろ）
echo "${path%/*}"         # /var/log/app（最後の / より前）
echo "${path%.log}.bak"   # /var/log/app/error.bak（末尾の .log を置き換え）
echo "${#path}"           # 22（文字数）

echo "${user:-guest}"     # user が空か未定義なら guest
: "${PORT:=8080}"         # PORT が空か未定義なら 8080 を代入
echo "${name/Taro/Hanako}"   # 最初の Taro を Hanako に置換（bash）
```

## 4.3 条件分岐

```bash
if [[ -f "$file" ]]; then
    echo "ファイルがあります"
elif [[ -d "$file" ]]; then
    echo "ディレクトリです"
else
    echo "ありません"
fi
```

> `[[ ]]` は bash の書き方です。`sh` では `[ ]`（`test` コマンド）を使います。`[[ ]]` のほうが、変数をクォートし忘れたときの事故が少なく、`&&` や `=~`（正規表現）も使えます。

### よく使う条件

| 書き方 | 意味 |
|-------|------|
| `-e path` | 存在する |
| `-f path` / `-d path` | 通常のファイル / ディレクトリ |
| `-r` / `-w` / `-x path` | 読める / 書ける / 実行できる |
| `-s path` | サイズが 0 より大きい |
| `-z "$s"` / `-n "$s"` | 文字列が空 / 空ではない |
| `"$a" == "$b"` / `"$a" != "$b"` | 文字列が等しい / 等しくない |
| `$a -eq $b`、`-ne`、`-lt`、`-le`、`-gt`、`-ge` | **数値** の比較 |
| `"$s" =~ ^[0-9]+$` | 正規表現に一致（`[[ ]]` の中だけ） |

!!! warning "数値の比較に `<` `>` を使わない"
    `[[ 10 < 9 ]]` は **文字列** として比べるので真になります。数値は `-lt` を使うか、`(( 10 < 9 ))` と書きます。

### case

```bash
case "$1" in
    start)        echo "開始" ;;
    stop|quit)    echo "停止" ;;
    *.txt)        echo "テキストファイル" ;;
    *)            echo "使い方: $0 {start|stop}" ;;
esac
```

## 4.4 ループ

```bash
for i in 1 2 3; do echo "$i"; done

for i in {1..5}; do echo "$i"; done        # 1〜5（bash）

for (( i = 0; i < 3; i++ )); do echo "$i"; done   # C 言語風（bash）

for f in *.log; do                          # ファイルを順に処理
    [[ -e "$f" ]] || continue               # 一致するファイルがないときの対策
    echo "処理: $f"
done

count=0
while (( count < 3 )); do
    (( count++ ))
done

# ファイルを 1 行ずつ読む（定番の書き方）
while IFS= read -r line; do
    echo "行: $line"
done < input.txt
```

> `IFS=` は行頭と行末の空白を残すため、`-r` は `\` をそのまま読むために付けます。

## 4.5 計算

```bash
a=7; b=3
echo $(( a + b ))     # 10
echo $(( a / b ))     # 2（整数の割り算。小数は切り捨て）
echo $(( a % b ))     # 1
echo $(( 2 ** 10 ))   # 1024
(( a++ ))             # a を 1 増やす
echo "scale=2; 7 / 3" | bc    # 2.33（小数の計算は bc や awk を使う）
```

## 4.6 関数

```bash
greet() {
    local name="${1:-World}"     # local：関数の中だけの変数
    echo "Hello, $name"
}

greet "Taro"          # Hello, Taro
result=$(greet)       # 出力を受け取る
echo "$result"        # Hello, World

is_number() {
    [[ "$1" =~ ^[0-9]+$ ]]       # 最後のコマンドの結果が関数の戻り値になる
}
if is_number "42"; then echo "数値です"; fi
```

- `return` で返せるのは 0〜255 の終了ステータスだけです。文字列や大きな数は `echo` で出力して、`$(...)` で受け取ります。

## 4.7 配列（bash）

```bash
fruits=("apple" "banana" "cherry")
echo "${fruits[0]}"         # apple
echo "${#fruits[@]}"        # 3（要素数）
fruits+=("grape")           # 追加
for f in "${fruits[@]}"; do echo "$f"; done

declare -A ages             # 連想配列（bash 4〜）
ages[taro]=20
ages[hanako]=22
for k in "${!ages[@]}"; do echo "$k: ${ages[$k]}"; done
```

## 4.8 入出力とリダイレクト

> 標準入力・標準出力・標準エラー出力の仕組みと、リダイレクトの詳しい説明は [5章](05-stdio-redirect.md) にまとめています。

| 書き方 | 意味 |
|-------|------|
| `cmd > file` | 標準出力をファイルに書く（上書き） |
| `cmd >> file` | 追記 |
| `cmd 2> file` | エラー出力をファイルに書く |
| `cmd > file 2>&1` | 標準出力とエラー出力の両方をファイルに書く |
| `cmd &> file` | 上と同じ（bash） |
| `cmd > /dev/null 2>&1` | 出力をすべて捨てる |
| `cmd < file` | ファイルを標準入力にする |
| `cmd1 | cmd2` | cmd1 の出力を cmd2 の入力にする（パイプ） |
| `cmd | tee file` | 画面に表示しながらファイルにも書く |

!!! warning "`2>&1` の位置"
    `cmd 2>&1 > file` と書くと、エラー出力は画面に出たままになります。リダイレクトは左から順に処理されるため、`> file` を先に書きます。

```bash
# ヒアドキュメント：複数行をコマンドに渡す
cat <<EOF > config.txt
user=$USER
date=$(date +%F)
EOF

cat <<'EOF'            # 'EOF' と書くと、変数を展開しない
$HOME はそのまま出力される
EOF
```

## 4.9 コマンドの連結

| 書き方 | 意味 |
|-------|------|
| `cmd1 ; cmd2` | cmd1 の結果に関係なく cmd2 を実行 |
| `cmd1 && cmd2` | cmd1 が **成功したら** cmd2 を実行 |
| `cmd1 || cmd2` | cmd1 が **失敗したら** cmd2 を実行 |
| `cmd &` | バックグラウンドで実行 |
| `( cmd1; cmd2 )` | サブシェルで実行（中での `cd` や変数の変更は外に影響しない） |
| `{ cmd1; cmd2; }` | 今のシェルでまとめて実行（`}` の前に `;` が必要） |

```bash
mkdir -p backup && cp data.txt backup/    # mkdir が成功したときだけコピー
cd /tmp/work || exit 1                     # cd に失敗したら終了
```

## 4.10 安全なスクリプトのための設定

```bash
#!/usr/bin/env bash
set -euo pipefail
```

| 設定 | 効果 |
|------|------|
| `set -e` | コマンドが失敗したらスクリプトを止める |
| `set -u` | 未定義の変数を使ったらエラーにする |
| `set -o pipefail` | パイプの途中のコマンドが失敗したら、パイプ全体を失敗とみなす |
| `set -x` | 実行するコマンドを表示する（デバッグ用） |

!!! note "set -e の限界"
    `set -e` は、`if` や `while` の条件、`&&` / `||` の途中（最後のコマンド以外）、`!` を付けたコマンドの中では、失敗しても止まりません（bash マニュアル）。
    また、`local var=$(cmd)` のように書くと、`cmd` が失敗しても `local` が成功するため止まりません。大事な処理は、`|| { echo "失敗"; exit 1; }` のように明示的に確認します。

### 一時ファイルと後片付け

```bash
tmp=$(mktemp)                    # 推測されにくい名前で一時ファイルを作る
trap 'rm -f "$tmp"' EXIT         # スクリプトが終わるとき（エラーでも）必ず消す

sort input.txt > "$tmp"
mv "$tmp" sorted.txt
```

> `/tmp/myscript.tmp` のような決まった名前の一時ファイルは、ほかのユーザーに先回りして作られる危険があります。`mktemp` を使います。

### 引数のチェック

```bash
if (( $# < 1 )); then
    echo "使い方: $0 <ファイル>" >&2     # エラーメッセージは標準エラー出力へ
    exit 1
fi

# オプションの解析
verbose=0
while getopts "vo:" opt; do
    case "$opt" in
        v) verbose=1 ;;
        o) output="$OPTARG" ;;
        *) echo "不明なオプション" >&2; exit 1 ;;
    esac
done
shift $((OPTIND - 1))           # 処理したオプションを取り除く
```

## 4.11 応用例

### ログからエラーの件数を日付ごとに数える

```bash
#!/usr/bin/env bash
set -euo pipefail

log="${1:?ログファイルを指定してください}"   # 引数がなければメッセージを出して終了

grep -i "error" "$log" |
    awk '{ print $1 }' |      # 1 列目（日付）だけ取り出す
    sort |
    uniq -c |                 # 同じ日付の行数を数える
    sort -rn                  # 多い順
```

### 古いファイルを圧縮してから削除する

```bash
#!/usr/bin/env bash
set -euo pipefail

dir="/var/log/myapp"
days=30

# 30日より古い .log を圧縮（-print0 と xargs -0 で、空白を含む名前にも対応）
find "$dir" -name '*.log' -type f -mtime +"$days" -print0 |
    xargs -0 -r gzip

# 90日より古い .gz を削除（まず -print で対象を確認してから -delete を付ける）
find "$dir" -name '*.gz' -type f -mtime +90 -print
# find "$dir" -name '*.gz' -type f -mtime +90 -delete
```

### 複数のサーバーに順番に処理する

```bash
#!/usr/bin/env bash
set -euo pipefail

while IFS= read -r host; do
    [[ -z "$host" || "$host" == \#* ]] && continue     # 空行と # で始まる行は飛ばす
    echo "== $host =="
    ssh -n -o ConnectTimeout=5 "$host" 'uptime' || echo "接続失敗: $host" >&2
done < hosts.txt
```

> `ssh` は標準入力を読んでしまうため、`while read` のループの中では `-n` を付けます。付けないと、2 台目以降が処理されません。

## 4.12 ワンライナーを作るときの注意

### よく使う組み合わせ

```bash
# アクセスの多い IP アドレス上位 10 件
awk '{ print $1 }' access.log | sort | uniq -c | sort -rn | head -10

# 拡張子ごとのファイル数
find . -type f | sed -n 's/.*\.//p' | sort | uniq -c | sort -rn

# 大きいファイル上位 10 件
find / -xdev -type f -size +100M -exec ls -lh {} + 2>/dev/null | sort -k5 -rh | head

# CSV の 3 列目の合計
awk -F, 'NR > 1 { sum += $3 } END { print sum }' data.csv

# 複数のファイルの文字列をまとめて置換（-i.bak で元のファイルを残す）
sed -i.bak 's/old/new/g' *.conf
```

### 注意事項

| 注意点 | NG | OK | 理由 |
|-------|----|----|------|
| ファイル名の空白 | `find . -name '*.txt' | xargs rm` | `find . -name '*.txt' -print0 | xargs -0 rm` | 空白や改行を含むファイル名が分割される |
| `ls` の結果を処理する | `for f in $(ls *.txt)` | `for f in *.txt` | `ls` の出力は分割されやすく、処理用ではない |
| 同じファイルに書き戻す | `sort file > file` | `sort file > tmp && mv tmp file`（`sort -o file file` も可） | `>` が先にファイルを空にしてしまい、中身が消える |
| 無駄な `cat` | `cat file | grep x` | `grep x file` | プロセスが 1 つ増えるだけ（動作は同じ） |
| パイプの失敗を見逃す | `cmd1 | cmd2`（`$?` は cmd2 の結果） | `set -o pipefail` か `${PIPESTATUS[@]}` を確認 | 途中のコマンドの失敗が分からない |
| 削除・上書きを一発で実行する | `find ... -delete` をいきなり実行 | まず `-print` や `echo` で対象を確認してから実行 | 条件の間違いで大量のファイルを消してしまう |
| `rm -rf` に変数を使う | `rm -rf "$dir/"*` | `rm -rf "${dir:?}/"*` | `$dir` が空だと `/` 以下を消そうとする。`:?` で空なら止める |
| `grep` の正規表現 | `grep 1.2.3.4 log` | `grep -F 1.2.3.4 log` | `.` は「任意の 1 文字」なので `1x2y3z4` にも一致する |
| 大文字と小文字 | `grep error log` | `grep -i error log` | `Error` や `ERROR` を見落とす |
| ロケールによる違い | `sort` / `[a-z]` の結果が環境で変わる | `LC_ALL=C sort` | 並び順や文字の範囲がロケールで変わる |

!!! danger "ワンライナーで特に危険な操作"
    - `rm`、`mv`、`sed -i`、`find -delete`、`> file`（上書き）を含むときは、**先に対象だけを表示して確認** してから実行します。
    - `sudo` を付けたワンライナーは、間違えたときの被害が大きくなります。
    - インターネットのページからコピーしたワンライナーは、中身を理解してから実行します。特に `curl ... | bash` の形は、取得した内容をそのまま実行するので注意が必要です。

### 長くなったらスクリプトにする

ワンライナーが 3〜4 個のパイプを超えたり、同じものを何度も使ったりするようになったら、スクリプトファイルにして `set -euo pipefail`、コメント、引数のチェックを加えます。後から読み返したときに分かりやすく、間違いも減ります。

### チェックツール

```bash
shellcheck myscript.sh     # よくある間違い（クォート忘れなど）を指摘してくれる
```

`shellcheck` は、多くのディストリビューションでパッケージとして入れられます（例：`sudo apt install shellcheck`）。

## 参考資料

- [GNU Bash マニュアル](https://www.gnu.org/software/bash/manual/bash.html)
- [The Set Builtin（bash マニュアル）](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html) — `set -e` などの説明
- [ShellCheck](https://www.shellcheck.net/)
- [bash(1)](https://man7.org/linux/man-pages/man1/bash.1.html) / [find(1)](https://man7.org/linux/man-pages/man1/find.1.html) / [xargs(1)](https://man7.org/linux/man-pages/man1/xargs.1.html)
