# Linux 3. ログの場所と見方

[← 前: セキュリティ上重要な場所](02-security.md) | [目次](../index.md) | [次: シェルスクリプトとワンライナー →](04-shell-script.md)

---

## 3.1 ログの仕組み

現在の主要なディストリビューションでは、ログは 2 か所に残ります。

| 仕組み | 保存先 | 形式 | 見方 |
|-------|-------|------|------|
| **systemd-journald** | `/var/log/journal/`（永続化している場合）または `/run/log/journal/`（メモリ上） | バイナリ | `journalctl` |
| **rsyslog**（入っている場合） | `/var/log/` 以下のテキストファイル | テキスト | `less`、`grep`、`tail` |

- journald がカーネルやサービスのログを集め、rsyslog が入っていればそれを種類ごとにテキストファイルへ書き出します。
- **Debian 12 以降は rsyslog が既定ではインストールされません。** そのため `/var/log/syslog` や `/var/log/auth.log` が無い場合があり、その場合は `journalctl` で見ます。

!!! note "journal が再起動後も残るか"
    journald の保存設定（`/etc/systemd/journald.conf` の `Storage=`）は、systemd のバージョンやディストリビューションによって既定値が違います。
    `journalctl --list-boots` で過去の起動が複数表示されれば、再起動しても残る設定になっています。

## 3.2 主なログファイルの場所

| 内容 | Debian / Ubuntu 系 | RHEL / Rocky / Alma / Fedora 系 |
|------|-------------------|-------------------------------|
| システム全般 | `/var/log/syslog` | `/var/log/messages` |
| **認証・sudo・SSH** | `/var/log/auth.log` | `/var/log/secure` |
| カーネル | `/var/log/kern.log` | `/var/log/messages` に含まれる |
| cron | `/var/log/syslog` に含まれる | `/var/log/cron` |
| メール | `/var/log/mail.log` | `/var/log/maillog` |
| 起動時 | `journalctl -b` | `/var/log/boot.log` |
| パッケージの操作 | `/var/log/apt/history.log`、`/var/log/dpkg.log` | `/var/log/dnf.log` |
| ログイン履歴（バイナリ） | `/var/log/wtmp` | `/var/log/wtmp` |
| ログイン失敗の履歴（バイナリ） | `/var/log/btmp` | `/var/log/btmp` |
| 監査ログ（auditd） | `/var/log/audit/audit.log` | `/var/log/audit/audit.log` |
| Web サーバー | `/var/log/apache2/`、`/var/log/nginx/` | `/var/log/httpd/`、`/var/log/nginx/` |

> 表のテキストファイルは rsyslog が書き出すものです。rsyslog が無い環境では、同じ内容を `journalctl` で見ます。auditd、Web サーバー、パッケージ管理のログは、各ソフトが直接書き込みます。

## 3.3 テキストのログを見る

```bash
sudo tail -f /var/log/auth.log           # 追記をリアルタイムで表示（Ctrl+C で終了）
sudo less +G /var/log/syslog             # 末尾から表示（/ で検索、q で終了）
sudo grep -i "error" /var/log/syslog     # 大文字小文字を区別せずに検索
sudo zgrep "Failed" /var/log/auth.log.*.gz   # 圧縮された古いログも検索
```

### 1行の読み方（syslog 形式）

```
Oct 12 10:15:32 web01 sshd[2345]: Accepted publickey for taro from 192.0.2.10 port 51234 ssh2: ED25519 SHA256:...
└──── 日時 ────┘ └ホスト┘ └プロセス[PID]┘ └──────────────── メッセージ ────────────────┘
```

> 環境によっては、日時が `2026-10-12T10:15:32.123456+09:00` のような ISO 8601 形式で記録されます。

## 3.4 journalctl の使い方

```bash
journalctl                        # 全ログ（古い順）
journalctl -r                     # 新しい順
journalctl -f                     # リアルタイムで表示
journalctl -n 100                 # 最新の 100 件
journalctl -b                     # 今回の起動以降
journalctl -b -1                  # 1回前の起動時
journalctl --list-boots           # 起動の一覧
journalctl -u ssh                 # ユニット（サービス）で絞り込み（RHEL 系は sshd）
journalctl -u nginx --since "2026-10-12 09:00" --until "2026-10-12 12:00"
journalctl --since "1 hour ago"   # 直近 1 時間
journalctl -p err                 # 優先度が err 以上（err, crit, alert, emerg）
journalctl -k                     # カーネルのログ（dmesg 相当）
journalctl -o json-pretty -n 1    # 1 件を詳しく（JSON 形式）
journalctl --disk-usage           # ログが使っているディスク容量
```

一般ユーザーは自分のログしか見られないことがあります。全体を見るには `sudo` を付けるか、`adm` や `systemd-journal` グループに所属している必要があります。

### 優先度（-p で指定）

| 数字 | 名前 | 意味 |
|------|------|------|
| 0 | `emerg` | システムが使えない |
| 1 | `alert` | すぐに対応が必要 |
| 2 | `crit` | 致命的 |
| 3 | `err` | エラー |
| 4 | `warning` | 警告 |
| 5 | `notice` | 通常だが重要 |
| 6 | `info` | 情報 |
| 7 | `debug` | デバッグ |

## 3.5 認証ログで見るべきメッセージ

`/var/log/auth.log`（Debian 系）、`/var/log/secure`（RHEL 系）、または `journalctl -u ssh` で確認します。

| メッセージの例 | 意味 | 注意すべき状況 |
|--------------|------|-------------|
| `Accepted publickey for taro from 192.0.2.10` | 鍵認証でログイン成功 | 知らない IP アドレスからの成功 |
| `Accepted password for taro from ...` | パスワード認証でログイン成功 | パスワード認証を禁止しているはずなのに出ている |
| `Failed password for taro from ...` | パスワードを間違えた | 同じ IP から短時間に大量に出ている（総当たり攻撃） |
| `Failed password for invalid user admin from ...` | 存在しないユーザーでのログイン失敗 | よくあるユーザー名を順に試されている |
| `Invalid user test from ...` | 存在しないユーザー名で接続された | |
| `sudo: taro : TTY=pts/0 ; PWD=/home/taro ; USER=root ; COMMAND=/usr/bin/apt update` | sudo の実行記録 | 見覚えのないコマンド |
| `sudo: taro : user NOT in sudoers` | 権限のない人が sudo を試した | |
| `pam_unix(sshd:session): session opened for user taro` | セッション開始 | |
| `useradd[...]: new user: name=...` | ユーザーの追加 | 誰も追加していないはずのとき |

### よく使う集計

```bash
# パスワード認証に失敗した接続元 IP アドレスの回数（多い順）
sudo grep "Failed password" /var/log/auth.log \
  | grep -oE 'from [0-9.]+' | sort | uniq -c | sort -rn | head

# ログインに成功した記録だけを表示
sudo grep -E "Accepted (password|publickey)" /var/log/auth.log

# sudo の実行記録だけを表示
sudo grep "COMMAND=" /var/log/auth.log

# rsyslog が無い環境（journald）の場合
sudo journalctl -u ssh --since today | grep "Failed password"
```

## 3.6 ログイン履歴（wtmp / btmp）

`/var/log/wtmp` と `/var/log/btmp` はバイナリ形式なので、専用のコマンドで見ます。

```bash
last                  # ログインと再起動の履歴（/var/log/wtmp）
last -n 20            # 最新の 20 件
last -x               # シャットダウンやランレベルの変更も表示
last reboot           # 再起動の履歴
sudo lastb            # ログイン失敗の履歴（/var/log/btmp。root 権限が必要）
w                     # 今ログインしているユーザーと、実行中のコマンド
who                   # 今ログインしているユーザー
```

> 環境によっては、これらのファイルやコマンドが入っていないことがあります。その場合は `journalctl` で認証ログを確認します。

`last` の出力例:

```
taro     pts/0        192.0.2.10       Mon Oct 12 10:15   still logged in
taro     pts/0        192.0.2.10       Sun Oct 11 09:02 - 18:30  (09:28)
reboot   system boot  6.1.0-25-amd64   Sun Oct 11 09:00   still running
```

## 3.7 ログのローテーション（logrotate）

ログが増え続けないよう、定期的に古いログを別名にして圧縮・削除しています。

| ファイル名 | 意味 |
|-----------|------|
| `auth.log` | 現在のログ |
| `auth.log.1` | 1 世代前 |
| `auth.log.2.gz` | 2 世代前（圧縮済み） |

- 設定は `/etc/logrotate.conf` と `/etc/logrotate.d/` にあります。
- 古いログを調べるときは、`zcat` / `zgrep` / `zless` を使うと圧縮ファイルもそのまま読めます。

## 3.8 侵入を疑ったときの確認手順

1. **ログを先に保全します。** 調べる前に `/var/log/` をコピーしておきます（攻撃者がログを消すことがあるため）。
2. **認証ログを見ます。** 知らない IP からのログイン成功や、見覚えのない sudo の実行が無いか確認します（3.5）。
3. **ログイン履歴を見ます。** `last` と `lastb` で、不審な時間帯や接続元からのログインが無いか確認します（3.6）。
4. **ログの欠けを見ます。** 時刻が飛んでいる、ファイルが急に小さくなっている、`wtmp` が空になっているなどは、ログが消された可能性があります。
5. **設定の変更を見ます。** [2章](02-security.md) の一覧（`authorized_keys`、cron、systemd、sudoers、SUID ファイル）に、知らない変更が無いか確認します。

## 参考資料

- [journalctl(1)](https://man7.org/linux/man-pages/man1/journalctl.1.html) / [journald.conf(5)](https://man7.org/linux/man-pages/man5/journald.conf.5.html)
- [last(1) / lastb(1)](https://manpages.debian.org/bookworm/util-linux/lastb.1.en.html) / [utmp(5)](https://man7.org/linux/man-pages/man5/utmp.5.html)
- [Debian 12 リリースノート：rsyslog が既定でインストールされなくなった件](https://www.debian.org/releases/bookworm/amd64/release-notes/ch-information.en.html)
- [RHEL 9：ログファイルを使った問題のトラブルシューティング](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/assembly_troubleshooting-problems-using-log-files_configuring-basic-system-settings)
