/**
 * Script to fix encrypted clients by recreating test data
 * Run with: npx tsx scripts/fix-encrypted-clients.ts
 */
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../lib/encryption';

const prisma = new PrismaClient();

const testClients = [
  { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com', phone: '0612345678' },
  { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.com', phone: '0623456789' },
  { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@example.com', phone: '0634567890' },
  { firstName: 'Sophie', lastName: 'Durand', email: 'sophie.durand@example.com', phone: '0645678901' },
  { firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@example.com', phone: '0656789012' },
];

async function main() {
  console.log('Récupération des clients existants...');
  const existingClients = await prisma.client.findMany({
    select: { id: true, garageId: true, firstName: true }
  });

  console.log(`${existingClients.length} clients trouvés`);

  for (let i = 0; i < existingClients.length; i++) {
    const client = existingClients[i];
    const testData = testClients[i % testClients.length];
    
    console.log(`Mise à jour client ${client.id}...`);
    
    await prisma.client.update({
      where: { id: client.id },
      data: {
        firstName: encrypt(testData.firstName),
        lastName: encrypt(testData.lastName),
        email: testData.email ? encrypt(testData.email) : null,
        phone: testData.phone ? encrypt(testData.phone) : null,
      }
    });
  }

  console.log('Terminé!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
