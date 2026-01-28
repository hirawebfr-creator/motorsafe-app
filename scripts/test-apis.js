const { PrismaClient } = require('@prisma/client');

async function testAPIs() {
  const prisma = new PrismaClient();
  
  try {
    // Get the user's session
    const session = await prisma.session.findFirst({
      where: { user: { email: 'hiraweb.fr@gmail.com' } },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!session) {
      console.log('❌ Aucune session trouvée');
      return;
    }
    
    console.log('✅ Session trouvée:', session.token.slice(0, 20) + '...');
    const cookie = 'ms_session=' + session.token;
    
    // Test maintenance API
    console.log('\n📡 Test API Maintenance...');
    const r1 = await fetch('http://localhost:3000/api/admin/maintenance', {
      headers: { cookie }
    });
    const t1 = await r1.text();
    console.log('Status:', r1.status);
    console.log('Response:', t1.slice(0, 300));
    
    // Test changelog API
    console.log('\n📡 Test API Changelog...');
    const r2 = await fetch('http://localhost:3000/api/admin/changelog', {
      headers: { cookie }
    });
    const t2 = await r2.text();
    console.log('Status:', r2.status);
    console.log('Response:', t2.slice(0, 300));
    
    // Test support-ops API
    console.log('\n📡 Test API Support-Ops...');
    const r3 = await fetch('http://localhost:3000/api/admin/support/ops?range=7d', {
      headers: { cookie }
    });
    const t3 = await r3.text();
    console.log('Status:', r3.status);
    console.log('Response:', t3.slice(0, 300));
    
  } finally {
    await prisma.$disconnect();
  }
}

testAPIs().catch(console.error);
