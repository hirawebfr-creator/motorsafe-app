const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const pidPath = path.join(repoRoot, ".next-dev.pid");

function findListeningPid(port) {
	if (!port || !Number.isFinite(port) || port <= 0) return null;
	if (process.platform !== "win32") return null;

	// Prefer PowerShell API (locale-independent, more reliable than parsing `netstat`).
	try {
		const ps = spawnSync(
			"powershell",
			[
				"-NoProfile",
				"-Command",
				`$p=${port}; $c=Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if ($c) { Write-Output $c }`,
			],
			{ encoding: "utf8" }
		);
		const raw = String(ps.stdout || "").trim();
		const n = Number(raw);
		if (Number.isFinite(n) && n > 0) return n;
	} catch {
		// ignore
	}

	const res = spawnSync("netstat", ["-ano"], { encoding: "utf8" });
	const out = String(res.stdout || "");
	const re = new RegExp(`^TCP\\s+\\S*:${port}\\s+\\S+\\s+\\S+\\s+(\\d+)\\s*$`, "i");
	for (const line of out.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const m = trimmed.match(re);
		if (m) return Number(m[1]);
	}
	return null;
}

function killPid(pid) {
	if (!pid || !Number.isFinite(pid) || pid <= 0) return false;
	if (process.platform === "win32") {
		const result = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
			stdio: "ignore",
		});
		return result.status === 0;
	}
	try {
		process.kill(pid);
		return true;
	} catch {
		return false;
	}
}

if (!fs.existsSync(pidPath)) {
	console.log("No .next-dev.pid found (dev server not started via dev:daemon).");
	process.exit(0);
}

const raw = fs.readFileSync(pidPath, "utf8").trim();
let data = null;
try {
	data = JSON.parse(raw);
} catch {
	data = { listeningPid: Number(raw), launcherPid: Number(raw) };
}

const listeningPid = Number(data?.listeningPid);
const launcherPid = Number(data?.launcherPid);
const port = Number(data?.port);

const stoppedListening = killPid(listeningPid);
const stoppedLauncher = listeningPid === launcherPid ? true : killPid(launcherPid);

// Next.js dev may restart and change its listening PID while keeping the same port.
// If the stored PIDs are stale, also stop the process currently listening on the recorded port.
// (On Windows, taskkill exit codes can be misleading; verify by checking the port.)
let stoppedByPort = false;
if (Number.isFinite(port) && port > 0) {
	const currentPid = findListeningPid(port);
	if (currentPid && currentPid !== listeningPid && currentPid !== launcherPid) {
		stoppedByPort = killPid(currentPid);
	}
}

const stopped = stoppedListening || stoppedLauncher || stoppedByPort;

try {
	fs.unlinkSync(pidPath);
} catch {
	// ignore
}

const shownPid = Number.isFinite(listeningPid) && listeningPid > 0 ? listeningPid : launcherPid;
if (stoppedByPort) {
	console.log(`Stopped dev server by port (port=${port}).`);
} else {
	console.log(
		stopped ? `Stopped dev server (pid=${shownPid}).` : `Could not stop pid=${shownPid} (already stopped?).`
	);
}
