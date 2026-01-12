const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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

function pickDevPort(preferredPorts) {
	for (const port of preferredPorts) {
		const pid = findListeningPid(port);
		if (!pid) return port;
	}
	return preferredPorts[0] ?? 3000;
}

function sleepMs(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const repoRoot = path.resolve(__dirname, "..");

const pidPath = path.join(repoRoot, ".next-dev-fg.pid");

const env = { ...process.env };
// Some environments inject invalid Node flags via NODE_OPTIONS.
delete env.NODE_OPTIONS;

// Clean stale dev lock (common after taskkill / concurrent dev servers)
try {
	const lockPath = path.join(repoRoot, ".next", "dev", "lock");
	if (fs.existsSync(lockPath)) fs.rmSync(lockPath, { force: true });
} catch {
	// ignore
}

const nextBin = require.resolve("next/dist/bin/next");
const port = env.PORT ? Number(env.PORT) : pickDevPort([3000, 3001, 3002]);

const child = spawn(process.execPath, [nextBin, "dev", "--webpack", "-p", String(port)], {
	stdio: "inherit",
	env,
	cwd: repoRoot,
});

// Best-effort: wait for the port to be listening, then write a PID file
// so `npm run dev:stop:fg` can reliably stop this server.
let listeningPid = null;
const deadline = Date.now() + 10000;
while (Date.now() < deadline) {
	listeningPid = findListeningPid(port);
	if (listeningPid) break;
	sleepMs(250);
}

try {
	const payload = {
		launcherPid: child.pid,
		listeningPid,
		port,
		startedAt: new Date().toISOString(),
	};
	fs.writeFileSync(pidPath, JSON.stringify(payload, null, 2), "utf8");
} catch {
	// ignore
}

function cleanupPidFile() {
	try {
		if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);
	} catch {
		// ignore
	}
}

process.on("SIGINT", () => {
	try {
		child.kill("SIGINT");
	} catch {
		// ignore
	}
	cleanupPidFile();
});

process.on("SIGTERM", () => {
	try {
		child.kill("SIGTERM");
	} catch {
		// ignore
	}
	cleanupPidFile();
});

child.on("exit", (code) => {
	cleanupPidFile();
	process.exit(typeof code === "number" ? code : 0);
});
