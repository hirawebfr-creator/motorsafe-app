const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");

function sleepMs(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function safeUnlink(filePath) {
	try {
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	} catch {
		// ignore
	}
}

function safeWriteJson(filePath, payload) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
	} catch {
		// ignore
	}
}

function findListeningPid(port) {
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

	// Fallback: parse `netstat -ano`.
	const res = spawnSync("netstat", ["-ano"], { encoding: "utf8" });
	const out = String(res.stdout || "");
	// Match a TCP line whose *local address* ends with :port and capture the PID at end of line.
	// State token may be localized (LISTENING/ECOUTE/ÉCOUTE/...) so we avoid depending on it.
	const re = new RegExp(`^TCP\\s+\\S*:${port}\\s+\\S+\\s+\\S+\\s+(\\d+)\\s*$`, "i");
	for (const line of out.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const m = trimmed.match(re);
		if (m) return Number(m[1]);
	}
	return null;
}

function killPidTree(pid) {
	if (!pid || !Number.isFinite(pid)) return;
	try {
		if (process.platform === "win32") {
			spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
		} else {
			process.kill(pid);
		}
	} catch {
		// ignore
	}
}

function isProcessAlive(pid) {
	if (!pid || !Number.isFinite(pid)) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		// On Windows, `kill(pid, 0)` may throw EPERM even if the process exists.
		return e && typeof e === "object" && "code" in e && e.code === "EPERM";
	}
}

function canConnect(port, timeoutMs = 300) {
	return new Promise((resolve) => {
		if (!port || !Number.isFinite(port) || port <= 0) return resolve(false);
		const hosts = ["127.0.0.1", "::1", "localhost"];
		let idx = 0;
		let settled = false;

		function tryNext() {
			if (settled) return;
			if (idx >= hosts.length) return resolve(false);
			const host = hosts[idx++];
			const socket = net.connect({ host, port });
			socket.setTimeout(timeoutMs);
			socket.once("connect", () => {
				settled = true;
				socket.destroy();
				resolve(true);
			});
			socket.once("timeout", () => {
				socket.destroy();
				tryNext();
			});
			socket.once("error", () => {
				socket.destroy();
				tryNext();
			});
		}

		tryNext();
	});
}

function pickDevPort(preferredPorts) {
	for (const port of preferredPorts) {
		const pid = findListeningPid(port);
		if (!pid) return port;
	}
	return preferredPorts[0] ?? 3000;
}

const env = { ...process.env };
// Some environments inject invalid Node flags (e.g. `--localstorage-file` without a path)
// via NODE_OPTIONS. Ensure the spawned dev process does not inherit them.
delete env.NODE_OPTIONS;

// Clean stale dev lock (common after taskkill / concurrent dev servers)
try {
	const repoRoot = path.resolve(__dirname, "..");
	const lockPath = path.join(repoRoot, ".next", "dev", "lock");
	if (fs.existsSync(lockPath)) fs.rmSync(lockPath, { force: true });
} catch {
	// ignore
}

const repoRoot = path.resolve(__dirname, "..");
const daemonScript = path.join(__dirname, "next-dev-daemon.js");
const stopScript = path.join(__dirname, "next-dev-stop.js");
const logPath = path.join(repoRoot, ".dev.log");

// Start the dev server in a detached/background process (reliable on Windows).
// Then keep this process alive by tailing the log file, so `npm run dev` behaves
// like a foreground command and you can keep a console open.
const startRes = spawnSync(process.execPath, [daemonScript], {
	stdio: "inherit",
	env,
	cwd: repoRoot,
});
if (typeof startRes.status === "number" && startRes.status !== 0) {
	process.exit(startRes.status);
}

console.log(`(dev wrapper) Tailing logs: ${logPath}`);
console.log(`(dev wrapper) Press Ctrl+C to stop.`);

let tailOffset = 0;
// Avoid dumping the whole log history when starting the wrapper.
try {
	if (fs.existsSync(logPath)) {
		const stat = fs.statSync(logPath);
		tailOffset = stat.size;
	}
} catch {
	// ignore
}
function tailOnce() {
	try {
		const stat = fs.statSync(logPath);
		if (stat.size <= tailOffset) return;
		const fd = fs.openSync(logPath, "r");
		const buf = Buffer.alloc(Math.min(64 * 1024, stat.size - tailOffset));
		const bytesRead = fs.readSync(fd, buf, 0, buf.length, tailOffset);
		fs.closeSync(fd);
		if (bytesRead > 0) {
			process.stdout.write(buf.slice(0, bytesRead).toString("utf8"));
			tailOffset += bytesRead;
		}
	} catch {
		// ignore
	}
}

const tailInterval = setInterval(tailOnce, 250);

function stopAndExit(exitCode) {
	clearInterval(tailInterval);
	try {
		spawnSync(process.execPath, [stopScript], { stdio: "inherit", env, cwd: repoRoot });
	} catch {
		// ignore
	}
	process.exit(typeof exitCode === "number" ? exitCode : 0);
}

process.on("SIGINT", () => stopAndExit(0));
process.on("SIGTERM", () => stopAndExit(0));

// Exit with code 1 if the daemon process disappears.
// On Windows, PID checks can briefly fail (permissions/locale/netstat timing). Avoid false exits.
let consecutiveMissing = 0;
let lastWarnAt = 0;
let checkInFlight = false;

setInterval(async () => {
	if (checkInFlight) return;
	checkInFlight = true;
	try {
		const pidPath = path.join(repoRoot, ".next-dev.pid");
		if (!fs.existsSync(pidPath)) return;
		const raw = fs.readFileSync(pidPath, "utf8");
		const payload = JSON.parse(raw);
		const pid = payload?.listeningPid;
		const port = payload?.port;

		// Next.js dev may restart its internal server when config changes.
		// On Windows, that can change the listening PID even though the server is still running.
		if (pid && isProcessAlive(pid)) {
			consecutiveMissing = 0;
			return;
		}
		if (port) {
			const refreshedPid = findListeningPid(port);
			if (refreshedPid) {
				payload.listeningPid = refreshedPid;
				payload.refreshedAt = new Date().toISOString();
				safeWriteJson(pidPath, payload);
				consecutiveMissing = 0;
				return;
			}
		}

		// If PID checks fail, but the port still accepts connections,
		// consider the server alive and keep tailing.
		if (port && (await canConnect(port))) {
			consecutiveMissing = 0;
			return;
		}

		consecutiveMissing += 1;
		if (Date.now() - lastWarnAt > 3000) {
			lastWarnAt = Date.now();
			console.warn(
				`(dev wrapper) Cannot confirm dev server PID (attempt ${consecutiveMissing}). Will retry...`
			);
		}
		if (consecutiveMissing >= 12) process.exit(1);
	} catch {
		// ignore
	} finally {
		checkInFlight = false;
	}
}, 1500);
