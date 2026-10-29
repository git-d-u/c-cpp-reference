# Windows 1. 標準的なディレクトリ構成

[目次](../index.md) | [次: セキュリティ上重要な場所 →](02-security.md)

---

> 対象は **Windows 7 〜 Windows 11** です。フォルダ構成の大枠は Windows Vista で今の形になり、7 から 11 まで共通しています。版によって違う箇所には注記を付けています。

!!! warning "サポートが終了した版"
    - Windows 7 は 2020年1月14日（米国時間）に延長サポートが終了しました。
    - Windows 10（Home / Pro など）は 2025年10月14日（米国時間）にサポートが終了しました。
    - サポートが終わった版には、セキュリティ更新が提供されません（有償の延長セキュリティ更新プログラム（ESU）を契約している場合を除く）。

## 1.1 全体像（C ドライブ）

```
C:\
├── Windows\                Windows 本体
│   ├── System32\           64ビットのシステムファイル・コマンド
│   ├── SysWOW64\           32ビット用のシステムファイル（64ビット版 Windows のみ）
│   ├── Temp\               システムの一時ファイル
│   ├── Logs\               各種ログ
│   ├── Prefetch\           起動を速くするための情報（実行履歴の手掛かりにもなる）
│   └── WinSxS\             コンポーネントの保管場所（巨大だが手動で消さない）
├── Program Files\          64ビットのアプリ
├── Program Files (x86)\    32ビットのアプリ（64ビット版 Windows のみ）
├── ProgramData\            全ユーザー共通のアプリのデータ（隠しフォルダ）
├── Users\                  ユーザーごとのフォルダ
│   ├── <ユーザー名>\
│   ├── Public\             全ユーザーで共有するフォルダ
│   └── Default\            新しいユーザーを作るときのひな形（隠しフォルダ）
├── $Recycle.Bin\           ごみ箱（隠し・システムフォルダ）
├── System Volume Information\  復元ポイントなど（システムのみアクセス可）
├── Recovery\               回復環境
├── pagefile.sys            仮想メモリ（隠し・システムファイル）
└── hiberfil.sys            休止状態のデータ（休止状態が有効な場合）
```

隠しフォルダは、エクスプローラーの「表示」で「隠しファイル」にチェックを入れると表示されます。`$Recycle.Bin` などのシステムファイルは、「保護されたオペレーティングシステムファイルを表示しない」のチェックも外さないと表示されません。

## 1.2 System32 と SysWOW64 の関係

64ビット版 Windows では、名前と中身の関係が直感と逆なので注意が必要です。

| フォルダ | 中身 |
|---------|------|
| `C:\Windows\System32` | **64ビット** のシステムファイル |
| `C:\Windows\SysWOW64` | **32ビット** のシステムファイル |

- 32ビットのアプリが `System32` にアクセスすると、Windows が自動的に `SysWOW64` に振り替えます（ファイルシステムのリダイレクト）。
- 32ビットのアプリから本当の `System32` を見たいときは、`C:\Windows\Sysnative` というパスを使います（64ビットのアプリからは使えません）。
- `System32\drivers\etc` や `System32\LogFiles` など一部のフォルダは、振り替えの対象外です。

`System32` の中の主な場所:

| パス | 内容 |
|------|------|
| `System32\drivers\` | デバイスドライバ（`.sys`） |
| `System32\drivers\etc\hosts` | ホスト名と IP アドレスの対応表 |
| `System32\config\` | レジストリの本体（`SAM`、`SECURITY`、`SYSTEM`、`SOFTWARE`） |
| `System32\winevt\Logs\` | イベントログ（`.evtx`）（[3章](03-logs.md)） |
| `System32\Tasks\` | タスクスケジューラのタスク定義 |
| `System32\LogFiles\` | ファイアウォールなどのログ |

## 1.3 ユーザーフォルダ（C:\Users\<ユーザー名>）

| フォルダ | 環境変数 | 内容 |
|---------|---------|------|
| `C:\Users\<名前>` | `%USERPROFILE%` | そのユーザーのホーム |
| `Desktop`、`Documents`、`Downloads` など | | デスクトップ、ドキュメント、ダウンロード |
| `AppData\Roaming` | `%APPDATA%` | アプリの設定（ドメイン環境で「移動プロファイル」を使うと、他の PC にも引き継がれる） |
| `AppData\Local` | `%LOCALAPPDATA%` | その PC だけのアプリのデータ、キャッシュ |
| `AppData\Local\Temp` | `%TEMP%` | ユーザーの一時ファイル |
| `AppData\LocalLow` | | 権限の低い状態で動くアプリ（ブラウザの保護モードなど）のデータ |
| `NTUSER.DAT` | | そのユーザーのレジストリ（`HKEY_CURRENT_USER` の本体。隠しファイル） |

`AppData` は隠しフォルダです。エクスプローラーのアドレスバーに `%APPDATA%` などと入力すると直接開けます。

## 1.4 アプリのインストール先

| フォルダ | 環境変数 | 内容 |
|---------|---------|------|
| `C:\Program Files` | `%ProgramFiles%` | 64ビットのアプリ。書き込みには管理者権限が必要 |
| `C:\Program Files (x86)` | `%ProgramFiles(x86)%` | 32ビットのアプリ |
| `C:\ProgramData` | `%ProgramData%` | 全ユーザー共通のアプリのデータや設定 |
| `%LOCALAPPDATA%\Programs` | | 管理者権限なしで入れたアプリ（ユーザーごと） |

## 1.5 よく使う環境変数

| 環境変数 | 通常の値 |
|---------|---------|
| `%SystemDrive%` | `C:` |
| `%SystemRoot%`、`%windir%` | `C:\Windows` |
| `%USERPROFILE%` | `C:\Users\<名前>` |
| `%APPDATA%` | `C:\Users\<名前>\AppData\Roaming` |
| `%LOCALAPPDATA%` | `C:\Users\<名前>\AppData\Local` |
| `%TEMP%`、`%TMP%` | `C:\Users\<名前>\AppData\Local\Temp` |
| `%ProgramData%`、`%ALLUSERSPROFILE%` | `C:\ProgramData` |
| `%PUBLIC%` | `C:\Users\Public` |

```powershell
# PowerShell
$env:APPDATA
Get-ChildItem Env:                    # 環境変数の一覧
```

```bat
rem コマンドプロンプト
echo %APPDATA%
set                                   & rem 環境変数の一覧
```

## 1.6 版ごとの主な違い

フォルダの基本構成は 7 〜 11 で同じです。目立つ違いは、Windows 10 / 11 では OneDrive のバックアップ機能によって、一部のユーザーフォルダの場所が変わる場合があることです。

!!! tip "フォルダが OneDrive に移されていないか"
    Windows 10 / 11 では、OneDrive のバックアップ機能を有効にすると「デスクトップ」「ドキュメント」「ピクチャ」が `C:\Users\<名前>\OneDrive\` 以下に移ります。
    ファイルが見つからないときは、`OneDrive` フォルダの中も確認します。

## 参考資料

- [KNOWNFOLDERID (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows/win32/shell/knownfolderid) — 標準フォルダの既定のパス
- [File System Redirector (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows/win32/winprog64/file-system-redirector) — System32 と SysWOW64
- [Windows 7 のライフサイクル](https://learn.microsoft.com/ja-jp/lifecycle/products/windows-7) / [Windows 10 Home and Pro のライフサイクル](https://learn.microsoft.com/ja-jp/lifecycle/products/windows-10-home-and-pro)
