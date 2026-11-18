# Windows 3. ログの場所と見方

[← 前: セキュリティ上重要な場所](02-security.md) | [目次](../index.md)

---

## 3.1 イベントログの仕組み

Windows のログは主に **イベントログ** に記録されます。Windows 7 〜 11 で仕組みは共通です。

| 項目 | 内容 |
|------|------|
| 保存場所 | `C:\Windows\System32\winevt\Logs\`（`%SystemRoot%\System32\winevt\Logs`） |
| 形式 | `.evtx`（バイナリ。メモ帳では読めない） |
| 見る方法 | イベントビューアー（`eventvwr.msc`）、PowerShell の `Get-WinEvent`、`wevtutil` |

### 主なログ

| ログ | ファイル名 | 内容 |
|------|-----------|------|
| **Security**（セキュリティ） | `Security.evtx` | ログオン、アカウントの変更、権限の使用など（**監査ポリシーで有効にしたものだけ**） |
| **System**（システム） | `System.evtx` | ドライバ、サービスの開始・停止、シャットダウンなど |
| **Application**（アプリケーション） | `Application.evtx` | アプリが書き込むログ |
| Windows Defender | `Microsoft-Windows-Windows Defender%4Operational.evtx` | ウイルス検出、リアルタイム保護の設定変更 |
| PowerShell | `Microsoft-Windows-PowerShell%4Operational.evtx` | PowerShell の実行（スクリプトブロックのログを有効にした場合など） |
| タスクスケジューラ | `Microsoft-Windows-TaskScheduler%4Operational.evtx` | タスクの登録・実行（**無効になっている場合がある**。`Get-WinEvent -ListLog Microsoft-Windows-TaskScheduler/Operational` の `IsEnabled` で確認できる） |
| リモートデスクトップ | `Microsoft-Windows-TerminalServices-LocalSessionManager%4Operational.evtx` | RDP のセッション |

> ファイル名の `%4` は、ログ名の `/` を置き換えたものです。イベントビューアーでは「アプリケーションとサービス ログ」→「Microsoft」→「Windows」の下に表示されます。

!!! note "セキュリティログは管理者権限が必要"
    Security ログを読むには、管理者として実行したイベントビューアーや PowerShell が必要です。

## 3.2 イベントビューアーでの見方

1. `Win + R` を押して `eventvwr.msc` と入力し、Enter を押します。
2. 左の「Windows ログ」から「セキュリティ」や「システム」を選びます。
3. 右の「現在のログをフィルター」で、**イベント ID** や期間で絞り込みます（例：`4624,4625`）。
4. イベントをダブルクリックすると詳細が表示されます。「詳細」タブの XML 表示では、すべての項目を確認できます。

## 3.3 Security ログの重要なイベント ID

| イベント ID | 内容 | 注意すべき状況 |
|------------|------|-------------|
| **4624** | ログオン成功 | 知らない IP や時間帯からのログオン |
| **4625** | ログオン失敗 | 短時間に大量（パスワードの総当たり） |
| 4634 / 4647 | ログオフ | |
| 4648 | 明示的な資格情報を使ったログオン（別ユーザーとして実行など） | |
| **4672** | 特別な特権（管理者相当）が割り当てられたログオン | 管理者でないはずのアカウント |
| 4688 | 新しいプロセスの作成 | 「プロセス作成の監査」を有効にした場合のみ |
| 4697 | サービスのインストール | 知らないサービス |
| 4698 | タスクスケジューラのタスクの作成 | 知らないタスク |
| **4720** | ユーザーアカウントの作成 | 誰も作っていないはずのとき |
| 4722 / 4725 / 4726 | アカウントの有効化 / 無効化 / 削除 | |
| 4724 | パスワードのリセット | |
| **4732** | ローカルグループへのメンバー追加 | Administrators への追加 |
| 4740 | アカウントのロックアウト | |
| **4719** | 監査ポリシーの変更 | ログを取らないように変えられていないか |
| **1102** | 監査ログ（Security ログ）の消去 | **攻撃者が痕跡を消した可能性** |

### ログオンの種類（4624 / 4625 の「ログオンの種類」）

| 番号 | 種類 | 意味 |
|------|------|------|
| 2 | Interactive | その PC の画面からのログオン |
| 3 | Network | ネットワーク経由（共有フォルダへのアクセスなど） |
| 4 | Batch | タスクスケジューラなどのバッチ処理 |
| 5 | Service | サービスの起動 |
| 7 | Unlock | 画面ロックの解除 |
| 8 | NetworkCleartext | ネットワーク経由（パスワードがハッシュ化されずに認証パッケージへ渡された） |
| 9 | NewCredentials | 別の資格情報での実行（`runas /netonly` など） |
| 10 | RemoteInteractive | **リモートデスクトップ（RDP）** |
| 11 | CachedInteractive | 保存された資格情報でのログオン（ドメインコントローラーに接続できないとき） |

### 4625（ログオン失敗）の状態コード

| コード | 意味 |
|-------|------|
| `0xC0000064` | 存在しないユーザー名（続けて出ていればユーザー名を探られている） |
| `0xC000006A` | パスワードが違う |
| `0xC000006D` | ユーザー名か認証情報が正しくない |
| `0xC000006F` | 許可された時間外のログオン |
| `0xC0000070` | 許可されていない端末からのログオン |
| `0xC0000072` | 無効にされたアカウント |
| `0xC0000193` | 有効期限が切れたアカウント |
| `0xC0000234` | ロックアウトされたアカウント |

## 3.4 System ログなどの重要なイベント ID

| ログ | イベント ID | 内容 |
|------|------------|------|
| System | 7045 | 新しいサービスのインストール（Service Control Manager） |
| System | 6008 | 前回のシャットダウンが予期しないものだった |
| Windows Defender | 1116 | マルウェアなどを検出した |
| Windows Defender | 1117 | 検出したものに対処した |
| Windows Defender | 5001 | リアルタイム保護が無効になった |
| Windows Defender | 5007 | Defender の設定が変更された（予期しない変更ならマルウェアの可能性） |
| PowerShell | 4104 | スクリプトブロックの記録（実行されたスクリプトの内容） |

## 3.5 PowerShell でログを調べる

```powershell
# 最新のセキュリティログ 20 件（管理者として実行）
Get-WinEvent -LogName Security -MaxEvents 20

# ID で絞り込む（ログオン失敗）
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4625 } -MaxEvents 50

# 期間を指定して絞り込む（直近 24 時間のログオン成功）
Get-WinEvent -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4624
    StartTime = (Get-Date).AddDays(-1)
}

# RDP でのログオン（ログオンの種類 10）だけを取り出す
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4624 } -MaxEvents 500 |
    Where-Object { ([xml]$_.ToXml()).Event.EventData.Data |
        Where-Object { $_.Name -eq 'LogonType' -and $_.'#text' -eq '10' } }

# ログオン失敗の多いアカウント名を数える
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4625 } -MaxEvents 1000 |
    ForEach-Object { ([xml]$_.ToXml()).Event.EventData.Data |
        Where-Object Name -eq 'TargetUserName' | Select-Object -ExpandProperty '#text' } |
    Group-Object | Sort-Object Count -Descending | Select-Object Count, Name -First 10

# ログの一覧（どのログにどれだけ記録があるか）
Get-WinEvent -ListLog * | Where-Object RecordCount -gt 0 |
    Sort-Object RecordCount -Descending | Select-Object LogName, RecordCount
```

> `Get-WinEvent` は Windows 7 でも使えます。`-FilterHashtable` で絞り込むと、すべてを取得してから絞り込むより速く動きます。

### コマンドプロンプト（wevtutil）

```bat
wevtutil el                                        rem ログ名の一覧
wevtutil qe Security /c:10 /rd:true /f:text        rem Security ログの新しい順に 10 件
wevtutil epl Security C:\backup\Security.evtx      rem ログをファイルに書き出す（保全用）
```

## 3.6 監査ポリシー（何を記録するか）

Security ログに何が記録されるかは **監査ポリシー** で決まります。既定のままでは記録されないイベントもあります。

```bat
auditpol /get /category:*          rem 今の監査設定を表示（管理者として実行）
```

よく有効にする設定:

| 設定 | 記録されるもの |
|------|-------------|
| ログオン（成功・失敗） | 4624、4625 など |
| アカウント管理 | 4720、4732 など |
| プロセスの作成 | 4688 |
| 「プロセス作成イベントにコマンドラインを含める」（グループポリシー） | 4688 にコマンドライン（引数）が記録されるようになる。既定では空欄 |
| PowerShell スクリプトブロックのログ記録（グループポリシー） | 4104 |

## 3.7 イベントログ以外のログ

| ログ | 場所 | 内容 |
|------|------|------|
| Windows ファイアウォール | `%windir%\System32\LogFiles\Firewall\pfirewall.log` | 破棄・許可した通信（**既定では記録しない**。ファイアウォールの詳細設定で有効にする） |
| Windows Update（Windows 8.1 以降） | `C:\Windows\Logs\WindowsUpdate\`（`.etl` 形式） | 更新の履歴。そのままでは読めないので、`Get-WindowsUpdateLog` を実行するとデスクトップに読める形の `WindowsUpdate.log` が作られる |
| コンポーネントの更新 | `C:\Windows\Logs\CBS\CBS.log` | 更新プログラムのインストール、`sfc /scannow` の結果 |
| デバイスのインストール | `C:\Windows\INF\setupapi.dev.log` | ドライバ・USB 機器のインストール履歴（Windows Vista 以降） |

ファイアウォールのログを有効にする例（管理者として実行）:

```bat
netsh advfirewall set allprofiles logging droppedconnections enable
netsh advfirewall set allprofiles logging allowedconnections enable
```

> 既定のログファイルの最大サイズは 4,096 KB で、上限に達すると古い記録から消えます。Microsoft は 20,480 KB 以上にすることを推奨しています。

## 3.8 侵入を疑ったときの確認手順

1. **ログを先に保全します。** `wevtutil epl` で `Security`、`System`、`Application`、Defender、PowerShell のログを書き出します（攻撃者がログを消すことがあるため）。
2. **ログの消去を確認します。** Security ログの 1102 が無いか確認します。
3. **ログオンを確認します。** 4624（特にログオンの種類 3 と 10）と 4625 で、知らない IP からのログオンや、総当たりの跡が無いか確認します。
4. **アカウントの変更を確認します。** 4720（作成）、4732（グループへの追加）が無いか確認します。
5. **常駐の跡を確認します。** 7045 / 4697（サービス）、4698（タスク）と、[2章](02-security.md) の自動起動の場所を確認します。
6. **Defender の検出を確認します。** 1116 / 1117 と、5001（リアルタイム保護の無効化）が無いか確認します。

## 参考資料

- [4624: An account was successfully logged on (Microsoft Learn)](https://learn.microsoft.com/ja-jp/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624) — ログオンの種類
- [4625: An account failed to log on (Microsoft Learn)](https://learn.microsoft.com/ja-jp/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625) — 状態コード
- [4688: A new process has been created (Microsoft Learn)](https://learn.microsoft.com/ja-jp/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4688)
- [Appendix L: Events to Monitor (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor) — 監視すべきイベント ID の一覧
- [Microsoft Defender Antivirus のイベント ID (Microsoft Learn)](https://learn.microsoft.com/ja-jp/defender-endpoint/troubleshoot-microsoft-defender-antivirus)
- [Windows ファイアウォールのログ設定 (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows/security/operating-system-security/network-security/windows-firewall/configure-logging)
- [Windows Update log files (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows/deployment/update/windows-update-logs)
- [SetupAPI device installation log entries (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-hardware/drivers/install/setupapi-device-installation-log-entries)
- [about_Logging_Windows (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_logging_windows) — PowerShell のログ
