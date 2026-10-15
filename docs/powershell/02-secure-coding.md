# PowerShell 2. セキュアなコーディングとダメな例

[← 前: 版ごとの違いと基本構文](01-versions.md) | [目次](../index.md) | [次: SSH・ファイル転送・リモート操作 →](03-remote.md)

---

> 各項目は「ダメな例（NG）」→「正しい書き方（OK）」→「理由」の順に書いています。特に断りがない例は、Windows PowerShell 5.1 と PowerShell 7 の両方で動きます。

## 2.1 一覧

| ダメな書き方 | 起きること | 代わりに |
|------------|----------|---------|
| 入力を `Invoke-Expression` に渡す | 入力に書かれた任意のコマンドが実行される | パラメータを決めておき、呼び出し演算子 `&` で実行 |
| パスワードをスクリプトに直接書く | ファイルの共有・Git・バックアップから漏れる | `Get-Credential`、資格情報の保管庫 |
| `ConvertTo-SecureString -AsPlainText` に平文を書く | 平文のパスワードがスクリプトに残る | 上と同じ |
| 実行ポリシーを安全対策だと考える | 簡単に回避できる | 署名、権限の管理、ログ |
| 証明書の検証を無効にする | 通信の盗聴・改ざんに気づけない | 正しい証明書を使う |
| ダウンロードした内容をそのまま実行する | 中身を確認しないまま実行される | 保存して中身と署名・ハッシュを確認してから実行 |
| 入力を検証せずにパスやコマンドに使う | 意図しないファイルの操作 | パラメータの検証属性、`-LiteralPath` |
| エラーを無視する | 失敗に気づかず処理が続く | `-ErrorAction Stop` と `try` / `catch` |
| パスワードを画面やログに出す | ログやトランスクリプトに残る | 出力しない |

## 2.2 Invoke-Expression を使わない

```powershell
# NG：入力した文字列を、そのままコマンドとして実行している
$name = Read-Host "サービス名"
Invoke-Expression "Get-Service $name"
# 「spooler; Remove-Item C:\data -Recurse」と入力されると、2 つ目のコマンドも実行される
```

```powershell
# OK：コマンドは決めておき、入力は「値」として渡す
$name = Read-Host "サービス名"
Get-Service -Name $name
```

- Microsoft のドキュメントでも、`Invoke-Expression` で利用者が入力したコマンドを実行する場合は、安全か確かめるよう注意されています。さらに、自由な入力を受け付けるより、あらかじめ決めた選択肢を使う設計が勧められています。
- ほとんどの場合は、呼び出し演算子 `&` で同じことができます。こちらのほうが安全とされています。

```powershell
# 実行するコマンドを変数で切り替えたいとき（コマンドレットにはハッシュテーブルで渡す）
$cmd    = "Get-ChildItem"
$params = @{ Path = "C:\Temp"; File = $true }
& $cmd @params        # スプラッティング：-Path C:\Temp -File と同じ

# 外部プログラム（.exe）には、引数を配列で渡す
$exeArgs = @("/c", "echo", "hello")
& cmd.exe $exeArgs
```

> 外部のプログラム（`.exe`）を呼ぶときは、引数を 1 つの文字列につなげず、配列で渡します。コマンドレットに `@("-Path", "C:\Temp")` のような配列を渡すと、`-Path` はパラメータ名ではなく、ただの文字列として扱われてしまうので注意が必要です。Windows でバッチファイル（`.bat` / `.cmd`）に引数を渡すと、`cmd.exe` が引数を解釈するため、信頼できない入力は渡さないよう Microsoft のドキュメントで警告されています。

## 2.3 パスワードを書かない

```powershell
# NG：平文のパスワードがスクリプトに残る
$user = "<user>"
$pass = "<pass>"
$secure = ConvertTo-SecureString $pass -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($user, $secure)
```

```powershell
# OK①：実行するたびに入力してもらう
$cred = Get-Credential -UserName "<user>" -Message "接続に使うアカウント"

# OK②：Windows で、同じユーザー・同じ PC から使うだけなら、暗号化して保存できる
$cred | Export-Clixml -Path "$env:USERPROFILE\task.cred.xml"   # 保存（初回だけ）
$cred = Import-Clixml -Path "$env:USERPROFILE\task.cred.xml"   # 読み込み
```

!!! warning "Export-Clixml で暗号化されるのは Windows だけ"
    Windows では、Windows のデータ保護 API（DPAPI）で暗号化されます。保存したユーザーが、保存した PC でしか復号できません。
    **Linux と macOS では暗号化されず**、平文の文字の並びとして保存されます（見た目が変わるだけ）。

### 関数の引数で資格情報を受け取る

```powershell
# NG：ユーザー名とパスワードを文字列で受け取る
function Connect-Server {
    param([string]$UserName, [string]$Password)
}

# OK：PSCredential 型で受け取る
function Connect-Server {
    param(
        [Parameter(Mandatory)]
        [System.Management.Automation.PSCredential]
        [System.Management.Automation.Credential()]
        $Credential
    )
}
```

### SecureString の限界

- Microsoft は、新しく作る .NET のプログラムでは `SecureString` を使わないよう勧めています。
- Windows 以外の OS では、`SecureString` の中身は暗号化されません。
- 使うときには平文に戻す必要があるため、メモリの中に平文が残る時間を短くできるだけです。

業務で使う資格情報は、保管庫（パスワード管理ツールやクラウドのキー保管サービスなど）に置き、スクリプトからはそこを参照する形にします。PowerShell には、保管庫を共通の書き方で扱うための `Microsoft.PowerShell.SecretManagement` モジュールがあります。ただし、このモジュールは機能の追加を終えていて、今後はセキュリティと重大な不具合の修正だけが行われます。

## 2.4 実行ポリシーはセキュリティの境界ではない

```powershell
Get-ExecutionPolicy -List                                    # 今の設定を確認
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

| ポリシー | 内容 |
|---------|------|
| `Restricted` | スクリプトを実行しない（Windows クライアントで何も設定されていないときの動き） |
| `RemoteSigned` | インターネットから取得したスクリプトには署名が必要（Windows の既定） |
| `AllSigned` | すべてのスクリプトに署名が必要 |
| `Bypass` | 何も制限しない |

!!! danger "実行ポリシーだけに頼らない"
    Microsoft のドキュメントでは、実行ポリシーは **セキュリティの境界ではなく**、うっかりスクリプトを実行してしまうことを防ぐための仕組みと説明されています。スクリプトの中身をコマンドラインに直接打ち込めば、ポリシーに関係なく実行できます。
    また、Windows 以外の OS では実行ポリシーは常に `Unrestricted` で、変更できません。

```powershell
# NG：ポリシーが邪魔だからと、恒久的に無効にする
Set-ExecutionPolicy Bypass -Scope LocalMachine
```

業務で配布するスクリプトは、コード署名をして `AllSigned` で運用するのが基本です。

## 2.5 証明書の検証を無効にしない

```powershell
# NG（Windows PowerShell 5.1 でよく見る書き方）：すべての証明書を信頼してしまう
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# NG（PowerShell 7）
Invoke-RestMethod -Uri "https://example.com/api" -SkipCertificateCheck
```

- `-SkipCertificateCheck` について、Microsoft のドキュメントには「安全ではなく推奨されない。テスト目的で、自己署名証明書を使う既知のホストに対してだけ使う」と書かれています。
- 社内のサーバーで自己署名証明書を使っている場合は、検証を無効にするのではなく、その証明書（または社内の認証局の証明書）を、信頼された証明書として登録します。

## 2.6 ダウンロードした内容をそのまま実行しない

```powershell
# NG：取得した内容を、確認せずに実行する
Invoke-Expression (Invoke-WebRequest -Uri "https://example.com/install.ps1" -UseBasicParsing).Content
```

```powershell
# OK：保存して、中身・署名・ハッシュを確認してから実行する
$path = Join-Path $env:TEMP "install.ps1"
Invoke-WebRequest -Uri "https://example.com/install.ps1" -OutFile $path -UseBasicParsing

Get-Content $path                          # 中身を読む
Get-AuthenticodeSignature $path            # 署名の確認（Valid か、発行元は正しいか）
(Get-FileHash $path -Algorithm SHA256).Hash   # 公開されているハッシュ値と比べる
```

## 2.7 入力を検証する

関数やスクリプトの引数は、`param()` の検証属性で、受け付ける値を絞り込みます。

```powershell
function Set-AppMode {
    param(
        [Parameter(Mandatory)]
        [ValidateSet("Dev", "Test", "Prod")]          # 決まった値だけを受け付ける
        [string]$Environment,

        [ValidateRange(1, 65535)]                     # 数値の範囲
        [int]$Port = 8080,

        [ValidatePattern('^[a-zA-Z0-9_-]{1,32}$')]    # 正規表現（英数字・_・- の 32 文字まで）
        [string]$Name = "app",

        [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
        [string]$Folder = $PWD.Path
    )
    "$Environment / $Port / $Name / $Folder"
}

Set-AppMode -Environment Prod -Port 443
Set-AppMode -Environment Other    # エラー：Dev, Test, Prod 以外は受け付けない
```

### ファイルのパス

```powershell
# NG：-Path ではワイルドカードとして解釈される
Remove-Item -Path $userInput             # 入力が "*" だと、すべて消える

# OK：-LiteralPath は入力をそのままのパスとして扱う
Remove-Item -LiteralPath $userInput -WhatIf    # -WhatIf で、まず何が消えるか確認する
```

決まったフォルダの中だけを扱いたいときは、実際のパスに変換してから確かめます。

```powershell
$base = (Resolve-Path -LiteralPath "C:\AppData").ProviderPath
$full = [System.IO.Path]::GetFullPath((Join-Path $base $fileName))
if (-not $full.StartsWith($base + [System.IO.Path]::DirectorySeparatorChar,
                          [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "指定されたフォルダの外は扱えません: $fileName"
}
```

> `$fileName` に `..\..\Windows\win.ini` のような値が入っても、フォルダの外を指していれば止まります。

## 2.8 エラーと実行環境の設定

```powershell
# スクリプトの先頭に書く
Set-StrictMode -Version Latest       # 未定義の変数や、存在しないプロパティの参照をエラーにする
$ErrorActionPreference = 'Stop'      # エラーが起きたら止める
```

```powershell
# NG：エラーを握りつぶす
try { Remove-Item $path } catch { }

# OK：少なくとも記録して、必要なら止める
try {
    Remove-Item -LiteralPath $path -ErrorAction Stop
} catch {
    Write-Error "削除に失敗しました: $path - $($_.Exception.Message)"
    throw
}
```

### 変更を伴う関数には -WhatIf と -Confirm を付ける

```powershell
function Remove-OldLog {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param([Parameter(Mandatory)][string]$Folder, [int]$Days = 30)

    Get-ChildItem -LiteralPath $Folder -File |
        Where-Object LastWriteTime -lt (Get-Date).AddDays(-$Days) |
        ForEach-Object {
            if ($PSCmdlet.ShouldProcess($_.FullName, "削除")) {
                Remove-Item -LiteralPath $_.FullName
            }
        }
}

Remove-OldLog -Folder "C:\Logs" -WhatIf    # 実際には消さず、消す対象だけを表示
```

## 2.9 秘密の情報をログに残さない

```powershell
# NG：パスワードやトークンを表示・記録する
Write-Host "接続します: $user / $pass"
Start-Transcript -Path C:\Logs\session.txt     # この後に表示したものは、すべてファイルに残る
```

- `Start-Transcript` で記録しているときに表示したものは、すべてファイルに残ります。
- PowerShell のスクリプトブロックのログ（イベントログに実行内容を記録する機能）を有効にしていると、スクリプトに書かれた資格情報もイベントログに記録されることがあると、Microsoft のドキュメントで注意されています。
- コマンドの履歴（`Get-History` や、PSReadLine の履歴ファイル）にも、入力したコマンドが残ります。パスワードはコマンドの引数に直接書かないようにします。

```powershell
# PSReadLine の履歴ファイルの場所
(Get-PSReadLineOption).HistorySavePath
```

## 2.10 一時ファイル

```powershell
# NG：決まった名前の一時ファイル（ほかのユーザーやプログラムと衝突する・先に作られる）
$tmp = "C:\Temp\work.txt"

# OK：推測されにくい名前で作る
$tmp = New-TemporaryFile
try {
    "データ" | Set-Content -LiteralPath $tmp
    # ... 処理 ...
} finally {
    Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue   # 必ず消す
}
```

## 2.11 スクリプトを自動でチェックする（PSScriptAnalyzer）

```powershell
Install-Module -Name PSScriptAnalyzer -Scope CurrentUser
Invoke-ScriptAnalyzer -Path .\myscript.ps1
```

セキュリティに関係する主なルール:

| ルール | 重要度 | 指摘する内容 |
|-------|-------|------------|
| `AvoidUsingConvertToSecureStringWithPlainText` | Error | 平文から SecureString を作っている |
| `AvoidUsingUsernameAndPasswordParams` | Error | ユーザー名とパスワードを別々の引数で受け取っている |
| `AvoidUsingComputerNameHardcoded` | Error | コンピューター名を直接書いている |
| `AvoidUsingPlainTextForPassword` | Warning | パスワードを文字列型の引数で受け取っている |
| `AvoidUsingInvokeExpression` | Warning | `Invoke-Expression` を使っている |
| `AvoidUsingAllowUnencryptedAuthentication` | Warning | 暗号化されていない認証を許可している |
| `AvoidUsingBrokenHashAlgorithms` | Warning | MD5・SHA1 などの弱いハッシュを使っている |
| `UsePSCredentialType` | Warning | 資格情報を PSCredential 型で受け取っていない |
| `AvoidUsingEmptyCatchBlock` | Warning | 空の `catch`（エラーの握りつぶし） |

## 2.12 チェックリスト

- [ ] `Invoke-Expression` に、利用者の入力や外部から取得した内容を渡していない
- [ ] パスワードやトークンをスクリプトに直接書いていない
- [ ] 資格情報は `PSCredential` 型で受け取っている
- [ ] 証明書の検証を無効にしていない
- [ ] 外部から取得したスクリプトは、中身と署名・ハッシュを確認してから実行している
- [ ] 引数を検証属性（`ValidateSet` など）で絞り込んでいる
- [ ] 利用者が指定したパスは `-LiteralPath` で扱い、フォルダの外に出ないか確認している
- [ ] `Set-StrictMode` と `$ErrorActionPreference = 'Stop'` を設定している
- [ ] 変更を伴う関数は `-WhatIf` に対応している
- [ ] 秘密の情報を画面・ログ・履歴に残していない
- [ ] `Invoke-ScriptAnalyzer` で警告が出ていない

## 参考資料

- [Invoke-Expression (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.utility/invoke-expression)
- [about_Execution_Policies (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_execution_policies)
- [Export-Clixml (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.utility/export-clixml) — 資格情報の保存
- [SecureString クラス (Microsoft Learn)](https://learn.microsoft.com/ja-jp/dotnet/api/system.security.securestring)
- [SecretManagement の概要 (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/utility-modules/secretmanagement/overview)
- [Invoke-WebRequest (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.utility/invoke-webrequest) — `-SkipCertificateCheck`
- [about_Quoting_Rules (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_quoting_rules) — 外部コマンドへの引数の渡し方
- [about_Logging_Windows (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_logging_windows)
- [PSScriptAnalyzer のルール一覧 (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/utility-modules/psscriptanalyzer/rules/readme)
