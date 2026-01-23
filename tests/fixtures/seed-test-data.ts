import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const testUser = {
  id: 'test-user-id-001',
  email: 'test@motorsafe.fr',
  password: 'TestPassword123!',
  role: 'GARAGE' as const
}

export const testGarage = {
  name: 'Garage Test E2E',
  email: 'garage.test.e2e@motorsafe.fr',
  siret: '12345678901234',
  address: '123 Rue Test',
  postalCode: '75001',
  city: 'Paris',
  phone: '0612345678',
  status: 'ACTIVE' as const,
  plan: 'PRO' as const
}

export const testClient = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont.test@example.com',
  phone: '0612345678',
  address: '45 Avenue Test'
}

export const testVehicle = {
  plate: 'AB-123-CD',
  vin: '1HGBH41JXMN109186',
  brand: 'Peugeot',
  model: '208',
  year: 2020,
  fuel: 'ESSENCE'
}

export const testIntervention = {
  type: 'revision',
  title: 'Révision 25 000 km',
  notes: 'Test intervention pour E2E',
  status: 'DRAFT' as const,
  odometerKm: 25000
}

export async function seedTestData() {
  console.log('🌱 Seeding test data...')
  
  try {
    // 1. Nettoyer les anciennes données de test
    console.log('🧹 Nettoyage anciennes données...')
    
    await prisma.intervention.deleteMany({
      where: { 
        OR: [
          { title: { startsWith: 'Révision' } },
          { notes: { contains: 'Test intervention' } }
        ]
      }
    }).catch(() => console.log('  - Pas d\'interventions à supprimer'))
    
    await prisma.vehicle.deleteMany({
      where: { plate: { startsWith: 'AB-' } }
    }).catch(() => console.log('  - Pas de véhicules à supprimer'))
    
    await prisma.client.deleteMany({
      where: { email: { endsWith: '.test@example.com' } }
    }).catch(() => console.log('  - Pas de clients à supprimer'))
    
    await prisma.user.deleteMany({
      where: { email: 'test@motorsafe.fr' }
    }).catch(() => console.log('  - Pas d\'utilisateurs à supprimer'))
    
    await prisma.garage.deleteMany({
      where: { email: 'garage.test.e2e@motorsafe.fr' }
    }).catch(() => console.log('  - Pas de garages à supprimer'))
    
    console.log('✅ Anciennes données test nettoyées')
    
    // 2. Créer le garage de test d'abord (pour avoir l'ID)
    const garage = await prisma.garage.create({
      data: {
        name: testGarage.name,
        email: testGarage.email,
        siret: testGarage.siret,
        address: testGarage.address,
        postalCode: testGarage.postalCode,
        city: testGarage.city,
        phone: testGarage.phone,
        status: testGarage.status,
        plan: testGarage.plan
      }
    })
    
    console.log('✅ Garage test créé:', garage.name, '(ID:', garage.id, ')')
    
    // 3. Créer l'utilisateur de test
    const hashedPassword = await bcrypt.hash(testUser.password, 10)
    
    const user = await prisma.user.create({
      data: {
        id: testUser.id,
        email: testUser.email,
        passwordHash: hashedPassword,
        role: testUser.role,
        garageId: garage.id
      }
    })
    
    console.log('✅ Utilisateur test créé:', user.email)
    
    // 4. Créer le client de test
    const client = await prisma.client.create({
      data: {
        firstName: testClient.firstName,
        lastName: testClient.lastName,
        email: testClient.email,
        phone: testClient.phone,
        address: testClient.address,
        garageId: garage.id
      }
    })
    
    console.log('✅ Client test créé:', `${client.firstName} ${client.lastName}`)
    
    // 5. Créer le véhicule de test
    const vehicle = await prisma.vehicle.create({
      data: {
        plate: testVehicle.plate,
        vin: testVehicle.vin,
        brand: testVehicle.brand,
        model: testVehicle.model,
        year: testVehicle.year,
        fuel: testVehicle.fuel,
        clientId: client.id,
        garageId: garage.id
      }
    })
    
    console.log('✅ Véhicule test créé:', vehicle.plate)
    
    // 6. Créer l'intervention de test
    const intervention = await prisma.intervention.create({
      data: {
        type: testIntervention.type,
        title: testIntervention.title,
        notes: testIntervention.notes,
        status: testIntervention.status,
        odometerKm: testIntervention.odometerKm,
        vehicleId: vehicle.id,
        garageId: garage.id
      }
    })
    
    console.log('✅ Intervention test créée:', intervention.title)
    
    console.log('🎉 Seed test data terminé avec succès')
    console.log('')
    console.log('📋 Résumé:')
    console.log(`   - Garage: ${garage.name} (ID: ${garage.id})`)
    console.log(`   - User: ${user.email} / ${testUser.password}`)
    console.log(`   - Client: ${client.firstName} ${client.lastName}`)
    console.log(`   - Véhicule: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`)
    console.log(`   - Intervention: ${intervention.title}`)
    
    return {
      user,
      garage,
      client,
      vehicle,
      intervention
    }
    
  } catch (error) {
    console.error('❌ Erreur seed test data:', error)
    throw error
  }
}

export async function cleanTestData() {
  console.log('🧹 Nettoyage test data...')
  
  try {
    await prisma.intervention.deleteMany({
      where: { notes: { contains: 'Test intervention' } }
    }).catch(() => {})
    
    await prisma.vehicle.deleteMany({
      where: { plate: { startsWith: 'AB-' } }
    }).catch(() => {})
    
    await prisma.client.deleteMany({
      where: { email: { endsWith: '.test@example.com' } }
    }).catch(() => {})
    
    await prisma.user.deleteMany({
      where: { email: 'test@motorsafe.fr' }
    }).catch(() => {})
    
    await prisma.garage.deleteMany({
      where: { email: 'garage.test.e2e@motorsafe.fr' }
    }).catch(() => {})
    
    console.log('✅ Test data nettoyé')
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Script exécutable
const args = process.argv.slice(2)

if (args[0] === 'clean') {
  cleanTestData()
    .then(() => {
      console.log('✅ Clean terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Clean échoué:', error)
      process.exit(1)
    })
} else {
  seedTestData()
    .then(() => {
      console.log('✅ Seed terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed échoué:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}
