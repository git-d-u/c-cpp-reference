# Linux 6. ログを見やすく加工する

[← 前: 標準入力・標準出力・標準エラー出力とリダイレクト](05-stdio-redirect.md) | [目次](../index.md)

---

> ログの場所と基本の見方は [3章](03-logs.md)、パイプとリダイレクトは [5章](05-stdio-redirect.md) を参照してください。
> 例の出力は、下の架空のログに対して bash で実際に実行した結果です。IP アドレスは例示用のアドレス（192.0.2.x、198.51.100.x、203.0.113.x）です。

## 6.1 例に使うログ

**access.log**（Web サーバーのアクセスログ。Apache / nginx の combined 形式）

```text
192.0.2.10 - - [10/Nov/2026:09:00:01 +0900] "GET /index.html HTTP/1.1" 200 5120 "-" "Mozilla/5.0"
198.51.100.7 - - [10/Nov/2026:09:00:05 +0900] "GET /login.php HTTP/1.1" 200 2048 "-" "curl/8.5.0"
198.51.100.7 - - [10/Nov/2026:09:00:06 +0900] "POST /login.php HTTP/1.1" 401 512 "-" "curl/8.5.0"
198.51.100.7 - - [10/Nov/2026:09:00:07 +0900] "POST /login.php HTTP/1.1" 401 512 "-" "curl/8.5.0"
203.0.113.5 - - [10/Nov/2026:09:01:10 +0900] "GET /admin/ HTTP/1.1" 403 256 "-" "Mozilla/5.0"
192.0.2.10 - - [10/Nov/2026:09:02:00 +0900] "GET /img/logo.png HTTP/1.1" 200 10240 "-" "Mozilla/5.0"
203.0.113.5 - - [10/Nov/2026:09:03:30 +0900] "GET /no-such-page HTTP/1.1" 404 128 "-" "Mozilla/5.0"
198.51.100.7 - - [10/Nov/2026:10:15:00 +0900] "POST /login.php HTTP/1.1" 200 1024 "-" "curl/8.5.0"
```

空白で区切ったときの列の番号（awk の `$1`、`$2` …）:

| 番号 | 中身 | 例 |
|------|------|----|
| `$1` | 接続元の IP アドレス | `198.51.100.7` |
| `$4` | 日時（`[` 付き） | `[10/Nov/2026:09:00:06` |
| `$6` | メソッド（`"` 付き） | `"POST` |
| `$7` | 要求されたパス | `/login.php` |
| `$9` | 状態コード | `401` |
| `$10` | 送ったバイト数 | `512` |

**auth.log**（認証のログ。Debian / Ubuntu 系の形式）

```text
Nov 10 09:00:01 web01 sshd[1201]: Failed password for invalid user admin from 198.51.100.7 port 50001 ssh2
Nov 10 09:00:03 web01 sshd[1203]: Failed password for root from 198.51.100.7 port 50002 ssh2
Nov 10 09:00:05 web01 sshd[1205]: Failed password for invalid user test from 203.0.113.5 port 50003 ssh2
Nov 10 09:00:09 web01 sshd[1209]: Failed password for root from 198.51.100.7 port 50004 ssh2
Nov 10 09:10:00 web01 sshd[1300]: Accepted publickey for taro from 192.0.2.10 port 50100 ssh2
Nov 10 09:12:00 web01 sudo:     taro : TTY=pts/0 ; PWD=/home/taro ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx
```

## 6.2 必要な行だけを取り出す（grep）

```bash
$ grep -c "Failed password" auth.log          # 一致した行の数
4
$ grep -i "accepted" auth.log                 # 大文字・小文字を区別しない
Nov 10 09:10:00 web01 sshd[1300]: Accepted publickey for taro from 192.0.2.10 port 50100 ssh2
$ grep -v "Failed" auth.log | wc -l           # 一致「しない」行
2
$ grep -B1 "Accepted" auth.log                # 一致した行の1行前も表示
Nov 10 09:00:09 web01 sshd[1209]: Failed password for root from 198.51.100.7 port 50004 ssh2
Nov 10 09:10:00 web01 sshd[1300]: Accepted publickey for taro from 192.0.2.10 port 50100 ssh2
```

| オプション | 意味 |
|-----------|------|
| `-i` | 大文字・小文字を区別しない |
| `-v` | 一致しない行を表示 |
| `-c` | 一致した行の数だけを表示 |
| `-n` | 行番号を付ける |
| `-A 数` / `-B 数` / `-C 数` | 一致した行の後 / 前 / 前後も表示 |
| `-E` | 拡張正規表現（`+`、`?`、`|`、`{ }` などをそのまま使える） |
| `-o` | 一致した部分だけを表示 |
| `-F` | 正規表現ではなく、ただの文字列として探す |
| `-r` | ディレクトリの中を再帰的に探す |
| `--color=auto` | 一致した部分に色を付ける |

!!! warning "`.` は「任意の1文字」"
    正規表現では `.` が任意の1文字を表すので、IP アドレスなどを探すと関係のない行まで一致します。

    ```bash
    $ grep "1.2" access.log | wc -l      # 正規表現として探す
    3
    $ grep -F "1.2" access.log | wc -l   # 文字列 "1.2" そのものを探す
    0
    ```

### 一致した部分だけを抜き出して数える

```bash
$ grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' auth.log | sort | uniq -c | sort -rn
      3 198.51.100.7
      1 203.0.113.5
      1 192.0.2.10
```

## 6.3 「集計」の定番：sort | uniq -c | sort -rn

```
取り出す ─▶ sort（同じ値を並べる）─▶ uniq -c（数える）─▶ sort -rn（多い順）─▶ head（上位だけ）
```

```bash
# 状態コードごとの件数
$ awk '{print $9}' access.log | sort | uniq -c | sort -rn
      4 200
      2 401
      1 404
      1 403

# アクセスの多い IP アドレス上位3件
$ awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -3
      4 198.51.100.7
      2 203.0.113.5
      2 192.0.2.10
```

!!! warning "uniq は「隣り合った」重複しかまとめない"
    `uniq` は連続した同じ行だけをまとめます。先に `sort` しないと、正しく数えられません。

    ```bash
    $ printf 'a\nb\na\n' | uniq | wc -l          # a が2回残る
    3
    $ printf 'a\nb\na\n' | sort | uniq | wc -l
    2
    ```

| コマンド | 意味 |
|---------|------|
| `sort` | 並べ替え（`-n` 数値として、`-r` 逆順、`-k 2` 2列目で、`-t ,` 区切り文字の指定） |
| `uniq -c` | 重複をまとめて、件数を前に付ける |
| `head -n 数` / `tail -n 数` | 先頭 / 末尾から指定した行数 |
| `wc -l` | 行数を数える |

## 6.4 列を取り出して整える（awk・cut・column）

### awk：列を選んで表示する

```bash
$ awk '{print $1, $9, $7}' access.log
192.0.2.10 200 /index.html
198.51.100.7 200 /login.php
198.51.100.7 401 /login.php
198.51.100.7 401 /login.php
203.0.113.5 403 /admin/
192.0.2.10 200 /img/logo.png
203.0.113.5 404 /no-such-page
198.51.100.7 200 /login.php
```

### 条件に合う行だけを表示する

```bash
# 状態コードが 400 以上（エラー）の行だけ
$ awk '$9 >= 400 {print $9, $1, $7}' access.log
401 198.51.100.7 /login.php
401 198.51.100.7 /login.php
403 203.0.113.5 /admin/
404 203.0.113.5 /no-such-page
```

### 合計を出す・時間帯ごとに数える

```bash
# 送ったバイト数の合計（END の中は最後に1回だけ実行される）
$ awk '{sum += $10} END {print sum " bytes"}' access.log
19840 bytes

# 時間帯ごとのアクセス数（$4 を : で分割して「時」を取り出す）
$ awk '{split($4, t, ":"); print t[2] "時"}' access.log | sort | uniq -c
      7 09時
      1 10時
```

### 列の幅をそろえて見やすくする

```bash
$ awk '{print $1, $9, $7}' access.log | column -t | head -4
192.0.2.10    200  /index.html
198.51.100.7  200  /login.php
198.51.100.7  401  /login.php
198.51.100.7  401  /login.php

$ awk '{printf "%-15s %3s %s\n", $1, $9, $7}' access.log | head -3   # 幅を指定して整形
192.0.2.10      200 /index.html
198.51.100.7    200 /login.php
198.51.100.7    401 /login.php
```

### cut：区切り文字で列を切り出す

```bash
$ cut -d' ' -f1,9 access.log | head -3     # 空白区切りの1列目と9列目
192.0.2.10 200
198.51.100.7 200
198.51.100.7 401
```

> `cut` は区切り文字が1文字ずつ並んでいる前提です。空白が連続するログ（auth.log の `sudo:     taro` など）では列がずれるので、その場合は `awk` を使います。

| awk の書き方 | 意味 |
|-------------|------|
| `$1`、`$2` … | 1列目、2列目 … |
| `$0` | 行全体 |
| `NF` / `$NF` | 列の数 / 最後の列 |
| `NR` | 何行目か |
| `-F ':'` | 区切り文字を `:` にする（既定は空白とタブ） |
| `条件 {処理}` | 条件に合う行だけ処理する（`/文字列/` で正規表現にも一致できる） |
| `BEGIN {…}` / `END {…}` | 最初に1回 / 最後に1回 |

## 6.5 ログイン失敗を「誰が・どこから」に整理する

```bash
# "from" の次の列（IP）と前の列（ユーザー名）を取り出して数える
$ awk '/Failed password/ {for (i = 1; i <= NF; i++) if ($i == "from") print $(i+1), $(i-1)}' auth.log \
    | sort | uniq -c | sort -rn
      2 198.51.100.7 root
      1 203.0.113.5 test
      1 198.51.100.7 admin
```

`invalid user admin` のように語の数が変わる行でも、「`from` の前後」を基準にすると正しく取り出せます。

```bash
# sed で必要な部分だけを残す（-n と p で、置き換えができた行だけを表示）
$ sed -n 's/.*Failed password for \(invalid user \)\{0,1\}\([^ ]*\) from \([^ ]*\).*/\3 \2/p' auth.log
198.51.100.7 admin
198.51.100.7 root
203.0.113.5 test
198.51.100.7 root

# grep -P の \K：それより前を出力しない（Perl 互換の正規表現。使えない環境もある）
$ grep -oP 'COMMAND=\K.*' auth.log
/usr/bin/systemctl restart nginx
```

## 6.6 時刻で絞り込む

```bash
# 3列目（時刻）が範囲内の行（同じ形式の文字列どうしなら、大小比較で絞り込める）
$ awk '$3 >= "09:00:03" && $3 <= "09:00:09"' auth.log
Nov 10 09:00:03 web01 sshd[1203]: Failed password for root from 198.51.100.7 port 50002 ssh2
Nov 10 09:00:05 web01 sshd[1205]: Failed password for invalid user test from 203.0.113.5 port 50003 ssh2
Nov 10 09:00:09 web01 sshd[1209]: Failed password for root from 198.51.100.7 port 50004 ssh2
```

> この方法は、同じ日のログの中で使います。日付をまたぐ場合や、月の名前（`Nov`）で比較したい場合は、journald なら `journalctl --since` / `--until` を使うほうが確実です（6.8）。

## 6.7 リアルタイムで見る・古いログを見る

```bash
tail -f /var/log/auth.log                                  # 追記を表示し続ける（Ctrl+C で終了）
tail -f /var/log/auth.log | grep --line-buffered "Failed"  # 流れてくる行を絞り込む
less +F /var/log/syslog                                    # less で追いかける（Ctrl+C で止めて、F で再開）
less -S /var/log/nginx/access.log                          # 長い行を折り返さない（← → で横に動く）
```

> `tail -f | grep` の後ろにさらにパイプをつなぐ場合、`grep` は出力をためてしまうことがあるため、`--line-buffered` を付けて1行ずつ出させます。

ローテーションで圧縮された古いログは、展開せずに読めます。

```bash
$ zgrep -c "Failed" auth.log.2.gz      # 圧縮ファイルのまま grep
4
$ zcat auth.log.2.gz | head -1         # 圧縮ファイルのまま表示
Nov 10 09:00:01 web01 sshd[1201]: Failed password for invalid user admin from 198.51.100.7 port 50001 ssh2
```

```bash
# 現在のログと古いログをまとめて集計する
zcat -f /var/log/auth.log* | grep "Failed password" | wc -l     # -f で圧縮されていないファイルも読める
```

## 6.8 journalctl の出力を整える

```bash
journalctl -u ssh --since "2026-11-10 09:00" --until "2026-11-10 10:00"   # 期間で絞る
journalctl -p err -b                  # 今回の起動以降の err 以上
journalctl -u nginx -n 50 --no-pager  # 最新50件をページャーなしで（パイプやファイルに渡すとき）
journalctl -u ssh -o cat              # メッセージ部分だけ（日時やホスト名を省く）
journalctl -u ssh -o verbose -n 1     # 1件の全項目を詳しく
journalctl -u ssh -o json -n 1        # JSON 形式（ほかのツールで加工しやすい）
```

```bash
# JSON の加工には jq を使う（別途インストールが必要）
journalctl -u ssh -o json --since today | jq -r '.MESSAGE'
```

| `-o` の値 | 形式 |
|-----------|------|
| `short` | 既定。syslog と同じような1行の形式 |
| `cat` | メッセージだけ |
| `verbose` | すべての項目 |
| `json` | 1件を1行の JSON で |

## 6.9 結果をファイルに保存して報告に使う

```bash
# 集計結果を CSV にする（Excel などで開ける）
awk '{print $1}' access.log | sort | uniq -c | sort -rn \
  | awk 'BEGIN {print "count,ip"} {print $1 "," $2}' > ip_count.csv

# 調査のときは、元のログを残したまま、作業用のコピーで加工する
cp /var/log/auth.log ~/work/auth.log.$(date +%Y%m%d)
```

!!! warning "調査中のログを直接書き換えない"
    `sed -i` などでログファイルそのものを書き換えると、証拠として使えなくなります。加工はパイプでつなぐか、コピーに対して行います（[3章 3.8](03-logs.md)）。

## 6.10 よく使う組み合わせ

| やりたいこと | コマンド |
|------------|---------|
| ログイン失敗の多い IP | `grep "Failed password" auth.log | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | sort | uniq -c | sort -rn | head` |
| 状態コードの集計 | `awk '{print $9}' access.log | sort | uniq -c | sort -rn` |
| エラー（4xx・5xx）だけ | `awk '$9 >= 400' access.log` |
| アクセスの多いページ | `awk '{print $7}' access.log | sort | uniq -c | sort -rn | head` |
| 時間帯ごとの件数 | `awk '{split($4, t, ":"); print t[2]}' access.log | sort | uniq -c` |
| 見やすく整列 | `… | column -t` |
| 流れてくるログを絞る | `tail -f auth.log | grep --line-buffered "Failed"` |
| 圧縮ログも含めて検索 | `zgrep "Failed" /var/log/auth.log*` |

## 参考資料

- [grep(1)](https://man7.org/linux/man-pages/man1/grep.1.html) / [sort(1)](https://man7.org/linux/man-pages/man1/sort.1.html) / [uniq(1)](https://man7.org/linux/man-pages/man1/uniq.1.html) / [cut(1)](https://man7.org/linux/man-pages/man1/cut.1.html)
- [GNU Awk ユーザーズガイド](https://www.gnu.org/software/gawk/manual/)
- [journalctl(1)](https://man7.org/linux/man-pages/man1/journalctl.1.html)
