const endpoints = [
  // Public
  { path: '/api/health', expect: [200] },

  // Protected (no cookie in smoke run)
  { path: '/api/me', expect: [401, 403] },
  { path: '/api/clients', expect: [401, 403] },
  { path: '/api/vehicules', expect: [401, 403] },
  { path: '/api/interventions', expect: [401, 403] },
];

const waitForServer = async (url, attempts = 40, delayMs = 250) => {
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`waitForServer: attempt ${i + 1}/${attempts} -> ${url}`);
      const res = await fetch(url, { method: 'GET' });
      console.log(`waitForServer: response ${res.status}`);
      if (res.ok || res.status === 200) return true;
    } catch (e) {
      console.log(`waitForServer: attempt ${i + 1} failed: ${e && e.message}`);
      // ignore
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
};

(async () => {
  const base = 'http://localhost:3000';
  const up = await waitForServer(base + '/');
  if (!up) {
    console.error('Server did not become available at', base);
    process.exitCode = 2;
    return;
  }

  const results = [];
  let unexpected = 0;
  for (const { path, expect } of endpoints) {
    const url = `${base}${path}`;
    console.log(`smoke: fetching ${url}`);
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      console.log('smoke: result for', path, 'status=', res.status);
      console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
      results.push({ path, status: res.status, body: parsed });

      if (!expect.includes(res.status)) {
        unexpected++;
        console.error(`smoke: UNEXPECTED status for ${path}: got ${res.status}, expected ${expect.join(' or ')}`);
      }
    } catch (err) {
      console.error('smoke: ERROR fetching', path, err && err.message ? err.message : err);
      results.push({ path, error: String(err) });
      unexpected++;
    }
  }

  console.log('smoke: summary');
  console.log(JSON.stringify(results, null, 2));

  if (unexpected > 0) {
    console.error(`smoke: FAILED (${unexpected} unexpected result(s))`);
    process.exitCode = 1;
  } else {
    console.log('smoke: OK');
  }
})();
