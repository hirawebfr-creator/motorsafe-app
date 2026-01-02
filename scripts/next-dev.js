const { spawnSync } = require("child_process");

const env = { ...process.env };
// Some environments inject invalid Node flags (e.g. `--localstorage-file` without a path)
// via NODE_OPTIONS. Ensure the spawned dev process does not inherit them.
delete env.NODE_OPTIONS;

const nextBin = require.resolve("next/dist/bin/next");

const args = process.argv.slice(2);
const defaultArgs = ["dev", "--webpack"];
const result = spawnSync(process.execPath, [nextBin, ...defaultArgs, ...args], {
	stdio: "inherit",
	env,
});

if (result.error) {
	console.error(result.error);
	process.exit(1);
}

if (typeof result.status === "number") {
	process.exit(result.status);
}

// When the child is terminated (Ctrl+C, taskkill, VS Code process tree cleanup),
// `status` can be null. Treat that as a normal shutdown.
if (result.signal) {
	process.exit(0);
}

process.exit(1);
