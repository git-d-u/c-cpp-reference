# C言語 9. OS コマンドの呼び出しと疑似コマンドの作成

[← 前: プリプロセッサ](08-preprocessor.md) | [目次](../index.md) | [C++ 1. 基本 →](../cpp/01-basics.md)

---

> この章の例は、Compiler Explorer で次のコンパイラを使い、`-std=c17 -Wall -Wextra`（MSVC は `/W4`）で **警告なしでコンパイルできること** を確認しています。
>
> - Linux 向け：gcc 15.3
> - Windows 向け：MinGW-w64 gcc 15.2、MSVC v19
>
> mycat・myls の実行結果も確認済みです。ただし、確認に使った環境には `/bin/sh` や `echo` などのコマンドがなかったため、**外部コマンドを実際に動かしたときの出力は確認できていません**（「コマンドが見つからない」場合のエラー処理だけ確認しました）。

## 9.1 呼び出し方の一覧と必要なヘッダ

| 方法 | OS | ヘッダ | シェルを通すか | 特徴 |
|------|----|-------|-------------|------|
| `system()` | 共通（C 標準） | `<stdlib.h>` | **通す**（Linux は `/bin/sh`、Windows は `cmd.exe`） | 一番簡単。入力を混ぜると危険 |
| `popen()` / `pclose()` | Linux など（POSIX） | `<stdio.h>` | 通す | コマンドの出力を読む・入力に書く |
| `_popen()` / `_pclose()` | Windows | `<stdio.h>` | 通す | 同上（名前の先頭に `_`） |
| `fork()` ＋ `execvp()` ＋ `waitpid()` | Linux など（POSIX） | `<unistd.h>`、`<sys/wait.h>` | **通さない** | 引数を配列で渡す。細かく制御できる |
| `posix_spawnp()` | Linux など（POSIX） | `<spawn.h>` | 通さない | fork ＋ exec をまとめて行う |
| `_spawnvp()` | Windows | `<process.h>` | 通さない | 引数を配列で渡す |
| `CreateProcessW()` | Windows | `<windows.h>` | 通さない | Windows の基本の方法。細かく制御できる |

> 「シェルを通す」方法では、`;`、`|`、`&`、`>` などの記号が **シェルに解釈されます**。利用者の入力を含める場合は、シェルを通さない方法を使います（9.5）。

!!! note "`-std=c17` で POSIX の関数を使うとき"
    `-std=c17` のように C の標準規格だけを指定すると、`popen()` などの POSIX の関数の宣言が隠れて、コンパイルエラーになります。ファイルの先頭（`#include` より前）に `#define _POSIX_C_SOURCE 200809L` を書くか、`-std=gnu17` を使います。この章の Linux 向けの例は、すべて先頭にこの行を書いています。

## 9.2 Linux（POSIX）での呼び出し

### system()：一番簡単な方法

```c
#define _POSIX_C_SOURCE 200809L   /* POSIX の関数を使えるようにする（#include より前に書く） */
#include <stdio.h>
#include <stdlib.h>      /* system() */
#include <sys/wait.h>    /* WIFEXITED, WEXITSTATUS（POSIX） */

int main(void)
{
    int status = system("echo hello from shell; exit 3");
    if (status == -1) {
        perror("system");
        return 1;
    }
    if (WIFEXITED(status)) {
        printf("終了コード: %d\n", WEXITSTATUS(status));
    }
    return 0;
}
```

- `system()` の戻り値は、そのままでは終了コードではありません。Linux では `WIFEXITED()` で正常終了かを確かめ、`WEXITSTATUS()` で終了コードを取り出します。
- シェルを起動できなかったときは、終了コード 127 になります（確認環境ではシェルがなかったため 127 でした）。

### popen()：コマンドの出力を読み込む

```c
#define _POSIX_C_SOURCE 200809L
#include <stdio.h>       /* popen(), pclose()（POSIX） */

int main(void)
{
    FILE *fp = popen("ls -1 /etc", "r");      /* "r" で出力を読む、"w" で入力に書く */
    if (fp == NULL) {
        perror("popen");
        return 1;
    }
    char buf[256];
    int n = 0;
    while (fgets(buf, sizeof buf, fp) != NULL) {
        printf("%d: %s", ++n, buf);
    }
    int status = pclose(fp);                  /* 必ず pclose で閉じる（終了も待つ） */
    printf("pclose の戻り値: %d\n", status);
    return 0;
}
```

### fork() ＋ execvp() ＋ waitpid()：シェルを通さない基本の方法

```c
#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>      /* fork(), execvp() */
#include <sys/types.h>   /* pid_t */
#include <sys/wait.h>    /* waitpid() */

int main(void)
{
    /* 引数を配列で渡す。シェルを通さないので、; や | は特別な意味を持たない */
    char *argv[] = { "echo", "a; rm -rf /tmp/x", NULL };

    pid_t pid = fork();
    if (pid == -1) {
        perror("fork");
        return 1;
    }
    if (pid == 0) {                     /* 子プロセス */
        execvp(argv[0], argv);          /* 成功すると戻ってこない */
        perror("execvp");               /* 戻ってきたら失敗 */
        _exit(127);
    }
    int status;                         /* 親プロセス：子の終了を待つ */
    if (waitpid(pid, &status, 0) == -1) {
        perror("waitpid");
        return 1;
    }
    if (WIFEXITED(status)) {
        printf("子の終了コード: %d\n", WEXITSTATUS(status));
    }
    return 0;
}
```

```
          fork()
親プロセス ──┬──────────────────────── waitpid() で子の終了を待つ ──▶
             │
             └─ 子プロセス ── execvp() で別のプログラムに置き換わる ── 終了
```

- `fork()` は、自分自身のコピー（子プロセス）を作ります。戻り値が `0` なら子、正の数なら親（値は子のプロセス ID）、`-1` なら失敗です。
- `execvp()` は、今のプロセスを別のプログラムに置き換えます。成功すると戻ってこないので、次の行に来たら失敗です。
- 子が `execvp()` に失敗したときは、`exit()` ではなく `_exit()` で終わります（親から受け継いだ出力用のバッファを二重に書き出さないため）。
- `echo` の引数 `"a; rm -rf /tmp/x"` は、シェルを通らないので、そのまま **1つの文字列** として表示されるだけです。

### posix_spawnp()：fork と exec をまとめて行う

```c
#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <spawn.h>       /* posix_spawnp() */
#include <sys/wait.h>

extern char **environ;   /* 今の環境変数をそのまま子に渡す */

int main(void)
{
    char *argv[] = { "uname", "-s", NULL };
    pid_t pid;
    int rc = posix_spawnp(&pid, argv[0], NULL, NULL, argv, environ);
    if (rc != 0) {                       /* 失敗するとエラー番号が戻り値で返る（errno ではない） */
        fprintf(stderr, "posix_spawnp に失敗: %d\n", rc);
        return 1;
    }
    int status;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status)) {
        printf("終了コード: %d\n", WEXITSTATUS(status));
    }
    return 0;
}
```

## 9.3 Windows での呼び出し

### system() と _popen()

```c
#include <stdio.h>
#include <stdlib.h>      /* system() */

int main(void)
{
    /* Windows の system() は cmd.exe を通して実行する */
    int rc = system("dir /b C:\\Windows\\System32\\drivers\\etc");
    printf("system の戻り値: %d\n", rc);

    /* _popen：コマンドの出力を読む（Windows では先頭に _ が付く） */
    FILE *fp = _popen("ver", "r");
    if (fp == NULL) {
        perror("_popen");
        return 1;
    }
    char buf[256];
    while (fgets(buf, sizeof buf, fp) != NULL) {
        printf("> %s", buf);
    }
    printf("_pclose の戻り値: %d\n", _pclose(fp));
    return 0;
}
```

> C の文字列の中では `\` を `\\` と書きます。`"C:\Windows"` と書くと、`\W` が不明なエスケープとして扱われます。

### _spawnvp()：引数を配列で渡す

```c
#include <stdio.h>
#include <process.h>     /* _spawnvp(), _P_WAIT */

int main(void)
{
    /* 引数を配列で渡し、終わるまで待つ（_P_WAIT のとき戻り値は終了コード） */
    const char *const argv[] = { "where", "notepad", NULL };
    intptr_t rc = _spawnvp(_P_WAIT, argv[0], argv);
    if (rc == -1) {
        perror("_spawnvp");
        return 1;
    }
    printf("終了コード: %ld\n", (long)rc);
    return 0;
}
```

### CreateProcessW()：Windows の基本の方法

```c
#include <stdio.h>
#include <windows.h>     /* CreateProcessW(), WaitForSingleObject() など */

int main(void)
{
    /* 実行するプログラムのフルパスを指定する（検索順に頼らない） */
    wchar_t app[] = L"C:\\Windows\\System32\\whoami.exe";
    wchar_t cmdline[] = L"whoami.exe /user";      /* 書き換えられるバッファで渡す */

    STARTUPINFOW si;
    ZeroMemory(&si, sizeof si);                   /* 構造体を 0 で埋めてから */
    si.cb = sizeof si;                            /* 大きさを設定する（必須） */
    PROCESS_INFORMATION pi;

    if (!CreateProcessW(app, cmdline, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        fprintf(stderr, "CreateProcessW に失敗: %lu\n", GetLastError());
        return 1;
    }
    WaitForSingleObject(pi.hProcess, INFINITE);   /* 終わるまで待つ */

    DWORD code = 0;
    GetExitCodeProcess(pi.hProcess, &code);
    printf("終了コード: %lu\n", code);

    CloseHandle(pi.hThread);                       /* ハンドルは必ず閉じる */
    CloseHandle(pi.hProcess);
    return 0;
}
```

| 部分 | 意味 |
|------|------|
| 第1引数 `app` | 実行するプログラムのパス。フルパスで指定すると、意図しない場所のプログラムが実行されるのを防げる |
| 第2引数 `cmdline` | コマンドライン（プログラム名を含む）。関数が中身を書き換えることがあるため、文字列リテラルを直接渡さず、配列（書き換えられるメモリ）で渡す |
| `STARTUPINFOW` | ウィンドウの表示方法などの設定。`cb` に構造体の大きさを入れる |
| `PROCESS_INFORMATION` | 作られたプロセスとスレッドのハンドル。使い終わったら `CloseHandle()` で閉じる |

## 9.4 Linux と Windows の両方に対応させる

```c
/* OS ごとに処理を切り替える例：今のディレクトリを表示する */
#include <stdio.h>
#ifdef _WIN32
  #include <direct.h>    /* _getcwd() */
  #define GETCWD _getcwd
#else
  #define _POSIX_C_SOURCE 200809L
  #include <unistd.h>    /* getcwd() */
  #define GETCWD getcwd
#endif

int main(void)
{
    char buf[4096];
    if (GETCWD(buf, sizeof buf) == NULL) {
        perror("getcwd");
        return 1;
    }
    printf("今のディレクトリ: %s\n", buf);
#ifdef _WIN32
    puts("Windows 用にビルドされました");
#else
    puts("Windows 以外（Linux など）用にビルドされました");
#endif
    return 0;
}
```

- `_WIN32` は、Windows 向けにコンパイルするときに定義されるマクロです（64 ビットでも定義されます）。
- 確認環境（Linux）での実行結果：`今のディレクトリ: /app`、`Windows 以外（Linux など）用にビルドされました`

| 機能 | Linux（POSIX） | Windows |
|------|---------------|---------|
| 外部コマンドを実行 | `fork` ＋ `execvp`、`posix_spawnp` | `CreateProcessW`、`_spawnvp` |
| 出力を読む | `popen` / `pclose` | `_popen` / `_pclose` |
| 今のディレクトリ | `getcwd`（`<unistd.h>`） | `_getcwd`（`<direct.h>`） |
| ディレクトリの中身 | `opendir` / `readdir`（`<dirent.h>`） | `FindFirstFileA` / `FindNextFileA`（`<windows.h>`） |
| パスの区切り | `/` | `\`（C の文字列では `\\`） |

## 9.5 セキュリティ：コマンドインジェクションを防ぐ

> 次の2つは考え方を示す部分的なコードです（`get_user_input()` と `is_valid_hostname()` は、入力の取得と検証を行う関数として省略しています）。

```c
/* NG：利用者の入力を、シェルを通すコマンドにそのままつなげている */
const char *input = get_user_input();          /* 例："example.com; rm -rf ~" */
char cmd[256];
snprintf(cmd, sizeof cmd, "ping -c 1 %s", input);
system(cmd);                                    /* ; の後ろも実行されてしまう */
```

```c
/* OK：入力を検証し、シェルを通さずに引数として渡す */
if (!is_valid_hostname(input)) {               /* 許可する文字だけか確かめる（英数字・. ・- など） */
    fprintf(stderr, "不正な値です\n");
    return 1;
}
char *argv[] = { "ping", "-c", "1", "--", (char *)input, NULL };   /* -- の後ろはオプションとして扱わない */
/* fork + execvp（9.2）や posix_spawnp で実行する */
```

| 対策 | 内容 |
|------|------|
| シェルを通さない | `system` / `popen` ではなく、`execvp`・`posix_spawnp`・`CreateProcessW` で引数を配列として渡す |
| 入力を検証する | 許可リスト（使ってよい文字や値）で確認する。危険な文字を取り除く方法は漏れが出やすい |
| オプションとして解釈させない | 値が `-` で始まると、コマンドのオプションと解釈されることがある。`--` に対応したコマンドなら、その後ろに値を置く |
| フルパスで指定する | `PATH` やカレントディレクトリに置かれた偽のプログラムを実行しないように、`/usr/bin/ping`、`C:\Windows\System32\…` のように指定する |
| 戻り値を確認する | 失敗を見逃さない。終了コードも確認する |
| 必要以上の権限で動かさない | root や管理者の権限で外部コマンドを動かすと、問題が起きたときの被害が大きい |

> そもそも外部コマンドを呼ばずに、C の関数や OS の API で同じことができないかを先に検討します（9.6 の疑似コマンドの例のように）。

## 9.6 疑似 OS コマンドを作る

OS のコマンドと同じような動きをするプログラムを、C で作る例です。外部コマンドを呼ばずに、C の関数や OS の API だけで実現しています。

### mycat：ファイルの中身を表示する（Linux・Windows 共通）

```c
/* mycat：ファイルの中身を表示する（cat の簡易版） */
#include <stdio.h>
#include <string.h>
#include <errno.h>

static int cat_stream(FILE *fp)
{
    char buf[4096];
    size_t n;
    while ((n = fread(buf, 1, sizeof buf, fp)) > 0) {
        if (fwrite(buf, 1, n, stdout) != n) return -1;
    }
    return ferror(fp) ? -1 : 0;
}

int main(int argc, char *argv[])
{
    if (argc < 2) {                          /* 引数がなければ標準入力を読む */
        return cat_stream(stdin) == 0 ? 0 : 1;
    }
    int result = 0;
    for (int i = 1; i < argc; i++) {
        FILE *fp = fopen(argv[i], "rb");
        if (fp == NULL) {
            fprintf(stderr, "mycat: %s: %s\n", argv[i], strerror(errno));
            result = 1;                      /* 失敗しても次のファイルへ進む */
            continue;
        }
        if (cat_stream(fp) != 0) result = 1;
        fclose(fp);
    }
    return result;
}
```

```bash
$ printf 'hello\nworld\n' | ./mycat
hello
world
$ ./mycat /no/such/file
mycat: /no/such/file: No such file or directory      ← エラーは標準エラー出力へ、終了コードは 1
```

- 本物の `cat` と同じく、引数がなければ標準入力を読み、エラーは標準エラー出力に出して、失敗したら 0 以外の終了コードを返します（[Linux 5章](../linux/05-stdio-redirect.md)）。
- `"rb"`（バイナリモード）で開くと、Windows でも改行コードが変換されず、画像などのファイルもそのまま扱えます。

### myls：ディレクトリの中身を表示する（Linux など POSIX 用）

```c
/* myls：ディレクトリの中身を表示する（ls の簡易版。Linux / macOS など POSIX 用） */
#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <dirent.h>      /* opendir(), readdir(), closedir() */
#include <sys/stat.h>    /* stat() */

int main(int argc, char *argv[])
{
    const char *dir = (argc > 1) ? argv[1] : ".";
    DIR *dp = opendir(dir);
    if (dp == NULL) {
        fprintf(stderr, "myls: %s: %s\n", dir, strerror(errno));
        return 1;
    }
    struct dirent *ent;
    while ((ent = readdir(dp)) != NULL) {
        if (ent->d_name[0] == '.') continue;          /* 隠しファイルと . .. を飛ばす */
        char path[4096];
        snprintf(path, sizeof path, "%s/%s", dir, ent->d_name);
        struct stat st;
        if (stat(path, &st) == 0) {
            printf("%c %8lld %s\n", S_ISDIR(st.st_mode) ? 'd' : '-',
                   (long long)st.st_size, ent->d_name);
        }
    }
    closedir(dp);
    return 0;
}
```

```text
$ ./myls /             ← 確認環境での実行結果（一部）
d     4096 app
d       60 opt
d      220 dev
d       40 tmp
d      100 etc
d      140 usr
```

> `readdir()` が返す順番は、名前順とは限りません。並べ替えたい場合は、名前を配列に集めてから `qsort()` で並べ替えます。

### mydir：フォルダの中身を表示する（Windows 用）

```c
/* mydir：フォルダの中身を表示する（dir の簡易版。Windows 用） */
#include <stdio.h>
#include <windows.h>     /* FindFirstFileA(), FindNextFileA(), FindClose() */

int main(int argc, char *argv[])
{
    char pattern[MAX_PATH];
    snprintf(pattern, sizeof pattern, "%s\\*", argc > 1 ? argv[1] : ".");

    WIN32_FIND_DATAA fd;
    HANDLE h = FindFirstFileA(pattern, &fd);
    if (h == INVALID_HANDLE_VALUE) {
        fprintf(stderr, "mydir: 開けません（エラー %lu）\n", GetLastError());
        return 1;
    }
    do {
        if (fd.cFileName[0] == '.') continue;          /* . と .. を飛ばす */
        int is_dir = (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0;
        ULONGLONG size = ((ULONGLONG)fd.nFileSizeHigh << 32) | fd.nFileSizeLow;
        printf("%s %10llu %s\n", is_dir ? "<DIR>" : "     ", size, fd.cFileName);
    } while (FindNextFileA(h, &fd));
    FindClose(h);
    return 0;
}
```

- ファイルの大きさは、上位 32 ビット（`nFileSizeHigh`）と下位 32 ビット（`nFileSizeLow`）に分かれているので、組み合わせて 64 ビットの値にします。
- 日本語などを含むファイル名を正しく扱うには、`FindFirstFileW` などの `W`（ワイド文字）版の関数を使います。

### minish：小さなシェル（Linux など POSIX 用）

```c
/* minish：入力した行を空白で区切って実行する、小さなシェル（POSIX 用） */
#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

#define MAX_ARGS 32

int main(void)
{
    char line[1024];
    for (;;) {
        printf("minish> ");
        fflush(stdout);
        if (fgets(line, sizeof line, stdin) == NULL) break;   /* Ctrl+D で終了 */

        char *argv[MAX_ARGS];
        int argc = 0;
        for (char *tok = strtok(line, " \t\n"); tok != NULL && argc < MAX_ARGS - 1;
             tok = strtok(NULL, " \t\n")) {
            argv[argc++] = tok;
        }
        argv[argc] = NULL;
        if (argc == 0) continue;
        if (strcmp(argv[0], "exit") == 0) break;                /* 組み込みコマンド */
        if (strcmp(argv[0], "cd") == 0) {                       /* cd は自分自身で行う */
            if (chdir(argc > 1 ? argv[1] : "/") != 0) perror("cd");
            continue;
        }

        pid_t pid = fork();
        if (pid == 0) {
            execvp(argv[0], argv);
            perror(argv[0]);
            _exit(127);
        } else if (pid > 0) {
            int status;
            waitpid(pid, &status, 0);
        } else {
            perror("fork");
        }
    }
    putchar('\n');
    return 0;
}
```

この小さなシェルから分かること:

- シェルの基本は「1行読む → 空白で区切る → `fork` ＋ `execvp` で実行 → 終わるのを待つ」の繰り返しです。
- **`cd` は外部コマンドにできません**。子プロセスでディレクトリを変えても、親（シェル自身）のディレクトリは変わらないためです。そのため `cd` や `exit` はシェルの中で処理する **組み込みコマンド** になっています。
- `|` や `>`、`;` には対応していません。本物のシェルは、これらを解釈して、パイプやリダイレクトを作っています（[Linux 5章](../linux/05-stdio-redirect.md)）。

## 9.7 コンパイルの方法

```bash
# Linux（gcc）
gcc -std=c17 -Wall -Wextra -o mycat mycat.c
./mycat file.txt
```

```bat
rem Windows（MSVC。Visual Studio の「開発者コマンド プロンプト」で実行）
cl /W4 mydir.c
mydir.exe C:\Windows

rem Windows（MinGW-w64 の gcc）
gcc -std=c17 -Wall -Wextra -o mydir.exe mydir.c
```

## 参考資料

- [cppreference: system](https://en.cppreference.com/w/c/program/system)
- [Linux man pages: popen(3)](https://man7.org/linux/man-pages/man3/popen.3.html) / [fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) / [execvp(3)](https://man7.org/linux/man-pages/man3/exec.3.html) / [waitpid(2)](https://man7.org/linux/man-pages/man2/wait.2.html) / [posix_spawn(3)](https://man7.org/linux/man-pages/man3/posix_spawn.3.html) / [opendir(3)](https://man7.org/linux/man-pages/man3/opendir.3.html)
- [Microsoft Learn: CreateProcessW](https://learn.microsoft.com/ja-jp/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw) / [_spawnvp](https://learn.microsoft.com/ja-jp/cpp/c-runtime-library/reference/spawnvp-wspawnvp) / [_popen](https://learn.microsoft.com/ja-jp/cpp/c-runtime-library/reference/popen-wpopen) / [FindFirstFileA](https://learn.microsoft.com/ja-jp/windows/win32/api/fileapi/nf-fileapi-findfirstfilea)
- [OWASP: OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
