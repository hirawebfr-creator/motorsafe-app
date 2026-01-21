const BASE_URL = 'http://localhost:3000'
const TOKEN = 'YOUR_SESSION_TOKEN' // Récupérer depuis cookie ms_session

const tests = [
  { method: 'GET', url: '/api/clients', expected: 200 },
  { method: 'GET', url: '/api/vehicules', expected: 200 },
  { method: 'GET', url: '/api/interventions', expected: 200 },
  { method: 'GET', url: '/api/devis', expected: 200 },
  { method: 'GET', url: '/api/factures', expected: 200 },
  { method: 'GET', url: '/api/billing/status', expected: 200 },
  { method: 'GET', url: '/api/dashboard/kpis', expected: 200 },
  { method: 'GET', url: '/api/me', expected: 200 },
]

async function runTests() {
  console.log('🧪 Testing API endpoints...\n')
  
  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const res = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers: {
          'Cookie': `ms_session=${TOKEN}`
        }
      })

      if (res.status === test.expected) {
        console.log(`✅ ${test.method} ${test.url}`)
        passed++
      } else {
        console.log(`❌ ${test.method} ${test.url} (got ${res.status}, expected ${test.expected})`)
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.method} ${test.url} (${error.message})`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests()
