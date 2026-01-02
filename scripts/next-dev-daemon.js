const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const logPath = path.join(repoRoot, ".dev.log");
const pidPath = path.join(repoRoot, ".next-dev.pid");

function sleepMs(ms) {
	// Synchronous sleep without spawning external processes.
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isProcessAlive(pid) {
	if (!pid || !Number.isFinite(pid)) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function findListeningPid(port) {
	if (process.platform !== "win32") return null;
	const res = spawnSync("netstat", ["-ano"], { encoding: "utf8" });
	const out = String(res.stdout || "");
	const re = new RegExp(`\\bTCP\\b.*:${port}\\s+.*\\bLISTENING\\b\\s+(\\d+)\\s*$`, "i");
	for (const line of out.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const m = trimmed.match(re);
		if (m) return Number(m[1]);
	}
	return null;
}

function readPidFile() {
	if (!fs.existsSync(pidPath)) return null;
	try {
		const raw = fs.readFileSync(pidPath, "utf8");
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

const existing = readPidFile();
if (existing?.listeningPid && isProcessAlive(existing.listeningPid)) {
	console.log(`Dev server already running (pid=${existing.listeningPid}).`);
	console.log(`Logs: ${logPath}`);
	process.exit(0);
}

const env = { ...process.env };
// Some environments inject invalid Node flags via NODE_OPTIONS.
delete env.NODE_OPTIONS;

const nextBin = require.resolve("next/dist/bin/next");

const out = fs.openSync(logPath, "a");
const port = 3000;
const child = spawn(process.execPath, [nextBin, "dev", "--webpack"], {
	detached: true,
	stdio: ["ignore", out, out],
	env,
	cwd: repoRoot,
});
child.unref();

let listeningPid = null;
const deadline = Date.now() + 10000;
while (Date.now() < deadline) {
	listeningPid = findListeningPid(port);
	if (listeningPid) break;
	sleepMs(250);
}

const payload = {
	launcherPid: child.pid,
	listeningPid: listeningPid,
	port,
	startedAt: new Date().toISOString(),
};
fs.writeFileSync(pidPath, JSON.stringify(payload, null, 2), "utf8");

console.log(
	listeningPid
		? `Dev server started in background (pid=${listeningPid}).`
		: `Dev server started in background (launcher pid=${child.pid}).`
);
console.log(`Logs: ${logPath}`);
console.log(`Stop: npm run dev:stop`);
