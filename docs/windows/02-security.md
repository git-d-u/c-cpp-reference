# Windows 2. セキュリティ上重要な場所

[← 前: 標準的なディレクトリ構成](01-directories.md) | [目次](../index.md) | [次: ログの場所と見方 →](03-logs.md)

---

> 不正なプログラムが入り込みやすい場所、常駐（自動起動）に使われやすい場所、調査の手掛かりになる場所をまとめています。対象は Windows 7 〜 11 です。

## 2.1 一覧

| 場所 | 何が分かる・何を守る | 確認のポイント |
|------|-------------------|--------------|
| `C:\Windows\System32\config\` | レジストリの本体（`SAM` はローカルアカウントのパスワードのハッシュを含む） | 通常は起動中に読み出せない。コピーされた形跡に注意 |
| `C:\Windows\System32\drivers\etc\hosts` | ホスト名と IP アドレスの対応 | 正規のサイト名が別の IP に書き換えられていないか |
| スタートアップフォルダ（2.2） | ログオン時に自動で起動するもの | 知らないショートカットや実行ファイルが無いか |
| レジストリの Run / RunOnce キー（2.2） | ログオン時に自動で起動するもの | 知らないプログラムが登録されていないか |
| `C:\Windows\System32\Tasks\` | タスクスケジューラのタスク | 知らないタスクが無いか |
| サービス（`services.msc`） | 自動起動するサービス | 知らないサービスや、変な場所の実行ファイルが無いか |
| `%TEMP%`、`C:\Windows\Temp`、`Downloads` | 一時ファイル、ダウンロードしたファイル | 不正なプログラムが最初に置かれやすい |
| `%APPDATA%`、`%LOCALAPPDATA%` | ユーザーごとのアプリのデータ | 管理者権限なしで書き込めるため、不正なプログラムの置き場所になりやすい |
| `C:\ProgramData` | 全ユーザー共通のアプリのデータ | 同上 |
| `C:\Windows\Prefetch\` | 最近実行されたプログラムの手掛かり | 調査で「何が実行されたか」の確認に使う（無効にされている環境もある） |
| `C:\Windows\System32\winevt\Logs\` | イベントログ（[3章](03-logs.md)） | 消されていないか |
| `C:\Users\<名前>\NTUSER.DAT` | ユーザーごとのレジストリ | |

## 2.2 自動起動（常駐）に使われる場所

不正なプログラムは、再起動しても動き続けるように、次のような場所に自分を登録します。

### スタートアップフォルダ

| 対象 | パス |
|------|------|
| 自分だけ | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` |
| 全ユーザー | `%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp` |

エクスプローラーのアドレスバーに `shell:startup`（自分だけ）、`shell:common startup`（全ユーザー）と入力すると開けます。

### レジストリの Run / RunOnce キー

| キー | 動き |
|------|------|
| `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` | 全ユーザーのログオン時に毎回起動 |
| `HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce` | 次のログオン時に 1 回だけ起動（管理者がログオンしたときに実行） |
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | そのユーザーのログオン時に毎回起動 |
| `HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce` | そのユーザーの次のログオン時に 1 回だけ起動 |

> `HKLM` は `HKEY_LOCAL_MACHINE`（PC 全体）、`HKCU` は `HKEY_CURRENT_USER`（今のユーザー）の略です。`HKCU` は管理者権限なしで書き込めます。

```powershell
# Run キーの中身を確認する
Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'

# スタートアップフォルダの中身
Get-ChildItem "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
Get-ChildItem "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp"
```

### タスクスケジューラ

```powershell
# 登録されているタスクの一覧（Microsoft 以外のものを中心に確認する）
Get-ScheduledTask | Where-Object TaskPath -notlike '\Microsoft\*' |
    Select-Object TaskPath, TaskName, State
```

```bat
rem コマンドプロンプト（Windows 7 でも使える）
schtasks /query /fo LIST /v
```

### サービス

```powershell
# 自動起動するサービスと、その実行ファイルのパス
Get-CimInstance Win32_Service |
    Where-Object StartMode -eq 'Auto' |
    Select-Object Name, State, PathName
```

!!! tip "まとめて確認するなら Autoruns"
    Microsoft の Sysinternals が提供する **Autoruns** を使うと、上の場所を含む自動起動の登録先を一覧で確認できます。
    「Hide Signed Microsoft Entries」を有効にすると、Microsoft の署名付きの項目が隠れ、後から追加されたものを見つけやすくなります。

## 2.3 アカウントと権限

```bat
net user                         rem ローカルユーザーの一覧
net user <ユーザー名>             rem そのユーザーの詳細（最終ログオンなど）
net localgroup administrators    rem 管理者グループのメンバー
whoami /all                      rem 今のユーザーの所属グループと特権
```

```powershell
Get-LocalUser                                  # Windows 10 以降（PowerShell 5.1）
Get-LocalGroupMember -Group Administrators
```

確認のポイント:

- `Administrators` グループに、知らないユーザーが入っていないか。
- 使っていないアカウント（`Guest` など）が有効になっていないか。
- 普段の作業は管理者ではない一般ユーザーで行い、UAC（ユーザーアカウント制御）を無効にしていないか。

## 2.4 ファイルのアクセス権（NTFS）

```bat
icacls C:\Data                         rem アクセス権の表示
icacls C:\Data /grant taro:(OI)(CI)R   rem taro に読み取り権限を付与（下の階層にも継承）
icacls C:\Data /remove taro            rem taro の権限を削除
```

`icacls` の表示の読み方:

| 記号 | 意味 |
|------|------|
| `F` | フルコントロール |
| `M` | 変更 |
| `RX` | 読み取りと実行 |
| `R` | 読み取り |
| `W` | 書き込み |
| `(OI)` | 中のファイルに継承 |
| `(CI)` | 中のフォルダに継承 |
| `(I)` | 上のフォルダから継承された権限 |

!!! danger "誰でも書き込めるフォルダに注意"
    `Everyone` や `Users` に書き込み（`W`、`M`、`F`）が付いたフォルダに実行ファイルが置かれていると、一般ユーザーがその実行ファイルを差し替えられます。
    特に、そのフォルダの実行ファイルがサービスとして管理者権限で動いている場合は、権限の昇格に使われます。

## 2.5 不審なプロセスや通信を調べる

```powershell
# プロセスの一覧と実行ファイルのパス
Get-Process | Select-Object Id, ProcessName, Path

# 親プロセスやコマンドラインも含めて確認
Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine

# 通信中・待ち受け中のポートと、そのプロセス
Get-NetTCPConnection | Where-Object State -in 'Listen','Established' |
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess

# ファイルの署名を確認（Microsoft などの正規の署名があるか）
Get-AuthenticodeSignature 'C:\path\to\file.exe'

# ファイルのハッシュ値（ウイルス対策の情報サイトで照合するときに使う）
Get-FileHash 'C:\path\to\file.exe' -Algorithm SHA256
```

```bat
rem コマンドプロンプト（Windows 7 でも使える）
tasklist /v
netstat -ano                     rem -o で PID を表示
```

確認のポイント:

- `svchost.exe` などのシステムのプロセス名なのに、`C:\Windows\System32` 以外の場所から動いていないか。
- `%TEMP%` や `%APPDATA%` から動いているプロセスが無いか。
- 署名が無い、または発行元に心当たりがないプログラムではないか。

## 2.6 Windows Defender と更新の状態

```powershell
Get-MpComputerStatus | Select-Object AMServiceEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated
Get-MpThreatDetection             # 検出された脅威の履歴
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10   # 最近の更新プログラム
```

> `Get-MpComputerStatus` などは、Windows 10 / 11 の Microsoft Defender ウイルス対策で使えるコマンドです。

## 参考資料

- [Run and RunOnce Registry Keys (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows/win32/setupapi/run-and-runonce-registry-keys)
- [KNOWNFOLDERID (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows/win32/shell/knownfolderid) — スタートアップフォルダの場所
- [Autoruns (Sysinternals)](https://learn.microsoft.com/ja-jp/sysinternals/downloads/autoruns)
- [icacls (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/icacls)
