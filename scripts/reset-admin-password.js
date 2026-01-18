const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'hiraweb.fr@gmail.com';
  const password = 'Admin123!';
  
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash, role: 'ADMIN' }
  });
  
  console.log(`Mot de passe admin mis à jour pour ${email}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
