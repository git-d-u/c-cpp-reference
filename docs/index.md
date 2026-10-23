# C / C++ 基本リファレンス

C言語とC++の基本的な文法・標準ライブラリに加え、アセンブラ（x86-64）・SQL・PHP・JavaScript・Python・PowerShell・Linux・Windows の基本をまとめたリファレンスです。
スマホでも読みやすいよう、検索・ダークモード・コードのコピーに対応しています。

> 対象規格: C は **C11/C17** を基準、C++ は **C++17** を基準とし、C++20 以降の機能には注記を付けています。

## C言語

<div class="grid cards" markdown>

-   **[1. 基本文法とデータ型](c/01-basics.md)**

    ---

    プログラム構造、型、変数、定数、演算子

-   **[2. 制御構文](c/02-control-flow.md)**

    ---

    if / switch / for / while / do-while / break / continue / goto

-   **[3. 関数](c/03-functions.md)**

    ---

    宣言と定義、引数渡し、再帰、static、可変長引数

-   **[4. 配列・ポインタ・文字列](c/04-pointers-arrays.md)**

    ---

    配列、ポインタ演算、文字列、関数ポインタ

-   **[5. 構造体・共用体・列挙型](c/05-structs.md)**

    ---

    struct / union / enum / typedef

-   **[6. 動的メモリ管理](c/06-memory.md)**

    ---

    malloc / calloc / realloc / free、記憶域期間

-   **[7. 標準ライブラリ](c/07-stdlib.md)**

    ---

    stdio.h / string.h / stdlib.h / math.h / ctype.h ほか

-   **[8. プリプロセッサ](c/08-preprocessor.md)**

    ---

    #include / #define / 条件コンパイル / マクロ

</div>

## C++

<div class="grid cards" markdown>

-   **[1. C++の基本（Cとの違い）](cpp/01-basics.md)**

    ---

    iostream、名前空間、参照、オーバーロード、bool、string

-   **[2. クラスとオブジェクト指向](cpp/02-classes.md)**

    ---

    クラス、コンストラクタ、継承、仮想関数、演算子オーバーロード

-   **[3. テンプレート](cpp/03-templates.md)**

    ---

    関数テンプレート、クラステンプレート、特殊化、可変引数

-   **[4. STL コンテナ](cpp/04-stl-containers.md)**

    ---

    vector / map / set / unordered_map / deque / array ほか

-   **[5. STL アルゴリズムとイテレータ](cpp/05-stl-algorithms.md)**

    ---

    sort / find / transform / accumulate ほか

-   **[6. メモリ管理とスマートポインタ](cpp/06-memory.md)**

    ---

    new/delete、RAII、unique_ptr / shared_ptr / weak_ptr

-   **[7. モダンC++](cpp/07-modern-cpp.md)**

    ---

    auto、ラムダ、範囲for、ムーブ、constexpr、optional ほか

-   **[8. 例外処理](cpp/08-exceptions.md)**

    ---

    try / catch / throw、標準例外、noexcept

</div>

## アセンブラ（x86-64）

<div class="grid cards" markdown>

-   **[1. 基本とレジスタ・構文](asm/01-basics.md)**

    ---

    レジスタ、フラグ、Intel 構文と AT&T 構文、アドレッシング、スタック

-   **[2. 命令と読み方](asm/02-reading.md)**

    ---

    よく出る命令、条件分岐とループ、呼び出し規約、逆アセンブルの手順

-   **[3. つまずきポイントと解き方](asm/03-pitfalls.md)**

    ---

    構文の向き、lea、符号、引数レジスタ、スタックのアライメント、最適化

</div>

## SQL

<div class="grid cards" markdown>

-   **[1. 基本構文](sql/01-syntax.md)**

    ---

    DDL / DML、SELECT の実行順、JOIN、サブクエリ、ウィンドウ関数、トランザクション

-   **[2. 権限と GRANT OPTION](sql/02-grant.md)**

    ---

    GRANT / REVOKE、WITH GRANT OPTION、CASCADE、ロール（PostgreSQL / MySQL）

-   **[3. DB・テーブル・カラムの確認と information_schema](sql/03-metadata.md)**

    ---

    DB・テーブル・列の一覧の出し方、制約の確認、information_schema の構造と役割、セキュリティとの関係

</div>

## PHP

<div class="grid cards" markdown>

-   **[1. 構文と使い方](php/01-syntax.md)**

    ---

    変数・配列・比較・match・関数・クラス・例外、フォームの受け取り、PDO、8.x の新機能

-   **[2. セキュリティ対策とやってはいけない例](php/02-security.md)**

    ---

    SQL インジェクション、XSS、CSRF、セッション、パスワード保存、コマンド・ファイル操作、危険な関数

</div>

## JavaScript

<div class="grid cards" markdown>

-   **[1. 動作条件と処理の流れ](javascript/01-runtime.md)**

    ---

    ブラウザと Node.js、script の defer / async / module、ページ表示の流れ、イベントループ

-   **[2. 構文](javascript/02-syntax.md)**

    ---

    const / let、型と変換、比較、制御構文、配列・オブジェクト、クラス、例外、モジュール

-   **[3. 関数の解説と使い方](javascript/03-functions.md)**

    ---

    関数の書き方、引数、クロージャ、コールバック、配列の便利な関数、Promise と async / await

-   **[4. HTML・PHP との組み合わせ](javascript/04-html-php.md)**

    ---

    DOM 操作、イベントとフォーム、PHP からの値の渡し方、fetch で PHP と通信、セキュリティ

</div>

## Python

<div class="grid cards" markdown>

-   **[1. 基本構文と型の変換](python/01-basics.md)**

    ---

    型、文字列、リスト・辞書、制御構文、関数、クラス、例外、ファイル、int・str・chr・ord・bytes などの型変換

-   **[2. 便利な関数と、使わない場合の書き方](python/02-builtins.md)**

    ---

    len・sum・max・sorted・enumerate・zip・map・any・join・Counter などと、同じ処理をループで書いた例

</div>

## PowerShell

<div class="grid cards" markdown>

-   **[1. 版ごとの違いと基本構文](powershell/01-versions.md)**

    ---

    Windows PowerShell 1.0〜5.1 と PowerShell 7 の違い、変数・比較演算子・パイプライン・関数、7 で追加された演算子

-   **[2. セキュアなコーディングとダメな例](powershell/02-secure-coding.md)**

    ---

    Invoke-Expression、資格情報の扱い、実行ポリシー、証明書の検証、入力の検証、ログへの漏えい、PSScriptAnalyzer

-   **[3. SSH・ファイル転送・リモート操作](powershell/03-remote.md)**

    ---

    OpenSSH（鍵認証・設定ファイル・踏み台・トンネル）、scp / sftp、WinRM と SSH のリモート、FTP / FTPS、つながらないときの確認

</div>

## Linux

<div class="grid cards" markdown>

-   **[1. 標準的なディレクトリ構成](linux/01-directories.md)**

    ---

    FHS、/etc /usr /var の中身、よく使う確認コマンド

-   **[2. セキュリティ上重要な場所](linux/02-security.md)**

    ---

    passwd / shadow、sudoers、SSH、パーミッションと SUID、不審なプロセスの調べ方

-   **[3. ログの場所と見方](linux/03-logs.md)**

    ---

    journald と rsyslog、ディストリ別のログの場所、認証ログの読み方、last / lastb

-   **[4. シェルスクリプトとワンライナー](linux/04-shell-script.md)**

    ---

    変数とクォート、条件分岐・ループ・関数・配列、リダイレクト、set -euo pipefail、ワンライナーの注意事項

</div>

## Windows（7 〜 11）

<div class="grid cards" markdown>

-   **[1. 標準的なディレクトリ構成](windows/01-directories.md)**

    ---

    System32 と SysWOW64、ユーザーフォルダと AppData、環境変数

-   **[2. セキュリティ上重要な場所](windows/02-security.md)**

    ---

    自動起動の場所（スタートアップ・Run キー・タスク・サービス）、アカウント、NTFS 権限

-   **[3. ログの場所と見方](windows/03-logs.md)**

    ---

    イベントログ、重要なイベント ID とログオンの種類、Get-WinEvent、監査ポリシー

</div>

## 付録

<div class="grid cards" markdown>

-   **[C と C++ の主な違い早見表](appendix/c-vs-cpp.md)**

    ---

    同じ処理を C と C++ で書き比べ

-   **[コンパイルとビルドの基本](appendix/build.md)**

    ---

    GCC / MSVC / CMake / Make

-   **[型変換の早見表](appendix/type-conversion.md)**

    ---

    C / C++ / Python / PHP / SQL / PowerShell / bash / アセンブラの型変換を比較

</div>

## 参考資料（一次情報）

- [cppreference.com](https://en.cppreference.com/) — C / C++ 標準の網羅的なリファレンス（[日本語版](https://ja.cppreference.com/)）
- [cpprefjp](https://cpprefjp.github.io/) — 日本語の C++ リファレンス
- [ISO C++ 委員会 (WG21)](https://isocpp.org/std/the-standard) — C++ 規格
- [ISO C 委員会 (WG14)](https://www.open-std.org/jtc1/sc22/wg14/) — C 規格
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) — モダンC++のガイドライン

- [Intel SDM](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html) — x86-64 命令の公式仕様
- [PHP マニュアル](https://www.php.net/manual/ja/)
- [MDN Web Docs（JavaScript）](https://developer.mozilla.org/ja/docs/Web/JavaScript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/) / [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [Windows のセキュリティ監査イベント (Microsoft Learn)](https://learn.microsoft.com/ja-jp/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor)

## 表記について

- コード例は、特記がない限り単体でコンパイル可能な形、または関数内の断片として記載しています。
- `// => 値` は、その行の結果（出力や評価値）を示します。
- 「未定義動作 (UB: Undefined Behavior)」は規格上動作が保証されないことを表します。
