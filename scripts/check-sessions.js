const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'hiraweb.fr@gmail.com' },
      include: { 
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Rôle:', user.role);
    console.log('   Sessions actives:', user.sessions.length);
    
    if (user.sessions.length > 0) {
      console.log('\n📋 Sessions:');
      for (const s of user.sessions) {
        const expired = s.expiresAt < new Date();
        console.log(`   - Token: ${s.token.slice(0, 8)}... | Expire: ${s.expiresAt} | ${expired ? '⚠️ EXPIRÉ' : '✅ Valide'}`);
      }
    } else {
      console.log('\n⚠️  Aucune session active - tu dois te reconnecter');
    }
    
    // Supprimer les sessions expirées
    const deleted = await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() }
      }
    });
    
    if (deleted.count > 0) {
      console.log(`\n🗑️  ${deleted.count} sessions expirées supprimées`);
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
