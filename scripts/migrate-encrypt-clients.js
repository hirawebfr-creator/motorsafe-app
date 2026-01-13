/**
 * Script de migration pour chiffrer les données clients existantes
 * 
 * Usage:
 *   ENCRYPTION_KEY=your-key node scripts/migrate-encrypt-clients.js
 * 
 * Ce script:
 * 1. Lit tous les clients non chiffrés
 * 2. Chiffre les champs sensibles (firstName, lastName, email, phone, address, notes, vatNumber)
 * 3. Met à jour la base de données
 * 
 * IMPORTANT: Faites une sauvegarde de la base avant de lancer ce script!
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCODING = 'base64';
const ENCRYPTED_PREFIX = 'enc:';

function getKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  
  const salt = 'motorsafe-client-data-v1';
  return crypto.scryptSync(envKey, salt, 32);
}

function encrypt(plaintext) {
  if (!plaintext || plaintext.startsWith(ENCRYPTED_PREFIX)) {
    return plaintext;
  }
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return [
    ENCRYPTED_PREFIX,
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(':');
}

function isEncrypted(value) {
  return value?.startsWith(ENCRYPTED_PREFIX) ?? false;
}

const SENSITIVE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'address', 'notes', 'vatNumber'];

async function main() {
  const prisma = new PrismaClient();
  
  console.log('🔐 Migration de chiffrement des données clients');
  console.log('================================================\n');
  
  try {
    // Vérifier que la clé fonctionne
    const testEncrypt = encrypt('test');
    console.log('✓ Clé de chiffrement valide\n');
    
    // Récupérer tous les clients
    const clients = await prisma.client.findMany();
    console.log(`📋 ${clients.length} clients trouvés\n`);
    
    let encrypted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const client of clients) {
      // Vérifier si déjà chiffré (on vérifie firstName)
      if (isEncrypted(client.firstName)) {
        skipped++;
        continue;
      }
      
      try {
        const updates = {};
        
        for (const field of SENSITIVE_FIELDS) {
          const value = client[field];
          if (value && typeof value === 'string' && !isEncrypted(value)) {
            updates[field] = encrypt(value);
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await prisma.client.update({
            where: { id: client.id },
            data: updates,
          });
          encrypted++;
          process.stdout.write(`✓ Client ${client.id} chiffré\n`);
        }
      } catch (err) {
        console.error(`✗ Erreur client ${client.id}:`, err.message);
        errors++;
      }
    }
    
    console.log('\n================================================');
    console.log(`📊 Résultats:`);
    console.log(`   - Chiffrés: ${encrypted}`);
    console.log(`   - Déjà chiffrés (ignorés): ${skipped}`);
    console.log(`   - Erreurs: ${errors}`);
    console.log('================================================\n');
    
    if (errors === 0) {
      console.log('✅ Migration terminée avec succès!');
    } else {
      console.log('⚠️  Migration terminée avec des erreurs');
    }
    
  } catch (err) {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
