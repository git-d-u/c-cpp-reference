# Linux 1. 標準的なディレクトリ構成

[目次](../index.md) | [次: セキュリティ上重要な場所 →](02-security.md)

---

> Linux のディレクトリ構成は **FHS（Filesystem Hierarchy Standard）3.0** という標準で決められています。ディストリビューション（Ubuntu、Debian、RHEL など）によって細かい違いはありますが、大枠は共通です。

## 1.1 全体像

```
/
├── bin   → usr/bin    基本コマンド（ls, cp, cat など）
├── sbin  → usr/sbin   システム管理用コマンド
├── lib   → usr/lib    基本ライブラリ、カーネルモジュール
├── boot               起動に必要なファイル（カーネル、ブートローダー）
├── dev                デバイスファイル
├── etc                設定ファイル
├── home               一般ユーザーのホームディレクトリ
├── root               root ユーザーのホームディレクトリ
├── media              USB メモリなどの自動マウント先
├── mnt                一時的なマウント先
├── opt                追加のアプリケーション
├── proc               プロセスとカーネルの情報（仮想）
├── sys                デバイスとカーネルの情報（仮想）
├── run                起動後の実行時データ（再起動で消える）
├── srv                サーバーが公開するデータ
├── tmp                一時ファイル
├── usr                読み取り中心のプログラムとデータ
└── var                頻繁に変わるデータ（ログなど）
```

!!! note "/bin と /usr/bin の統合（/usr マージ）"
    多くの最近のディストリビューションでは `/bin`、`/sbin`、`/lib` が `/usr` 以下へのシンボリックリンクになっています。
    `ls -l /` を実行して `bin -> usr/bin` と表示されれば、統合済みです。

## 1.2 各ディレクトリの役割

| ディレクトリ | 役割 | 中身の例 |
|-------------|------|---------|
| `/bin` | 全ユーザーが使う基本コマンド | `ls` `cp` `mv` `cat` `bash` |
| `/sbin` | システム管理用コマンド | `fdisk` `ip` `reboot` |
| `/boot` | 起動用の静的ファイル | `vmlinuz-*`（カーネル）、`initrd.img-*`、`grub/` |
| `/dev` | デバイスファイル | `sda`（ディスク）、`null`、`tty*`、`random` |
| `/etc` | そのマシン固有の設定 | `passwd` `fstab` `hosts` `ssh/` |
| `/home` | 一般ユーザーのホーム | `/home/taro` |
| `/root` | root のホーム | |
| `/lib` | 基本的な共有ライブラリ、カーネルモジュール | `modules/` |
| `/media` | リムーバブルメディアのマウント先 | `/media/taro/USB` |
| `/mnt` | 一時的なマウント先 | 管理者が手動で使う |
| `/opt` | 追加パッケージ | `/opt/google/chrome` など |
| `/run` | 実行時の情報（tmpfs、再起動で消える） | PID ファイル、ソケット |
| `/srv` | サービスが提供するデータ | Web や FTP の公開ファイル（使わない環境も多い） |
| `/tmp` | 一時ファイル | 再起動で消える設定のことが多い |
| `/proc` | プロセスとカーネルの情報（仮想ファイルシステム） | `/proc/cpuinfo` `/proc/<PID>/` |
| `/sys` | デバイスとカーネルの情報（仮想ファイルシステム） | `/sys/class/net/` |

## 1.3 /usr の中

| ディレクトリ | 内容 |
|-------------|------|
| `/usr/bin` | ほとんどのユーザー用コマンド |
| `/usr/sbin` | 管理用コマンド |
| `/usr/lib` | ライブラリ |
| `/usr/include` | C/C++ のヘッダファイル（`stdio.h` など） |
| `/usr/share` | アーキテクチャに依存しないデータ（`man/`、`doc/` など） |
| `/usr/local` | **管理者が手動で入れたもの**（ソースからビルドしたものなど）。パッケージ管理の対象外 |

> パッケージマネージャー（apt / dnf）で入れたものは `/usr/bin` に、自分でビルドして `make install` したものは `/usr/local/bin` に入るのが基本です。

## 1.4 /var の中

| ディレクトリ | 内容 |
|-------------|------|
| `/var/log` | **ログファイル**（[3章](03-logs.md)） |
| `/var/lib` | アプリの状態データ（DB のデータファイル、パッケージ管理の情報など） |
| `/var/cache` | キャッシュ（消しても再生成できる） |
| `/var/spool` | 処理待ちのデータ（メール、印刷、cron など） |
| `/var/tmp` | 一時ファイル（**再起動しても残る**） |
| `/var/www` | Web サーバーの公開ディレクトリとしてよく使われる（FHS の規定外） |

## 1.5 /etc の主な設定ファイル

| ファイル | 内容 |
|---------|------|
| `/etc/passwd` | ユーザーの一覧 |
| `/etc/shadow` | パスワードのハッシュ（root だけが読める） |
| `/etc/group` | グループの一覧 |
| `/etc/sudoers` | sudo の設定 |
| `/etc/fstab` | 起動時にマウントするファイルシステム |
| `/etc/hosts` | ホスト名と IP アドレスの対応 |
| `/etc/resolv.conf` | DNS サーバーの設定 |
| `/etc/hostname` | このマシンのホスト名 |
| `/etc/ssh/sshd_config` | SSH サーバーの設定 |
| `/etc/crontab`、`/etc/cron.d/` | 定期実行の設定 |
| `/etc/systemd/system/` | 管理者が追加・変更した systemd のユニット |
| `/etc/os-release` | ディストリビューションの名前とバージョン |

セキュリティ上重要なものは [2章](02-security.md) で詳しく説明しています。

## 1.6 よく使う確認コマンド

```bash
ls -l /                 # ルート直下の一覧（シンボリックリンクも確認できる）
df -h                   # マウントされているファイルシステムと空き容量
du -sh /var/log         # ディレクトリの使用量
findmnt                 # マウントの一覧を木構造で表示
cat /etc/os-release     # ディストリビューションの確認
which ls                # コマンドの場所
man hier                # ディレクトリ構成の説明（マニュアル）
```

## 参考資料

- [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [hier(7) - Linux manual page](https://man7.org/linux/man-pages/man7/hier.7.html)
