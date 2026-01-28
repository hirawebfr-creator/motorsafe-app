const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Test des tables KB...\n');
    
    // Test KbCategory
    console.log('📂 KbCategory:');
    const categories = await prisma.kbCategory.findMany();
    console.log(`   ${categories.length} catégorie(s) trouvée(s)`);
    
    // Test KbArticle
    console.log('📄 KbArticle:');
    const articles = await prisma.kbArticle.findMany();
    console.log(`   ${articles.length} article(s) trouvé(s)`);
    
    // Test MaintenanceWindow
    console.log('🔧 MaintenanceWindow:');
    const maintenances = await prisma.maintenanceWindow.findMany();
    console.log(`   ${maintenances.length} maintenance(s) trouvée(s)`);
    
    // Test SupportTicket
    console.log('🎫 SupportTicket:');
    const tickets = await prisma.supportTicket.findMany();
    console.log(`   ${tickets.length} ticket(s) trouvé(s)`);
    
    console.log('\n✅ Toutes les tables sont accessibles !');
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
