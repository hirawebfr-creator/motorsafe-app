const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "test@test.com";
  const password = "test1234";
  
  // Vérifier si le compte existe déjà
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Compte existe deja:", email);
    return;
  }
  
  const hash = await bcrypt.hash(password, 10);
  
  const garage = await prisma.garage.create({
    data: {
      name: "Garage Test",
      email: email,
      phone: "0600000000",
      address: "1 rue du test",
      status: "ACTIVE",
      plan: "FREE",
    },
  });
  
  await prisma.user.create({
    data: {
      email: email,
      passwordHash: hash,
      role: "OWNER",
      garageId: garage.id,
    },
  });
  
  console.log("Compte cree:", email, "/", password);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
