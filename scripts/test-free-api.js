// Test des limites FREE sur safemotor.fr
const https = require("https");

const BASE = "https://safemotor.fr";
let cookies = "";

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
      },
    };

    const req = https.request(options, (res) => {
      // Capture cookies
      if (res.headers["set-cookie"]) {
        cookies = res.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ");
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log("🔐 Login...");
  const login = await request("POST", "/api/auth/login", {
    email: "freetest@test.com",
    password: "Free123!",
  });
  console.log("Login:", login.data.ok ? "✅ OK" : "❌ FAILED");

  console.log("\n📋 Test limite 5 clients...");
  for (let i = 1; i <= 6; i++) {
    const res = await request("POST", "/api/clients", {
      firstName: "Client",
      lastName: `Test${i}`,
      email: `client${i}@freetest.com`,
    });
    if (res.data.ok) {
      console.log(`  Client ${i}: ✅ Créé (id=${res.data.data.id})`);
    } else {
      console.log(`  Client ${i}: ❌ ${res.data.error?.message || res.data}`);
    }
  }

  // Récupérer le premier client pour créer des véhicules
  const clients = await request("GET", "/api/clients");
  console.log("  Clients trouvés:", clients.data?.data?.items?.length || 0);
  const clientId = clients.data?.data?.items?.[0]?.id;
  console.log("  Premier client ID:", clientId);

  if (clientId) {
    console.log("\n🚗 Test limite 5 véhicules...");
    for (let i = 1; i <= 6; i++) {
      const res = await request("POST", "/api/vehicules", {
        clientId,
        brand: "TestBrand",
        model: `Model${i}`,
        plate: `TEST-FR-${i}`,
      });
      if (res.data.ok) {
        console.log(`  Véhicule ${i}: ✅ Créé (id=${res.data.data.id})`);
      } else {
        console.log(`  Véhicule ${i}: ❌ ${res.data.error?.message || res.data}`);
      }
    }

    // Récupérer le premier véhicule pour créer des interventions
    const vehicles = await request("GET", "/api/vehicules");
    console.log("  Véhicules trouvés:", vehicles.data?.data?.items?.length || 0);
    const vehicleId = vehicles.data?.data?.items?.[0]?.id;
    console.log("  Premier véhicule ID:", vehicleId);

    if (vehicleId) {
      console.log("\n🔧 Test limite 5 interventions/semaine...");
      for (let i = 1; i <= 6; i++) {
        const res = await request("POST", "/api/interventions", {
          vehicleId,
          type: "Diag",
          notes: `Intervention test ${i}`,
        });
        if (res.data.ok) {
          console.log(`  Intervention ${i}: ✅ Créée (id=${res.data.data.id})`);
        } else {
          console.log(`  Intervention ${i}: ❌ ${res.data.error?.message || res.data}`);
        }
      }
    }
  }

  console.log("\n✅ Tests terminés !");
}

main().catch(console.error);
