const PORT = process.env.PORT || 3001;
const base = `http://127.0.0.1:${PORT}`;

async function fetchJson(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { status: res.status, ok: res.ok, url, json };
    } catch (e) {
      return { status: res.status, ok: res.ok, url, text };
    }
  } catch (err) {
    return { error: String(err), url };
  }
}

(async function main(){
  console.log('Fetching endpoints from', base);
  const endpoints = [
    '/api/health',
    '/api/clients',
    '/api/vehicules',
    '/api/interventions'
  ];

  for (const ep of endpoints) {
    const r = await fetchJson(ep);
    console.log('\n===', ep, '===');
    console.log(JSON.stringify(r, null, 2));
  }

  // try single vehicle if any
  const veh = await fetchJson('/api/vehicules');
  let firstId = null;
  if (veh && veh.json) {
    const payload = (veh.json.ok ? veh.json.data : veh.json);
    if (Array.isArray(payload) && payload.length>0) firstId = payload[0].id;
  }

  if (firstId) {
    const r = await fetchJson(`/api/vehicules/${firstId}`);
    console.log('\n=== /api/vehicules/' + firstId + ' ===');
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log('\nNo vehicles found to fetch single vehicle endpoint.');
  }
})();
