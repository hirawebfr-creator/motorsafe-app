/*
  Generates a tree (branch format) of the SafeMotor repository.

  Output:
  - docs/SITE_NOMENCLATURE_TREE.md

  Run:
  - node scripts/dump-nomenclature.js
*/

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const EXCLUDE_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "build",
  ".vercel",
]);

// Keep migrations but cap depth to avoid huge dumps
const DEPTH_CAPS = new Map([
  ["prisma/migrations", 2],
]);

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function getDepthCap(relDirPosix, defaultCap) {
  for (const [prefix, cap] of DEPTH_CAPS.entries()) {
    if (relDirPosix === prefix || relDirPosix.startsWith(prefix + "/")) return cap;
  }
  return defaultCap;
}

function walkTree(dirAbs, relDirPosix, prefix, depth, maxDepth, lines) {
  const effectiveMaxDepth = getDepthCap(relDirPosix, maxDepth);
  if (depth > effectiveMaxDepth) return;

  let entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  entries = entries.filter((e) => !EXCLUDE_NAMES.has(e.name));

  // Sort: directories first, then files; both alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const branch = isLast ? "└─ " : "├─ ";
    const nextPrefix = prefix + (isLast ? "   " : "│  ");

    const abs = path.join(dirAbs, entry.name);
    const rel = relDirPosix ? `${relDirPosix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      lines.push(prefix + branch + entry.name + "/");
      walkTree(abs, toPosix(rel), nextPrefix, depth + 1, maxDepth, lines);
    } else {
      lines.push(prefix + branch + entry.name);
    }
  }
}

function main() {
  const lines = [];
  lines.push("# Nomenclature SafeMotor (format branche)\n");
  lines.push("Arborescence du repo (hors `node_modules`, `.next`, `.git`, etc.).\n");

  lines.push("```text");
  lines.push("motorsafe/");
  walkTree(projectRoot, "", "", 1, 6, lines);
  lines.push("```\n");

  lines.push("## Notes\n");
  lines.push("- `app/api/` contient les routes backend (pas UI).");
  lines.push("- `app/(dashboard)/` contient les pages authentifiées.");
  lines.push("- `components/ui/` = UI kit (tokens + composants).");

  const outPath = path.join(projectRoot, "docs", "SITE_NOMENCLATURE_TREE.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(projectRoot, outPath)}`);
}

main();
