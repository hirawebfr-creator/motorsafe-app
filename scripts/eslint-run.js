const { spawnSync } = require("child_process");
const path = require("path");

const env = { ...process.env };
// Avoid invalid Node flags inherited from the environment.
delete env.NODE_OPTIONS;

const eslintBin = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "eslint.cmd" : "eslint"
);

const result = spawnSync(eslintBin, ["app", "components", "--max-warnings", "100"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
