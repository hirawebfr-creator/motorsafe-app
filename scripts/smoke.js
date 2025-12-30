const endpoints = [
  '/api/clients',
  '/api/vehicules',
  '/api/interventions',
  '/api/vehicules/cmjrjn9lr0001u15w7y5yno7a'
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
  for (const path of endpoints) {
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
    } catch (err) {
      console.error('smoke: ERROR fetching', path, err && err.message ? err.message : err);
      results.push({ path, error: String(err) });
    }
  }

  console.log('smoke: summary');
  console.log(JSON.stringify(results, null, 2));
})();
