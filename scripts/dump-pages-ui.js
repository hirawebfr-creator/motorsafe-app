/*
  Dump "UI visuel" par page (Next App Router).

  Output:
  - docs/UI_PAGES_DUMP.md

  Run:
  - node scripts/dump-pages-ui.js

  Notes:
  - Inclut chaque `page.tsx` sous `app/` (hors `app/api/`).
  - Pour chaque page, inclut aussi les `layout.tsx` applicables (racine + segments).
*/

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const appRoot = path.join(projectRoot, "app");
const outPath = path.join(projectRoot, "docs", "UI_PAGES_DUMP.md");

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function isRouteGroup(seg) {
  return seg.startsWith("(") && seg.endsWith(")");
}

function isApiPath(segments) {
  return segments.length > 0 && segments[0] === "api";
}

function routeFromSegments(segments) {
  // Remove route groups like (dashboard)
  const filtered = segments.filter((s) => !isRouteGroup(s));
  const joined = filtered.join("/");
  return "/" + joined;
}

function walkForPages(dirAbs, segments, out) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });

  // page.tsx at this level
  const hasPage = entries.some((e) => e.isFile() && e.name === "page.tsx");
  if (hasPage && !isApiPath(segments)) {
    out.push({
      segments: [...segments],
      pageAbs: path.join(dirAbs, "page.tsx"),
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    // Skip api subtree
    if (segments.length === 0 && name === "api") continue;
    walkForPages(path.join(dirAbs, name), [...segments, name], out);
  }
}

function layoutChainFor(pageSegments) {
  // Always include root layout
  const layouts = [];
  const rootLayout = path.join(appRoot, "layout.tsx");
  if (fs.existsSync(rootLayout)) layouts.push(rootLayout);

  // Include any layout.tsx from each prefix path under app/
  // (including route groups if they exist on disk).
  let cur = appRoot;
  for (const seg of pageSegments) {
    cur = path.join(cur, seg);
    const lay = path.join(cur, "layout.tsx");
    if (fs.existsSync(lay)) layouts.push(lay);
  }

  // Deduplicate
  return Array.from(new Set(layouts));
}

function fenceLang(filePath) {
  const ext = path.extname(filePath);
  if (ext === ".tsx") return "tsx";
  if (ext === ".ts") return "ts";
  if (ext === ".css") return "css";
  if (ext === ".js") return "js";
  if (ext === ".mjs") return "js";
  return "";
}

function readFileSafe(absPath) {
  return fs.readFileSync(absPath, "utf8").replace(/\r\n/g, "\n");
}

function main() {
  const pages = [];
  walkForPages(appRoot, [], pages);

  // Sort by route
  pages.sort((a, b) => {
    const ra = routeFromSegments(a.segments);
    const rb = routeFromSegments(b.segments);
    return ra.localeCompare(rb);
  });

  const lines = [];
  lines.push("# UI_PAGES_DUMP — MotorSafe\n");
  lines.push("Ce fichier est généré automatiquement.");
  lines.push("\n**Contenu:** routes → layouts applicables → code de la page.");
  lines.push("**Génération:** `node scripts/dump-pages-ui.js`\n");

  lines.push("## Index\n");
  for (const p of pages) {
    const route = routeFromSegments(p.segments);
    const anchor = route === "/" ? "root" : route.slice(1).replace(/\//g, "-").replace(/[^a-zA-Z0-9\-\[\]\(\)_:]/g, "");
    lines.push(`- [${route}](#${anchor})`);
  }

  lines.push("\n---\n");

  for (const p of pages) {
    const route = routeFromSegments(p.segments);
    const anchor = route === "/" ? "root" : route.slice(1).replace(/\//g, "-").replace(/[^a-zA-Z0-9\-\[\]\(\)_:]/g, "");
    const pageRel = toPosix(path.relative(projectRoot, p.pageAbs));

    lines.push(`## ${route}`);
    lines.push(`<a id="${anchor}"></a>`);
    lines.push("");

    const layouts = layoutChainFor(p.segments);
    if (layouts.length) {
      lines.push("### Layouts\n");
      for (const layAbs of layouts) {
        const rel = toPosix(path.relative(projectRoot, layAbs));
        lines.push(`- ${rel}`);
      }
      lines.push("");

      for (const layAbs of layouts) {
        const rel = toPosix(path.relative(projectRoot, layAbs));
        lines.push(`#### ${rel}`);
        lines.push("```" + fenceLang(layAbs));
        lines.push(readFileSafe(layAbs));
        lines.push("```\n");
      }
    }

    lines.push("### Page\n");
    lines.push(`#### ${pageRel}`);
    lines.push("```tsx");
    lines.push(readFileSafe(p.pageAbs));
    lines.push("```\n");
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${toPosix(path.relative(projectRoot, outPath))} (${pages.length} pages).`);
}

main();
