// Gen docs/mermaid-diagrams.html từ docs/mermaid-diagrams.md (nhúng mermaid.js CDN)
const fs = require("fs");
const path = require("path");

const md = path.join(__dirname, "..", "docs", "mermaid-diagrams.md");
const out = path.join(__dirname, "..", "docs", "mermaid-diagrams.html");

const src = fs.readFileSync(md, "utf8");
// Bắt block cấu trúc dự án: dùng HTML treeview thay vì mermaid
const treeSrc = (src.match(/```html\s*\n([\s\S]*?)```/) || [])[1];

// Bắt tất cả block mermaid, LOẠI phần giữa `## 12. CẤU TRÚC DỰ ÁN` và `---` (đã thay bằng treeview)
const blocks = [
  ...src.matchAll(/^#{2,3} (.*?)\s*\n(?:(?!```)[\s\S])*?```mermaid\s*\n([\s\S]*?)```/gm),
].filter(([, title]) => !title.trim().startsWith("12."));

if (!blocks.length) {
  console.error("Không tìm thấy mermaid block nào!");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coffee Store — Mermaid Diagrams</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #faf7f2; margin: 0; padding: 24px; }
  h1 { color: #4A2C2A; text-align: center; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); margin: 24px auto; padding: 16px; max-width: 1100px; }
  .card h2 { color: #4A2C2A; border-bottom: 2px solid #C8956C; padding-bottom: 8px; }
  .mermaid { display: flex; justify-content: center; overflow-x: auto; }
  .err { color: #c00; font-family: monospace; white-space: pre-wrap; }
  /* ── Cây thư mục ─────────────────────────── */
  .tree, .tree ul { margin: 0; padding-left: 20px; list-style: none; }
  .tree li { position: relative; line-height: 1.7; font-size: 14px; color: #333; }
  .tree li::before { content: ""; position: absolute; left: -12px; top: 0; bottom: 50%; border-left: 1px solid #c8956c; }
  .tree li::after { content: ""; position: absolute; left: -12px; top: 50%; width: 8px; border-top: 1px solid #c8956c; }
  .tree li:last-child::before { bottom: 50%; }
  .tree ul > li:first-child::before { top: 50%; }
  .tree li:only-child::before { display: none; }
  .tree li:only-child::after { width: 8px; }
  .tree .d { cursor: pointer; user-select: none; font-weight: 600; color: #4a2c2a; }
  .tree .d::before { content: "📁 "; }
  .tree li.dir.closed > ul { display: none; }
  .tree li.dir.closed > .d::before { content: "📂 "; }
  .tree li.f::before { content: none; }
  .tree li.f::after { content: none; }
  .tree li.f { padding-left: 20px; position: relative; }
  .tree li.f::before { content: ""; position: absolute; left: -12px; top: 50%; width: 8px; border-top: 1px solid #c8956c; }
</style>
</head>
<body>
<h1>Coffee Store — Mermaid Diagrams</h1>
<p style="text-align:center;color:#666">Render bởi mermaid.js · ${blocks.length + (treeSrc ? 1 : 0)} diagram · nguồn docs/mermaid-diagrams.md</p>
${treeSrc ? `
<div class="card">
  <h2>10. 12. CẤU TRÚC DỰ ÁN</h2>
  ${treeSrc.trim()}
</div>` : ""}
${blocks
  .map(
    ([, title, code], i) => `
<div class="card">
  <h2>${i + 1}. ${title.trim()}</h2>
  <pre class="mermaid">${code.trim()}</pre>
</div>`
  )
  .join("")}
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "default" });
  const render = async () => {
    for (const el of document.querySelectorAll("pre.mermaid")) {
      try { await mermaid.parse(el.textContent); }
      catch (e) { el.outerHTML = '<div class="err">' + el.textContent.replace(/</g, "&lt;") + "</div>"; }
    }
  };
  await render();
  mermaid.run();
</script>
<script>
  // Cây thư mục: bấm vào tên thư mục để xổ / thu gọn
  document.querySelectorAll(".tree li.dir > .d").forEach(el => {
    el.addEventListener("click", () => el.parentElement.classList.toggle("closed"));
  });
</script>
</body>
</html>
`;

fs.writeFileSync(out, html, "utf8");
console.log(`OK: ${out} (${blocks.length} diagrams)`);
