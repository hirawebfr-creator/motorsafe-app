const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function resetPassword() {
  const prisma = new PrismaClient();
  const email = process.env.USER_EMAIL || "autoccasion2a@gmail.com";
  const password = process.env.USER_PASSWORD || "Test1234!";
  
  const hash = await bcrypt.hash(password, 12);
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash }
  });
  
  console.log(`✅ Mot de passe mis à jour pour ${email}`);
  console.log(`   Nouveau mot de passe: ${password}`);
  
  await prisma.$disconnect();
}

resetPassword().catch(console.error);
