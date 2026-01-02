const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const pidPath = path.join(repoRoot, ".next-dev.pid");

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

const stoppedListening = killPid(listeningPid);
const stoppedLauncher = listeningPid === launcherPid ? true : killPid(launcherPid);

const stopped = stoppedListening || stoppedLauncher;

try {
	fs.unlinkSync(pidPath);
} catch {
	// ignore
}

const shownPid = Number.isFinite(listeningPid) && listeningPid > 0 ? listeningPid : launcherPid;
console.log(stopped ? `Stopped dev server (pid=${shownPid}).` : `Could not stop pid=${shownPid} (already stopped?).`);
