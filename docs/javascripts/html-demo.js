// HTML の例（class="html-demo" の中のコード）を、横の iframe に実際に表示する
(function () {
  // 例のコードに付ける最低限の見た目（ブラウザの標準の表示に近づける）
  const BASE_STYLE =
    "body{margin:12px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "line-height:1.6;color:#222;background:#fff}";

  // コードを、iframe に入れる HTML 文書の形にする
  function buildDocument(code) {
    // <!DOCTYPE> や <html> から書いた例は、そのまま表示する
    if (/<!DOCTYPE|<html[\s>]/i.test(code)) {
      return code;
    }
    return (
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      "<style>" + BASE_STYLE + "</style></head><body>" + code + "</body></html>"
    );
  }

  // iframe の高さを、中身の高さに合わせる
  function fitHeight(iframe) {
    const doc = iframe.contentDocument;
    if (!doc || !doc.documentElement) return;
    // <html> 要素の高さは、見出しなどの余白も含めた中身の高さになる
    const height = doc.documentElement.getBoundingClientRect().height;
    iframe.style.height = Math.ceil(height) + 2 + "px";
  }

  function init() {
    document.querySelectorAll(".html-demo").forEach((demo) => {
      if (demo.dataset.ready) return;   // ページの再表示で二重に作らない
      const code = demo.querySelector("pre code");
      if (!code) return;
      demo.dataset.ready = "1";

      const result = document.createElement("div");
      result.className = "html-demo__result";

      const label = document.createElement("div");
      label.className = "html-demo__label";
      label.textContent = "表示結果";

      const iframe = document.createElement("iframe");
      // スクリプトの実行とフォームの送信は無効にする（高さを測るため同一オリジンだけ許可）
      iframe.setAttribute("sandbox", "allow-same-origin");
      iframe.setAttribute("title", "HTML の表示結果");
      iframe.srcdoc = buildDocument(code.textContent);

      iframe.addEventListener("load", () => {
        fitHeight(iframe);
        // 画面の幅が変わって中身の高さが変わったときも合わせる
        if (window.ResizeObserver && iframe.contentDocument) {
          new ResizeObserver(() => fitHeight(iframe)).observe(iframe.contentDocument.documentElement);
        }
      });

      result.append(label, iframe);
      demo.append(result);
    });
  }

  // Material for MkDocs のページ移動（instant navigation）でも毎回実行する
  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
