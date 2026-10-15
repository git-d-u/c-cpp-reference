# PowerShell 3. SSH・ファイル転送・リモート操作

[← 前: セキュアなコーディングとダメな例](02-secure-coding.md) | [目次](../index.md)

---

> Windows から、ほかのコンピューターに接続して操作したり、ファイルをやり取りしたりする方法をまとめます。接続先は、自分が管理しているコンピューターか、利用の許可を得たものだけにしてください。

## 3.1 方法の選び方

| 方法 | 通信の暗号化 | 主な用途 | 必要なもの |
|------|------------|---------|-----------|
| **SSH**（`ssh`） | あり | Linux / Windows のサーバーにログインしてコマンドを実行 | OpenSSH クライアント（Windows 10 1809 以降に付属） |
| **SCP / SFTP**（`scp`、`sftp`） | あり | ファイルの転送 | 同上 |
| **PowerShell リモート（WinRM）** | あり（ドメイン環境の Kerberos など） | Windows どうしで PowerShell のコマンドを実行 | 接続先で `Enable-PSRemoting` |
| **PowerShell リモート（SSH）** | あり | Windows・Linux・macOS で PowerShell のコマンドを実行 | 両方に PowerShell 7 と SSH |
| **FTP**（`ftp`、`curl.exe`） | **なし**（パスワードも平文） | 古いサーバーとのファイルのやり取り | 接続先に FTP サーバー |
| **FTPS**（`curl.exe`） | あり（TLS） | FTP を暗号化したもの | FTPS に対応したサーバー |

!!! danger "FTP は暗号化されない"
    FTP は、**ユーザー名・パスワード・ファイルの中身がすべて平文** で流れます。同じネットワークで通信を見られると、そのまま読まれてしまいます。
    新しく使うなら SFTP（SSH を使った転送）を選びます。どうしても FTP を使うなら、FTPS（TLS で暗号化した FTP）を使います。

## 3.2 OpenSSH クライアントの準備

Windows 10 1809 / Windows Server 2019 以降には、OpenSSH が Windows の機能として用意されています。

```powershell
# 入っているか確認する
Get-Command ssh, scp, sftp
ssh -V                                     # 例: OpenSSH_for_Windows_9.5p2

# 入っていなければ追加する（管理者として実行）
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

> 実行ファイルは `C:\Windows\System32\OpenSSH\` にあります。

## 3.3 SSH で接続する

```powershell
ssh <user>@server01                        # 接続（初回はホストの確認が出る）
ssh -p 2222 <user>@server01                # ポートを指定
ssh <user>@server01 "uptime"               # コマンドを 1 つだけ実行して戻る
ssh -i ~/.ssh/id_ed25519 <user>@server01   # 使う秘密鍵を指定
ssh -v <user>@server01                     # 接続の様子を詳しく表示（うまくつながらないとき）
```

### 初回接続時のホストの確認

```text
The authenticity of host 'server01 (192.0.2.10)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxx...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

- `yes` と答えると、接続先の鍵が `~/.ssh/known_hosts` に保存され、次回からは確認されません。
- 本当は、表示された **フィンガープリントを、サーバーの管理者から別の方法で聞いた値と比べてから** `yes` と答えます。
- 一度つないだサーバーで「`REMOTE HOST IDENTIFICATION HAS CHANGED`」と表示されたら、サーバーを入れ替えたなどの理由がない限り、通信が乗っ取られている可能性があります。理由を確かめるまで接続しません。

```powershell
# サーバー側で、自分のホスト鍵のフィンガープリントを表示する（Linux の例）
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub

# known_hosts から、特定のホストの古い鍵を消す（理由が分かっているときだけ）
ssh-keygen -R server01
```

## 3.4 鍵認証

パスワードの代わりに鍵のペア（秘密鍵と公開鍵）で認証します。パスワードを総当たりで試される心配がなくなります。

```powershell
# 1. 鍵のペアを作る（パスフレーズを付けることを強く勧める）
ssh-keygen -t ed25519 -C "<user>@work-pc"
# → ~/.ssh/id_ed25519（秘密鍵：絶対に渡さない）と ~/.ssh/id_ed25519.pub（公開鍵）ができる

# 2. ssh-agent に秘密鍵を登録する（パスフレーズの入力を毎回しなくて済む）
#    ssh-agent サービスは既定で無効なので、管理者として次の 2 行を実行する
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
ssh-add -l                                 # 登録されている鍵の一覧
```

### 公開鍵をサーバーに登録する

| 接続先 | 公開鍵を書くファイル |
|-------|-------------------|
| Linux | `~/.ssh/authorized_keys`（そのユーザーのホームの下） |
| Windows（一般ユーザー） | `C:\Users\<user>\.ssh\authorized_keys` |
| Windows（管理者グループのユーザー） | `C:\ProgramData\ssh\administrators_authorized_keys`（アクセス権を Administrators と SYSTEM だけにする） |

```powershell
# Linux のサーバーに公開鍵を追記する例（初回はパスワードで接続）
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub |
    ssh <user>@server01 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

!!! warning "Windows の管理者ユーザーは保存場所が違う"
    接続先が Windows で、ログインするユーザーが管理者グループに入っている場合、`C:\Users\<user>\.ssh\authorized_keys` は **使われません**。`C:\ProgramData\ssh\administrators_authorized_keys` に書きます（Microsoft のドキュメント「OpenSSH for Windows のキーベース認証」）。

## 3.5 設定ファイル（~/.ssh/config）

よく使う接続先は、設定ファイルに書いておくと短い名前で接続できます。Windows では `C:\Users\<user>\.ssh\config` です。

```text
Host web
    HostName server01.example.com
    User <user>
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host internal
    HostName 10.0.0.20
    User <user>
    ProxyJump web            # web を経由して接続する（踏み台）
```

```powershell
ssh web                      # ssh -p 2222 -i ~/.ssh/id_ed25519 <user>@server01.example.com と同じ
ssh internal                 # web を経由して 10.0.0.20 に接続
ssh -G web                   # 設定がどう解釈されるかを表示（接続はしない）
```

## 3.6 SSH の応用

### 踏み台を経由する

```powershell
ssh -J <user>@bastion <user>@10.0.0.20        # bastion を経由して 10.0.0.20 に接続
```

### ポートフォワーディング（トンネル）

```powershell
# ローカルの 8080 番 → サーバー側から見た localhost:80 に転送
# 手元のブラウザで http://localhost:8080 を開くと、サーバーの Web 画面が見える
ssh -N -L 8080:localhost:80 <user>@server01

# ローカルの 15432 番 → サーバーから見える db01:5432 に転送（直接届かない DB に接続するとき）
ssh -N -L 15432:db01:5432 <user>@server01
```

| オプション | 意味 |
|-----------|------|
| `-L 手元のポート:転送先:転送先のポート` | 手元のポートへの接続を、サーバー経由で転送先に送る |
| `-R サーバーのポート:転送先:転送先のポート` | 逆向き。サーバー側のポートへの接続を、手元の側に送る |
| `-D ポート` | SOCKS プロキシとして使う |
| `-N` | コマンドを実行しない（転送だけに使う） |

!!! note "トンネルは社内の決まりを確認してから"
    ポートフォワーディングは、ファイアウォールの外から内側のサービスに届く経路を作ります。業務で使う場合は、ネットワークの管理者や社内の規則で許可されているか確認します。

### PowerShell からまとめて実行する

```powershell
$servers = "web01", "web02", "web03"
foreach ($s in $servers) {
    $out = ssh -o ConnectTimeout=5 -o BatchMode=yes "<user>@$s" "df -h /" 2>&1
    if ($LASTEXITCODE -eq 0) {
        "== $s =="; $out
    } else {
        Write-Warning "$s に接続できませんでした"
    }
}
```

- `-o BatchMode=yes`：パスワードの入力を求めず、鍵認証ができなければすぐ失敗させます（自動処理で止まらないように）。
- `$LASTEXITCODE` で、`ssh` の終了コード（接続先のコマンドの終了コード）を確認します。

## 3.7 SCP と SFTP でファイルを転送する

### scp

```powershell
scp .\report.csv <user>@server01:/tmp/              # アップロード
scp <user>@server01:/var/log/app.log .\             # ダウンロード
scp -r .\site <user>@server01:/var/www/             # フォルダごと（-r）
scp -P 2222 .\a.txt <user>@server01:/tmp/           # ポートの指定は大文字の -P
scp .\a.txt web:/tmp/                               # ~/.ssh/config の名前も使える
```

!!! warning "scp と ssh でポートのオプションが違う"
    `ssh` はポートを小文字の `-p` で指定しますが、`scp` と `sftp` は **大文字の `-P`** です（`scp` の `-p` は、更新日時などを保つオプション）。

### sftp

```powershell
sftp <user>@server01
```

```text
sftp> pwd                    # 接続先の今いるフォルダ
sftp> lpwd                   # 手元の今いるフォルダ
sftp> ls                     # 接続先の一覧
sftp> cd /var/log
sftp> get app.log            # ダウンロード
sftp> put report.csv         # アップロード
sftp> mkdir backup
sftp> bye                    # 終了
```

自動処理では、コマンドをファイルに書いて `-b` で渡します。

```powershell
@"
cd /upload
put report.csv
bye
"@ | Set-Content -Path .\sftp-batch.txt -Encoding ascii

sftp -b .\sftp-batch.txt <user>@server01     # 鍵認証が必要（パスワードは入力できない）
```

## 3.8 PowerShell リモート（WinRM）

Windows どうしで、PowerShell のコマンドをそのまま相手のコンピューターで実行できます。

### 接続先の準備（管理者として実行）

```powershell
Enable-PSRemoting          # WinRM サービスの起動、待ち受けの設定、ファイアウォールの規則を作る
```

- Windows Server 2012 以降は、最初から有効になっています。Windows のクライアント（10 / 11）では、受け付ける側で `Enable-PSRemoting` が必要です。
- 接続できるのは、既定では接続先の **Administrators** か **Remote Management Users** グループのメンバーです。

### 使い方

```powershell
# 対話的に操作する
Enter-PSSession -ComputerName server01 -Credential (Get-Credential)
[server01]: PS C:\> Get-Service spooler
[server01]: PS C:\> Exit-PSSession

# 複数のコンピューターで同じコマンドを実行する（結果に PSComputerName が付く）
Invoke-Command -ComputerName server01, server02 -ScriptBlock {
    Get-CimInstance Win32_OperatingSystem | Select-Object Caption, LastBootUpTime
}

# 手元の変数を渡す（$using: を付ける）
$svc = "spooler"
Invoke-Command -ComputerName server01 -ScriptBlock { Get-Service -Name $using:svc }

# セッションを作って使い回す
$s = New-PSSession -ComputerName server01 -Credential (Get-Credential)
Invoke-Command -Session $s -ScriptBlock { $env:COMPUTERNAME }
Copy-Item -Path .\setup.ps1 -Destination C:\Temp\ -ToSession $s        # ファイルを送る
Copy-Item -Path C:\Logs\app.log -Destination .\ -FromSession $s        # ファイルを受け取る
Remove-PSSession $s                                                    # 終わったら閉じる
```

!!! warning "ドメインに入っていない環境での注意"
    接続元がドメインに参加していない場合や、IP アドレスで接続する場合は、HTTPS（証明書）で接続するか、接続元の `TrustedHosts` に接続先を登録する必要があります。さらに、`-Credential` の指定も必要です。
    `TrustedHosts` は `*` で全コンピューターを指定することもできますが、この設定はそのコンピューターの **全ユーザー** に影響します（Microsoft のドキュメント）。必要な接続先だけを登録します。

    ```powershell
    Get-Item WSMan:\localhost\Client\TrustedHosts                       # 今の設定を見る
    Set-Item WSMan:\localhost\Client\TrustedHosts -Value "server01"     # 1 台だけ登録（管理者として実行）
    ```

## 3.9 PowerShell リモート（SSH）

PowerShell 7 では、WinRM の代わりに SSH を使ってリモート操作ができます。Linux や macOS にもつなげます。

```powershell
# 接続先の sshd_config に、PowerShell 用のサブシステムを追加しておく
#   Linux:   Subsystem powershell /usr/bin/pwsh -sshs -NoLogo
#   Windows: Subsystem powershell C:/progra~1/powershell/7/pwsh.exe -sshs

# 接続（-ComputerName ではなく -HostName を使う）
Enter-PSSession -HostName server01 -UserName <user>
Invoke-Command -HostName server01 -UserName <user> -KeyFilePath ~/.ssh/id_ed25519 -ScriptBlock { uname -a }
```

> SSH を使ったリモートには、PowerShell 6 以降と SSH が、両方のコンピューターに必要です。Windows PowerShell 5.1 では使えません。

## 3.10 FTP / FTPS

!!! danger "FTP を使う前に"
    3.1 のとおり、FTP はパスワードも中身も暗号化されません。できるだけ SFTP か FTPS を使います。

### Windows の ftp コマンド

```powershell
ftp server01                     # 対話的に接続
```

```text
ftp> user <user>                 # ユーザー名（続けてパスワードを聞かれる）
ftp> binary                      # バイナリモード（画像や圧縮ファイルは必ずこれ）
ftp> get file.zip
ftp> put report.csv
ftp> bye
```

| オプション | 意味 |
|-----------|------|
| `-s:ファイル名` | ファイルに書いた ftp のコマンドを順に実行する |
| `-n` | 接続したときに自動でログインしない |
| `-i` | 複数のファイルを転送するときに、1 つずつ確認しない |

> `-s:` でコマンドを渡すと、パスワードもそのファイルに書くことになります。パスワードを書いたファイルを残さないよう注意が必要です。

### curl.exe

`curl.exe` は、Windows 10 のビルド 17063 から Windows に付属しています。FTP と FTPS に対応しています。このページを作るときに確認した Windows 11 の `curl.exe` 8.21 は、`sftp` と `scp` には対応していませんでした（`curl.exe --version` の `Protocols:` に表示されるもので確認できます）。

```powershell
# FTPS（暗号化あり）でダウンロード・アップロード
curl.exe --ssl-reqd -u <user> -o file.zip ftp://server01/pub/file.zip     # パスワードは聞かれる
curl.exe --ssl-reqd -u <user> -T report.csv ftp://server01/upload/

# 一覧を表示
curl.exe --ssl-reqd -u <user> ftp://server01/pub/

# 対応しているプロトコルを確認
curl.exe --version
```

- PowerShell 5.1 では、`curl` は `Invoke-WebRequest` の別名です。本物の curl を使うときは、必ず `curl.exe` と書きます。
- `--ssl-reqd` を付けると、TLS で暗号化できない場合は接続を中止します。
- `-u <user>:<pass>` のようにパスワードをコマンドに書くと、コマンドの履歴に残ります。`-u <user>` だけにして、入力させます。

### .NET の FtpWebRequest について

古いスクリプトでは、`[System.Net.FtpWebRequest]` を使った FTP の処理を見かけます。この仕組みの元になる `WebRequest.Create` などは、.NET 6 から **非推奨（obsolete）** です。新しく作る処理では使わず、SFTP か、上の `curl.exe` を使います。

## 3.11 Web からの取得（HTTP / HTTPS）

```powershell
# ファイルをダウンロード
Invoke-WebRequest -Uri "https://example.com/file.zip" -OutFile .\file.zip -UseBasicParsing

# API を呼んで、JSON をオブジェクトとして受け取る
$res = Invoke-RestMethod -Uri "https://api.example.com/items" -Headers @{ Authorization = "Bearer $token" }
$res | Select-Object -First 5

# ダウンロードしたファイルのハッシュを確認
(Get-FileHash .\file.zip -Algorithm SHA256).Hash
```

> トークンなどの秘密の情報は、スクリプトに直接書かず、[2章](02-secure-coding.md) の方法で扱います。

## 3.12 つながらないときの確認

```powershell
Test-NetConnection server01 -Port 22        # SSH のポートに届くか（TcpTestSucceeded が True か）
Test-NetConnection server01 -Port 5985      # WinRM のポート（Microsoft のドキュメントの設定例で使われている番号）
Resolve-DnsName server01                    # 名前解決ができるか
ssh -v <user>@server01                      # SSH の詳しいログ（認証のどこで失敗しているか）
Test-WSMan server01                         # WinRM が応答するか
Get-WSManInstance winrm/config/listener -Enumerate   # 待ち受けの設定（Port、Transport）を確認（接続先で管理者として実行）
```

| 症状 | よくある原因 |
|------|------------|
| `Connection timed out` | ファイアウォールでポートが閉じている、宛先が違う |
| `Connection refused` | 接続先でサービス（sshd など）が動いていない |
| `Permission denied (publickey)` | 公開鍵が登録されていない、保存場所が違う（3.4 の Windows 管理者ユーザー）、ファイルのアクセス権が緩すぎる |
| `Host key verification failed` | ホストの鍵が変わった（3.3） |
| WinRM で `Access is denied` | 接続先の Administrators / Remote Management Users に入っていない |

## 参考資料

- [Get started with OpenSSH for Windows (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-server/administration/openssh/openssh_install_firstuse)
- [Key-based authentication in OpenSSH for Windows (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-server/administration/openssh/openssh_keymanagement)
- [ssh(1) - OpenBSD manual](https://man.openbsd.org/ssh) / [scp(1)](https://man.openbsd.org/scp) / [sftp(1)](https://man.openbsd.org/sftp) / [ssh_config(5)](https://man.openbsd.org/ssh_config)
- [about_Remote_Requirements (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_remote_requirements)
- [PowerShell remoting over SSH (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/scripting/security/remoting/ssh-remoting-in-powershell)
- [Copy-Item (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.management/copy-item) — `-ToSession` / `-FromSession`
- [ftp (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ftp)
- [curl のマニュアル](https://curl.se/docs/manpage.html)
- [SYSLIB0014 (Microsoft Learn)](https://learn.microsoft.com/ja-jp/dotnet/fundamentals/syslib-diagnostics/syslib0014) — WebRequest などの非推奨
