# 付録 B. コンパイルとビルドの基本

[← 前: C と C++ の違い](c-vs-cpp.md) | [目次](../index.md)

---

## B.1 ビルドの流れ

```text
ソース (.c / .cpp)
   │ プリプロセス  … #include の展開、マクロ置換
   ▼
翻訳単位
   │ コンパイル    … 機械語（アセンブリ）へ変換
   ▼
オブジェクトファイル (.o / .obj)
   │ リンク        … 複数のオブジェクトとライブラリを結合
   ▼
実行ファイル (a.out / .exe)
```

## B.2 GCC / Clang

```bash
# C
gcc main.c -o main                 # コンパイルとリンク
gcc -std=c17 -Wall -Wextra -O2 main.c -o main

# C++
g++ -std=c++17 -Wall -Wextra -O2 main.cpp -o main
clang++ -std=c++20 main.cpp -o main

# 分割コンパイル
g++ -c a.cpp -o a.o                # コンパイルのみ
g++ -c b.cpp -o b.o
g++ a.o b.o -o app                 # リンク

./main                             # 実行（Windows では main.exe）
```

### よく使うオプション

| オプション | 意味 |
|-----------|------|
| `-o <名前>` | 出力ファイル名 |
| `-c` | コンパイルのみ（リンクしない） |
| `-std=c17` / `-std=c++17` | 言語規格の指定 |
| `-Wall -Wextra` | 主要な警告を有効化 |
| `-Werror` | 警告をエラーとして扱う |
| `-pedantic` | 規格に厳密でない記述を警告 |
| `-g` | デバッグ情報を付加 |
| `-O0` / `-O2` / `-O3` | 最適化レベル |
| `-I<dir>` | インクルードパスの追加 |
| `-L<dir>` | ライブラリ検索パスの追加 |
| `-l<name>` | ライブラリのリンク（例: `-lm`） |
| `-D<NAME>[=val]` | マクロ定義 |
| `-E` | プリプロセス結果のみ出力 |
| `-fsanitize=address,undefined` | AddressSanitizer / UBSan を有効化 |

## B.3 MSVC（Visual Studio の cl.exe）

「Developer Command Prompt for VS」から実行する。

```bat
cl /EHsc /std:c++17 /W4 main.cpp
cl /std:c17 main.c
```

| オプション | 意味 |
|-----------|------|
| `/EHsc` | 標準 C++ の例外処理を有効化 |
| `/std:c++17` / `/std:c++20` / `/std:c++latest` | C++ 規格 |
| `/std:c11` / `/std:c17` | C 規格 |
| `/W4` | 警告レベル |
| `/O2` | 最適化 |
| `/Zi` | デバッグ情報 |
| `/Fe:<名前>` | 出力ファイル名 |

## B.4 CMake の最小構成

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(MyApp LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(myapp src/main.cpp src/util.cpp)
target_include_directories(myapp PRIVATE include)
```

```bash
cmake -S . -B build               # 構成
cmake --build build               # ビルド
```

## B.5 Make の最小構成

```makefile
CXX      = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
OBJS     = main.o util.o

app: $(OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f app $(OBJS)
```

※ Makefile のレシピ行の先頭は**タブ文字**でなければならない。

## B.6 よくあるエラー

| エラー | 主な原因 |
|--------|---------|
| `undefined reference to ...`（GCC）/ `LNK2019`（MSVC） | 関数の定義がない、リンクするファイル・ライブラリの指定漏れ |
| `multiple definition of ...` | ヘッダで関数・変数を定義している（`inline` にするか `.c/.cpp` へ移す） |
| `implicit declaration of function` | ヘッダの `#include` 漏れ（C） |
| `was not declared in this scope` | 宣言・`#include` 漏れ、名前空間の指定漏れ（C++） |
| Segmentation fault | NULL / 不正なポインタの参照、配列の範囲外アクセス、スタックオーバーフロー |

---

[← 前: C と C++ の違い](c-vs-cpp.md) | [目次](../index.md)
