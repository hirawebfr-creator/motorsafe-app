const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin123!';
  const hash = await bcrypt.hash(newPassword, 12);
  
  const user = await prisma.user.update({
    where: { email: 'hiraweb.fr@gmail.com' },
    data: { 
      role: 'ADMIN', 
      passwordHash: hash 
    }
  });
  
  console.log('✅ Utilisateur mis à jour:');
  console.log('   Email:', user.email);
  console.log('   Rôle:', user.role);
  console.log('   Nouveau mot de passe: Admin123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
