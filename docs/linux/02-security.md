# Linux 2. セキュリティ上重要な場所

[← 前: 標準的なディレクトリ構成](01-directories.md) | [目次](../index.md) | [次: ログの場所と見方 →](03-logs.md)

---

> 侵入されたときに書き換えられやすい場所や、設定ミスが事故につながりやすい場所をまとめています。

## 2.1 一覧

| 場所 | 何が分かる・何を守る | 正しい状態の目安 |
|------|-------------------|----------------|
| `/etc/passwd` | ユーザーの一覧 | 誰でも読めるが、書き込めるのは root だけ（`644`） |
| `/etc/shadow` | パスワードのハッシュ | root 以外は読めない（`640` か `000` など） |
| `/etc/group`、`/etc/gshadow` | グループの一覧と所属 | `sudo` / `wheel` グループのメンバーに注意 |
| `/etc/sudoers`、`/etc/sudoers.d/` | sudo で何ができるか | `440`。必ず `visudo` で編集する |
| `/etc/ssh/sshd_config` | SSH サーバーの設定 | root ログインやパスワード認証を許可していないか |
| `~/.ssh/authorized_keys` | そのユーザーに SSH でログインできる公開鍵 | 知らない鍵が無いか |
| `/etc/pam.d/` | ログイン時の認証の流れ（PAM） | 勝手に変更されていないか |
| `/etc/crontab`、`/etc/cron.*/`、`/var/spool/cron/` | 定期実行の設定 | 知らないジョブが無いか（不正プログラムの常駐によく使われる） |
| `/etc/systemd/system/` | 自動起動するサービス | 知らないサービスが無いか |
| `/root` | root のホーム | `700`（root 以外は入れない） |
| `/tmp`、`/var/tmp` | 誰でも書ける一時ディレクトリ | スティッキービット付き（`1777`） |
| `/var/log/` | ログ（[3章](03-logs.md)） | 消されていないか、改ざんされていないか |
| `/proc/<PID>/` | 動いているプロセスの情報 | 不審なプロセスの調査に使う |

## 2.2 /etc/passwd と /etc/shadow

### /etc/passwd（1行 1ユーザー、`:` 区切り）

```
taro:x:1000:1000:Taro Yamada:/home/taro:/bin/bash
```

| 番号 | 項目 | 例 | 見るポイント |
|------|------|----|-------------|
| 1 | ユーザー名 | `taro` | |
| 2 | パスワード | `x` | `x` は「shadow に保存」という意味 |
| 3 | UID | `1000` | **0 は root**。root 以外に UID 0 がいたら要注意 |
| 4 | GID | `1000` | 主グループ |
| 5 | コメント | `Taro Yamada` | |
| 6 | ホームディレクトリ | `/home/taro` | |
| 7 | ログインシェル | `/bin/bash` | `/usr/sbin/nologin` や `/bin/false` はログイン不可 |

```bash
# UID が 0 のユーザーを探す（普通は root だけ）
awk -F: '$3 == 0 {print $1}' /etc/passwd

# ログインできるシェルを持つユーザーを表示
grep -v -E 'nologin|false' /etc/passwd
```

### /etc/shadow

```
taro:$y$j9T$....:19700:0:99999:7:::
```

| 番号 | 項目 |
|------|------|
| 1 | ユーザー名 |
| 2 | パスワードのハッシュ |
| 3 | 最後にパスワードを変えた日（1970年1月1日からの日数） |
| 4 | パスワードを変えられるようになるまでの最短日数 |
| 5 | パスワードの有効期限（日数） |
| 6 | 期限切れの何日前から警告するか |
| 7 | 期限切れ後、アカウントが使えなくなるまでの日数 |
| 8 | アカウントの有効期限 |
| 9 | 予約（未使用） |

パスワード欄の読み方:

| 内容 | 意味 |
|------|------|
| `$y$...`、`$6$...` など | ハッシュ化されたパスワード（`$` のあとの記号がハッシュの方式） |
| `!` で始まる | パスワードがロックされている（`passwd -l` の結果） |
| `*` | パスワードでのログインはできない（SSH の鍵など別の方法では入れる場合がある） |
| 空欄 | **パスワードなしでログインできる可能性がある**。要確認 |

```bash
sudo chage -l taro      # パスワードの期限などを読みやすく表示
```

## 2.3 sudo の設定

```bash
sudo visudo                       # /etc/sudoers を編集（保存時に文法をチェックしてくれる）
sudo visudo -f /etc/sudoers.d/dev # 追加の設定ファイルを編集
sudo -l                           # 自分が sudo で何を実行できるか確認
sudo -l -U taro                   # taro が何を実行できるか確認（root 権限が必要）
```

書式は「**誰が どのホストで = (誰として) 何を**」です。

```
# taro は全ホストで、誰としてでも、全コマンドを実行できる
taro    ALL=(ALL:ALL) ALL

# %wheel は「wheel グループ全員」という意味
%wheel  ALL=(ALL) ALL

# deploy はパスワードなしで、nginx の再起動だけを実行できる
deploy  ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx
```

!!! danger "sudoers の注意点"
    - 直接エディタで編集して文法を間違えると、sudo が使えなくなります。必ず `visudo` を使います。
    - `NOPASSWD: ALL` は、そのユーザーが乗っ取られると、パスワードなしで root になれてしまいます。
    - `vim`、`less`、`find` など、中から別のコマンドを実行できるプログラムを sudo で許可すると、そこから root のシェルを起動できてしまいます。
    - `/etc/sudoers.d/` の中のファイルは、名前に `.` が含まれるか、`~` で終わると読み込まれません。

## 2.4 SSH の設定（/etc/ssh/sshd_config）

| 設定 | おすすめ | 意味 |
|------|---------|------|
| `PermitRootLogin` | `no` | root で直接ログインさせない |
| `PasswordAuthentication` | `no` | パスワード認証を禁止し、鍵認証だけにする |
| `PubkeyAuthentication` | `yes` | 公開鍵認証を使う |
| `PermitEmptyPasswords` | `no` | 空のパスワードでのログインを禁止 |
| `AllowUsers` / `AllowGroups` | 必要な人だけ | ログインできるユーザーを限定 |

```bash
sudo sshd -t                  # 設定ファイルの文法チェック（エラーが無ければ何も表示されない）
sudo systemctl reload ssh     # 設定を反映（RHEL 系はサービス名が sshd）
```

!!! warning "設定変更で締め出されないように"
    SSH の設定を変えるときは、今のセッションを閉じずに **別の端末から新しく接続できるか確認** してからログアウトします。

鍵ファイルの権限（緩すぎると sshd が鍵を受け付けないことがあります）:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

## 2.5 ファイルの権限（パーミッション）

```
-rwxr-x---  1 taro dev  1234 Oct 12 10:00 script.sh
│└┬┘└┬┘└┬┘
│ │  │  └─ その他のユーザー（---：権限なし）
│ │  └──── グループ dev（r-x：読む・実行）
│ └─────── 所有者 taro（rwx：読む・書く・実行）
└───────── 種類（- ファイル、d ディレクトリ、l シンボリックリンク）
```

| 数字 | 記号 | 意味 |
|------|------|------|
| 4 | `r` | 読む（ディレクトリなら一覧を見る） |
| 2 | `w` | 書く（ディレクトリならファイルの作成・削除） |
| 1 | `x` | 実行（ディレクトリなら中に入る） |

例：`chmod 640 file` → 所有者 `rw-`(6)、グループ `r--`(4)、その他 `---`(0)

### 特殊な権限

| 権限 | 数字 | 表示 | 意味 | 危険性 |
|------|------|------|------|--------|
| SUID | 4000 | `-rwsr-xr-x` | 実行すると **ファイルの所有者の権限** で動く | 所有者が root だと、脆弱性があれば root を取られる |
| SGID | 2000 | `-rwxr-sr-x` | 実行するとファイルのグループの権限で動く（ディレクトリでは、中に作ったファイルが同じグループになる） | |
| スティッキービット | 1000 | `drwxrwxrwt` | ディレクトリ内のファイルは **作った本人と root しか消せない** | `/tmp` に付いていないと他人のファイルを消せてしまう |

```bash
# SUID が付いたファイルを探す（普段から一覧を控えておき、増えていないか比べる）
sudo find / -xdev -type f -perm -4000 -exec ls -l {} \; 2>/dev/null

# 誰でも書き込めるファイルを探す
sudo find / -xdev -type f -perm -0002 -exec ls -l {} \; 2>/dev/null

# 所有者がいない（ユーザーを消したあとに残った）ファイルを探す
sudo find / -xdev \( -nouser -o -nogroup \) 2>/dev/null
```

> 普通の環境でも、`passwd` や `sudo` など SUID が付いているコマンドはあります。大事なのは「普段と比べて増えていないか」です。

## 2.6 不審なプロセスやログインを調べる

```bash
ps auxf                       # 全プロセスを親子関係つきで表示
ss -tulpn                     # 待ち受けているポートと、そのプロセス
ls -l /proc/<PID>/exe         # プロセスの実体となる実行ファイル
cat /proc/<PID>/cmdline | tr '\0' ' '   # 起動したときのコマンドライン
ls -l /proc/<PID>/cwd         # プロセスの作業ディレクトリ
crontab -l -u <ユーザー名>     # ユーザーの cron
systemctl list-units --type=service --state=running   # 動いているサービス
w                             # 今ログインしているユーザー
last                          # 過去のログイン履歴（3章）
```

!!! tip "実行ファイルが消えているプロセス"
    `ls -l /proc/<PID>/exe` の結果に `(deleted)` と表示される場合、実行ファイルがすでに削除されています。
    アップデートの直後でもこうなることはありますが、知らないプロセスなら不正プログラムを疑って調べます。

## 参考資料

- [passwd(5)](https://man7.org/linux/man-pages/man5/passwd.5.html) / [shadow(5)](https://man7.org/linux/man-pages/man5/shadow.5.html)
- [sudoers manual](https://www.sudo.ws/docs/man/sudoers.man/)
- [sshd_config(5)](https://man.openbsd.org/sshd_config)
- [chmod(1)](https://man7.org/linux/man-pages/man1/chmod.1.html) / [find(1)](https://man7.org/linux/man-pages/man1/find.1.html)
