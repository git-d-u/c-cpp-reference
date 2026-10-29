# C / C++ 基本リファレンス

C言語とC++の基本的な文法・標準ライブラリに加え、アセンブラ（x86-64）・SQL・HTML・PHP・JavaScript・Python・PowerShell・Linux・Windows の基本をまとめたリファレンスです。

## 📖 Webサイトで読む（おすすめ）

**https://git-d-u.github.io/c-cpp-reference/**

検索、ダークモード、コードのコピーボタンに対応しており、スマホでも読みやすい表示になっています。

## GitHub 上で読む

Markdown ファイルは [docs/](docs/) にあります。目次は [docs/index.md](docs/index.md) です。

- C言語: [docs/c/](docs/c/)
- C++: [docs/cpp/](docs/cpp/)
- アセンブラ: [docs/asm/](docs/asm/)
- SQL: [docs/sql/](docs/sql/)
- HTML: [docs/html/](docs/html/)
- PHP: [docs/php/](docs/php/)
- JavaScript: [docs/javascript/](docs/javascript/)
- Python: [docs/python/](docs/python/)
- PowerShell: [docs/powershell/](docs/powershell/)
- Linux: [docs/linux/](docs/linux/)
- Windows: [docs/windows/](docs/windows/)
- 付録: [docs/appendix/](docs/appendix/)

## サイトの仕組み

[MkDocs](https://www.mkdocs.org/) と [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) で `docs/` からサイトを生成しています。
`main` ブランチに push すると、GitHub Actions（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）が自動でビルドして GitHub Pages に公開します。

手元でプレビューする場合:

```bash
pip install -r requirements.txt
mkdocs serve        # http://127.0.0.1:8000 で確認
```
