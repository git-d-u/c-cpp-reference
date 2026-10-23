# PowerShell 1. 版ごとの違いと基本構文

[目次](../index.md) | [次: セキュアなコーディングとダメな例 →](02-secure-coding.md)

---

## 1.1 2種類の PowerShell

PowerShell には大きく分けて 2 種類あります。どちらを使っているかで、使える構文が変わります。

| 項目 | Windows PowerShell | PowerShell（旧 PowerShell Core） |
|------|-------------------|----------------------------------|
| 版 | 1.0 〜 5.1 | 6.x 〜 7.x |
| 実行ファイル | `powershell.exe` | `pwsh.exe`（Linux / macOS は `pwsh`） |
| 土台 | .NET Framework | .NET（旧 .NET Core） |
| 動く OS | Windows のみ | Windows・Linux・macOS |
| 入手方法 | Windows に標準で入っている | 別途インストール（5.1 と同時に使える） |
| 今後 | 5.1 で開発終了（Windows の一部としてサポート） | 新機能はこちらに追加される |

今の版は、次のコマンドで確認できます。

```powershell
$PSVersionTable.PSVersion     # 例: 5.1.xxxxx / 7.6.x
$PSVersionTable.PSEdition     # Desktop（Windows PowerShell）/ Core（PowerShell 6 以降）
```

## 1.2 版の歴史

### Windows PowerShell

| 版 | 公開 | 入手先 |
|----|------|-------|
| 1.0 | 2006年11月 | Windows Server 2008 の追加機能 |
| 2.0 | 2009年7月 | Windows 7 / Server 2008 R2 |
| 3.0 | 2012年10月 | Windows 8 / Server 2012 |
| 4.0 | 2013年10月 | Windows 8.1 / Server 2012 R2 |
| 5.0 | 2016年2月 | Windows Management Framework（WMF）5.0。クラス（`class`）と列挙型（`enum`）が追加された |
| 5.1 | 2016年8月 | Windows 10 / Server 2016 以降に標準 |

> Microsoft は 5.1 より前の Windows PowerShell をサポートしていません。

### PowerShell（6 以降）

| 版 | 公開 | サポート終了 | 種類 | 土台の .NET |
|----|------|------------|------|-----------|
| 6.0 〜 6.2 | 2018〜2019年 | 終了済み | — | .NET Core 2.x |
| 7.0 | 2020年3月 | 終了済み | LTS | .NET Core 3.1 |
| 7.1 〜 7.3 | 2020〜2022年 | 終了済み | — | .NET 5〜7 |
| 7.4 | 2023年11月 | 2026年11月10日 | LTS | .NET 8 |
| 7.5 | 2025年1月 | 2026年11月10日 | 安定版 | .NET 9 |
| 7.6 | 2026年3月 | 2028年11月14日 | LTS | .NET 10 |

- **LTS**（長期サポート）は約3年サポートされます。業務で長く使うなら LTS を選びます。
- 2026年10月時点の最新の LTS は 7.6 です。7.4 と 7.5 は 2026年11月10日にサポートが終わります。

## 1.3 どの版でも使える基本構文

ここに書いた構文は、Windows PowerShell 5.1 と PowerShell 7 のどちらでも使えます。

### 変数と型

```powershell
$name  = "Taro"           # 文字列
$count = 10               # 整数
$price = 1.5              # 小数
$flag  = $true            # 真偽値（$true / $false）
$empty = $null            # 値なし

[int]$n = "42"            # 型を指定すると、その型に変換される
$n.GetType().Name         # Int32
```

### 文字列

```powershell
$name = "Taro"
"Hello, $name"            # ダブルクォート: 変数が展開される → Hello, Taro
'Hello, $name'            # シングルクォート: そのまま → Hello, $name
"合計: $($count * 2)"     # 式は $() で囲む
"Tab`tで区切る"           # エスケープ文字はバッククォート（`t タブ、`n 改行）

# 書式指定
"{0} は {1:N0} 円" -f "りんご", 1200     # りんご は 1,200 円
```

### 配列とハッシュテーブル

```powershell
$arr = @(1, 2, 3)
$arr += 4                 # 末尾に追加（実際は新しい配列を作り直す）
$arr[0]; $arr[-1]         # 1 と 4
$arr.Count                # 4

$user = @{ Name = "Taro"; Age = 20 }     # ハッシュテーブル
$user.Name                # Taro
$user["Age"]              # 20

$ordered = [ordered]@{ B = 2; A = 1 }    # 追加した順番を保つ
$obj = [pscustomobject]@{ Name = "Taro"; Age = 20 }   # オブジェクトを作る
```

### 比較演算子

PowerShell の比較演算子は、記号ではなく `-` で始まる文字です。

| 演算子 | 意味 | 大文字小文字を区別する版 |
|--------|------|----------------------|
| `-eq` / `-ne` | 等しい / 等しくない | `-ceq` / `-cne` |
| `-gt` / `-ge` | より大きい / 以上 | `-cgt` / `-cge` |
| `-lt` / `-le` | より小さい / 以下 | `-clt` / `-cle` |
| `-like` / `-notlike` | ワイルドカード（`*`、`?`） | `-clike` |
| `-match` / `-notmatch` | 正規表現 | `-cmatch` |
| `-contains` / `-in` | 配列に含まれる | `-ccontains` / `-cin` |
| `-and` / `-or` / `-not` / `!` | 論理演算 | — |

!!! warning "`>` や `=` は比較に使わない"
    `>` はファイルへの書き出し（リダイレクト）、`=` は代入です。
    `if ($a > 5)` と書くと、比較されずに `5` という名前のファイルが作られます。

既定では、`-eq` などは **大文字と小文字を区別しません**（`"ABC" -eq "abc"` は `$true`）。

### 制御構文

```powershell
if ($count -gt 5) {
    "多い"
} elseif ($count -eq 5) {
    "ちょうど"
} else {
    "少ない"
}

switch ($status) {
    "draft"     { "下書き" }
    "published" { "公開中" }
    default     { "不明" }
}

foreach ($item in $arr) { "値: $item" }
for ($i = 0; $i -lt 3; $i++) { $i }
while ($i -gt 0) { $i-- }
```

### パイプライン

PowerShell のパイプラインは、文字列ではなく **オブジェクト** を受け渡します。

```powershell
# CPU 時間の長い順に、上位 5 個のプロセスの名前と CPU を表示
Get-Process |
    Where-Object { $_.CPU -gt 10 } |
    Sort-Object CPU -Descending |
    Select-Object -First 5 Name, CPU

# 簡略構文（上の Where-Object と同じ意味）
Get-Process | Where-Object CPU -gt 10

# 各要素に処理をする
1..5 | ForEach-Object { $_ * 2 }
```

`$_` は「パイプラインで今流れているオブジェクト」です。`$PSItem` とも書けます。

### 関数

```powershell
function Get-Square {
    param(
        [Parameter(Mandatory)]   # 必須の引数
        [int]$Number
    )
    return $Number * $Number
}

Get-Square -Number 4      # 16
Get-Square 4              # 位置で渡すこともできる
```

> 関数の名前は `動詞-名詞` の形にします。使える動詞は `Get-Verb` で確認できます。

### エラー処理

```powershell
try {
    Get-Item "C:\not-exist.txt" -ErrorAction Stop   # Stop にすると catch で捕まえられる
} catch {
    "エラー: $($_.Exception.Message)"
} finally {
    "後片付け"
}
```

多くのコマンドレットのエラーは、既定では処理を止めない「継続するエラー」です。`try` / `catch` で捕まえるには、`-ErrorAction Stop` を付けるか、`$ErrorActionPreference = 'Stop'` を設定します。

### .Where() と .ForEach() メソッド

```powershell
(1..10).Where({ $_ % 2 -eq 0 })          # 2 4 6 8 10
(1..3).ForEach({ $_ * 10 })              # 10 20 30
```

## 1.4 5.0 で追加された構文（クラスと列挙型）

```powershell
# クラス（5.0〜）
class Person {
    [string]$Name
    [int]$Age

    Person([string]$name, [int]$age) {
        $this.Name = $name
        $this.Age  = $age
    }

    [string] Greet() {
        return "こんにちは、$($this.Name) です"
    }
}
$p = [Person]::new("Taro", 20)
$p.Greet()

# 列挙型（5.0〜）
enum Color { Red; Green; Blue }
[Color]::Green
```

## 1.5 PowerShell 7 で追加された構文

ここの構文は **Windows PowerShell 5.1 では使えません**（構文エラーになります）。

```powershell
# 三項演算子（7.0〜）
$msg = (Test-Path $path) ? "あります" : "ありません"

# パイプラインチェーン演算子（7.0〜）。前が成功したら / 失敗したら次を実行
Write-Output "1つ目" && Write-Output "2つ目"
Get-Item "C:\not-exist" || Write-Output "見つからないので代わりの処理"

# null 合体演算子（7.0〜）
$value = $null
$value ?? "既定値"        # 既定値
$value ??= 100            # $value が null のときだけ代入

# null 条件演算子（7.1〜。変数名は ${} で囲む）
${obj}?.Name
${arr}?[0]

# 並列処理（7.0〜）
1..5 | ForEach-Object -Parallel { Start-Sleep 1; $_ } -ThrottleLimit 5

# 詳しいエラー表示（7.0〜）
Get-Error
```

> `?.` と `?[]` は 7.0 では試験的な機能で、7.1 から正式な機能になりました。

5.1 と 7 の両方で動くスクリプトを書く場合は、上の構文を使わずに `if` / `else` で書きます。

```powershell
# 5.1 でも 7 でも動く書き方
if (Test-Path $path) { $msg = "あります" } else { $msg = "ありません" }
if ($null -eq $value) { $value = 100 }
```

## 1.6 版の違いで気をつけること

| 項目 | Windows PowerShell 5.1 | PowerShell 7 |
|------|----------------------|--------------|
| ファイルに書き出すときの既定の文字コード | コマンドによって違う。`Out-File` と `>` / `>>` は UTF-16 LE、`Set-Content` は ANSI（日本語環境では Shift_JIS 系） | すべて **BOM なしの UTF-8** |
| BOM なしの UTF-8 のスクリプトに日本語が入っている場合 | ANSI として読まれて文字化けし、誤動作することがある | 正しく読める |
| `curl` と入力したとき | `Invoke-WebRequest` の別名として動く（本物の curl を使うときは `curl.exe` と書く） | — |
| 一部の Windows 専用モジュール | そのまま使える | 動かないものがある（`Import-Module -UseWindowsPowerShell` で 5.1 経由で使える） |
| `ConvertFrom-Json` に JSON の配列を渡したとき | 配列全体を 1 つのオブジェクトとしてパイプラインに流す | 配列の要素を 1 つずつ流す（7.0 で変更） |

!!! tip "5.1 でも使うスクリプトは BOM 付き UTF-8 で保存する"
    日本語などの ASCII 以外の文字を含むスクリプトを 5.1 でも動かすなら、BOM 付きの UTF-8 で保存します。VS Code では、右下の文字コード表示から「エンコード付きで保存」→「UTF-8 with BOM」を選びます。

!!! tip "スクリプトに必要な版を書いておく"
    スクリプトの先頭に `#Requires -Version 7.0` と書くと、それより古い版で実行したときに、すぐ分かるエラーで止まります。

    ```powershell
    #Requires -Version 7.0
    ```

## 1.7 cmd（コマンドプロンプト）との対応

| やりたいこと | cmd | PowerShell | PowerShell の別名 |
|------------|-----|-----------|-----------------|
| ファイル一覧 | `dir` | `Get-ChildItem` | `dir`、`ls`、`gci` |
| 移動 | `cd` | `Set-Location` | `cd`、`sl` |
| 中身を表示 | `type` | `Get-Content` | `cat`、`type`、`gc` |
| コピー | `copy` | `Copy-Item` | `copy`、`cp` |
| 削除 | `del` | `Remove-Item` | `del`、`rm` |
| 文字列検索 | `findstr` | `Select-String` | `sls` |
| 環境変数 | `%PATH%` | `$env:PATH` | — |
| 前のコマンドの終了コード | `%ERRORLEVEL%` | `$LASTEXITCODE` | — |

> 別名（エイリアス）は対話的に使うと便利ですが、スクリプトには正式なコマンド名を書くほうが読みやすく、環境による違いも出にくくなります。

## 参考資料

- [PowerShell Support Lifecycle (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/scripting/install/powershell-support-lifecycle) — 版の一覧とサポート期間
- [What's new in PowerShell 7.0 (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/scripting/whats-new/what-s-new-in-powershell-70)
- [Differences between Windows PowerShell 5.1 and PowerShell 7.x (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/scripting/whats-new/differences-from-windows-powershell)
- [about_Character_Encoding (Microsoft Learn)](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_character_encoding) — 文字コードの違い
- [about_Comparison_Operators](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_comparison_operators)
