const { spawnSync } = require("child_process");

const env = { ...process.env };
// Some environments inject invalid Node flags (e.g. `--localstorage-file` without a path)
// via NODE_OPTIONS. Ensure the spawned build process does not inherit them.
delete env.NODE_OPTIONS;
// CI/runner environments may still inject warning-producing flags at process level;
// suppress Node warnings during build to keep output clean.
env.NODE_NO_WARNINGS = "1";

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
	stdio: "inherit",
	env,
});

process.exit(result.status ?? 1);
