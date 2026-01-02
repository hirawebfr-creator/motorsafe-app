const { spawnSync } = require("child_process");

const env = { ...process.env };
// Some environments inject invalid Node flags (e.g. `--localstorage-file` without a path)
// via NODE_OPTIONS. Ensure the spawned lint process does not inherit them.
delete env.NODE_OPTIONS;
// Keep output clean in runner environments.
env.NODE_NO_WARNINGS = "1";

const nextBin = require.resolve("next/dist/bin/next");
// Pass project dir explicitly to avoid Next interpreting unexpected args as a path.
const result = spawnSync(process.execPath, [nextBin, "lint", "."], {
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);
