// Gen mermaid.ink URL cho từng diagram trong docs/mermaid-diagrams.md
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "docs", "mermaid-diagrams.md"),
  "utf8"
);

const blocks = [...src.matchAll(/^#{2,3} (.*)\s*\n(?:(?!```)[\s\S])*?```mermaid\s*\n([\s\S]*?)```/gm)];

if (!blocks.length) {
  console.error("Không tìm thấy mermaid block nào!");
  process.exit(1);
}

blocks.forEach(([full, title, code], i) => {
  const b64 = Buffer.from(code.trim(), "utf8").toString("base64");
  const url = `https://mermaid.ink/img/${encodeURIComponent(b64)}`;
  console.log(`\n${i + 1}. ${title.trim()}`);
  console.log(url);
});
