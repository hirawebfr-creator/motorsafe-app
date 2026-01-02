/*
  Generates a Markdown dump of the UI codebase for SafeMotor.
  Scope:
  - app/** (excluding app/api/**)
  - components/**
  - app/globals.css
  - tailwind.config.js

  Output:
  - docs/UI_CODE_DUMP.md

  Run:
  - node scripts/dump-ui.js
*/

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const INCLUDE_ROOT_FILES = [
  "tailwind.config.js",
];

const INCLUDE_DIRS = [
  "app",
  "components",
];

const EXCLUDE_DIR_PREFIXES = [
  path.join("app", "api"),
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
];

const INCLUDE_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".js", ".mjs"]);

function isExcluded(relPath) {
  const normalized = relPath.split(path.sep).join(path.posix.sep);
  return EXCLUDE_DIR_PREFIXES.some((p) => {
    const np = p.split(path.sep).join(path.posix.sep);
    return normalized === np || normalized.startsWith(np + "/");
  });
}

function shouldIncludeFile(absPath) {
  const ext = path.extname(absPath);
  if (!INCLUDE_EXTENSIONS.has(ext)) return false;

  const rel = path.relative(projectRoot, absPath);
  if (isExcluded(rel)) return false;

  // Explicitly skip any route handlers in app/api
  if (rel.split(path.sep)[0] === "app" && rel.split(path.sep)[1] === "api") return false;

  return true;
}

function walk(dirAbs, outAbsFiles) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dirAbs, entry.name);
    const rel = path.relative(projectRoot, abs);

    if (isExcluded(rel)) continue;

    if (entry.isDirectory()) {
      walk(abs, outAbsFiles);
    } else if (entry.isFile()) {
      if (shouldIncludeFile(abs)) outAbsFiles.push(abs);
    }
  }
}

function fenceLangFromPath(filePath) {
  const ext = path.extname(filePath);
  if (ext === ".tsx") return "tsx";
  if (ext === ".ts") return "ts";
  if (ext === ".css") return "css";
  if (ext === ".mjs") return "js";
  if (ext === ".js") return "js";
  return "";
}

function main() {
  const files = [];

  for (const relFile of INCLUDE_ROOT_FILES) {
    const abs = path.join(projectRoot, relFile);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      files.push(abs);
    }
  }

  for (const relDir of INCLUDE_DIRS) {
    const absDir = path.join(projectRoot, relDir);
    if (fs.existsSync(absDir) && fs.statSync(absDir).isDirectory()) {
      walk(absDir, files);
    }
  }

  // Deduplicate + sort
  const unique = Array.from(new Set(files.map((p) => path.resolve(p))));
  unique.sort((a, b) => {
    const ra = path.relative(projectRoot, a).toLowerCase();
    const rb = path.relative(projectRoot, b).toLowerCase();
    return ra.localeCompare(rb);
  });

  const lines = [];
  lines.push("# UI_CODE_DUMP — SafeMotor\n");
  lines.push("Ce fichier est généré automatiquement.\n");
  lines.push("**Scope:** `app/**` (hors `app/api/**`), `components/**`, `tailwind.config.js`.\n");
  lines.push("**Génération:** `node scripts/dump-ui.js`\n");

  lines.push("## Index\n");
  for (const abs of unique) {
    const rel = path.relative(projectRoot, abs).split(path.sep).join("/");
    const anchor = rel
      .toLowerCase()
      .replace(/[^a-z0-9\-_/ ]/g, "")
      .replace(/[\/]/g, "-")
      .replace(/\s+/g, "-");
    lines.push(`- [${rel}](#${anchor})`);
  }
  lines.push("\n---\n");

  for (const abs of unique) {
    const rel = path.relative(projectRoot, abs).split(path.sep).join("/");
    const anchor = rel
      .toLowerCase()
      .replace(/[^a-z0-9\-_/ ]/g, "")
      .replace(/[\/]/g, "-")
      .replace(/\s+/g, "-");

    const content = fs.readFileSync(abs, "utf8");
    const lang = fenceLangFromPath(abs);

    lines.push(`## ${rel}`);
    lines.push(`<a id="${anchor}"></a>`);
    lines.push("\n```" + lang);
    lines.push(content.replace(/\r\n/g, "\n"));
    lines.push("```\n");
  }

  const outPath = path.join(projectRoot, "docs", "UI_CODE_DUMP.md");
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(projectRoot, outPath)} with ${unique.length} files.`);
}

main();
