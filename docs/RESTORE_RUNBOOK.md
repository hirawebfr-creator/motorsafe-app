# 🔄 Runbook Restauration - MotorSafe

Ce document décrit les procédures de restauration des backups MotorSafe.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Télécharger un backup](#télécharger-un-backup)
4. [Déchiffrer le backup](#déchiffrer-le-backup)
5. [Restaurer la base de données](#restaurer-la-base-de-données)
6. [Vérifier l'intégrité](#vérifier-lintégrité)
7. [Restaurer les uploads](#restaurer-les-uploads)
8. [Procédure complète](#procédure-complète)

---

## Vue d'ensemble

### Structure des backups

```
backup-production-20260117-0300.tar.gz.enc
backup-production-20260117-0300.tar.gz.enc.sha256
```

Contenu de l'archive (après déchiffrement):
```
backup-production-20260117-0300/
├── manifest.json           # Métadonnées du backup
├── database.dump           # Dump PostgreSQL (format custom)
└── uploads-inventory.jsonl # Inventaire des fichiers (si uploads non inclus)
└── uploads/               # Dossier uploads (si BACKUP_INCLUDE_UPLOADS=true)
```

### Politique de rétention

- **Daily**: 30 derniers jours
- **Monthly**: 12 derniers mois (backup du 1er de chaque mois)

---

## Prérequis

### Outils requis

```bash
# PostgreSQL client
sudo apt-get install postgresql-client

# AWS CLI (pour S3/R2)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# OpenSSL (généralement pré-installé)
openssl version
```

### Variables d'environnement

```bash
# Stockage S3
export BACKUP_S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
export BACKUP_S3_ACCESS_KEY_ID="..."
export BACKUP_S3_SECRET_ACCESS_KEY="..."
export BACKUP_S3_BUCKET="motorsafe-backups"

# Chiffrement
export BACKUP_ENCRYPTION_PASS="votre-passphrase-secrete"

# AWS CLI config
export AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY}"
```

---

## Télécharger un backup

### Lister les backups disponibles

```bash
ENDPOINT="--endpoint-url ${BACKUP_S3_ENDPOINT}"
BUCKET="s3://${BACKUP_S3_BUCKET}/motorsafe/production/"

# Lister tous les backups
aws s3 ls ${ENDPOINT} "${BUCKET}" | grep "\.tar\.gz\.enc$"

# Obtenir le plus récent
LATEST=$(aws s3 ls ${ENDPOINT} "${BUCKET}" | grep "\.tar\.gz\.enc$" | sort | tail -1 | awk '{print $4}')
echo "Latest: ${LATEST}"
```

### Télécharger un backup spécifique

```bash
mkdir -p restore-work
cd restore-work

# Télécharger le backup et son checksum
aws s3 cp ${ENDPOINT} "${BUCKET}${LATEST}" .
aws s3 cp ${ENDPOINT} "${BUCKET}${LATEST}.sha256" .
```

---

## Déchiffrer le backup

### 1. Vérifier le checksum

```bash
# Vérifier l'intégrité du fichier chiffré
EXPECTED=$(cat *.sha256)
ACTUAL=$(sha256sum *.enc | cut -d' ' -f1)

if [ "${EXPECTED}" = "${ACTUAL}" ]; then
    echo "✓ Checksum valide"
else
    echo "✗ ERREUR: Checksum invalide - fichier corrompu!"
    exit 1
fi
```

### 2. Déchiffrer l'archive

```bash
ENC_FILE=$(ls *.enc)
TAR_FILE="${ENC_FILE%.enc}"

# Déchiffrement AES-256-CBC
openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
    -in "${ENC_FILE}" \
    -out "${TAR_FILE}" \
    -pass env:BACKUP_ENCRYPTION_PASS

echo "✓ Backup déchiffré: ${TAR_FILE}"
```

### 3. Extraire l'archive

```bash
tar -xzf "${TAR_FILE}"

# Vérifier le contenu
BACKUP_DIR=$(ls -d backup-* | head -1)
ls -la "${BACKUP_DIR}/"

# Lire le manifest
cat "${BACKUP_DIR}/manifest.json"
```

---

## Restaurer la base de données

### Option A: Restauration complète (remplace tout)

⚠️ **ATTENTION**: Ceci supprime toutes les données existantes!

```bash
cd "${BACKUP_DIR}"

# Restaurer dans la base de production
pg_restore \
    "${DATABASE_URL}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    database.dump

echo "✓ Base de données restaurée"
```

### Option B: Restauration dans une nouvelle base (recommandé)

```bash
# 1. Créer une nouvelle base
psql "${DATABASE_URL}" -c "CREATE DATABASE motorsafe_restored;"

# 2. Restaurer dans la nouvelle base
pg_restore \
    --host=your-host \
    --username=your-user \
    --dbname=motorsafe_restored \
    --no-owner \
    --no-acl \
    database.dump

# 3. Vérifier les données
psql -d motorsafe_restored -c "SELECT COUNT(*) FROM \"Garage\";"

# 4. Si tout est OK, basculer (optionnel)
# psql -c "ALTER DATABASE motorsafe RENAME TO motorsafe_old;"
# psql -c "ALTER DATABASE motorsafe_restored RENAME TO motorsafe;"
```

### Option C: Restauration sur Docker (test local)

```bash
# Démarrer PostgreSQL en Docker
docker run -d \
    --name motorsafe-restore-test \
    -e POSTGRES_PASSWORD=test123 \
    -e POSTGRES_DB=motorsafe_test \
    -p 5433:5432 \
    postgres:15

# Attendre que PostgreSQL soit prêt
sleep 5

# Restaurer
PGPASSWORD=test123 pg_restore \
    --host=localhost \
    --port=5433 \
    --username=postgres \
    --dbname=motorsafe_test \
    --no-owner \
    --no-acl \
    database.dump

# Vérifier
PGPASSWORD=test123 psql -h localhost -p 5433 -U postgres -d motorsafe_test \
    -c "SELECT COUNT(*) FROM \"Garage\";"

# Nettoyer
docker stop motorsafe-restore-test
docker rm motorsafe-restore-test
```

---

## Vérifier l'intégrité

### Script de vérification automatique

```bash
./scripts/backup/restore-check.sh \
    --host=localhost \
    --user=your-user \
    --dbname=motorsafe_restored
```

### Vérifications manuelles

```sql
-- Compter les enregistrements critiques
SELECT 'Garages' as table_name, COUNT(*) FROM "Garage"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Interventions', COUNT(*) FROM "Intervention"
UNION ALL
SELECT 'SignatureRequests', COUNT(*) FROM "SignatureRequest"
UNION ALL
SELECT 'Quotes', COUNT(*) FROM "Quote"
UNION ALL
SELECT 'Invoices', COUNT(*) FROM "Invoice";

-- Vérifier les signatures avec snapshots légaux
SELECT 
    COUNT(*) as total_signed,
    COUNT("legalSnapshotHash") as with_snapshot
FROM "SignatureRequest" 
WHERE status = 'SIGNED';

-- Vérifier les PDFs signés
SELECT 
    COUNT(*) as total,
    COUNT("signedPdfKey") as with_pdf
FROM "SignatureRequest" 
WHERE status = 'SIGNED';
```

---

## Restaurer les uploads

### Si uploads inclus dans le backup

```bash
cd "${BACKUP_DIR}"

# Copier les uploads vers le dossier projet
cp -r uploads/* /path/to/motorsafe/uploads/

# Vérifier les permissions
chown -R www-data:www-data /path/to/motorsafe/uploads/
```

### Si seulement l'inventaire (sans fichiers)

L'inventaire `uploads-inventory.jsonl` contient les métadonnées:

```bash
# Lire l'inventaire
cat uploads-inventory.jsonl | head -5

# Format: {"path":"uploads/1/documents/xxx.pdf","size":12345,"sha256":"abc123..."}
```

Si vous avez besoin de récupérer les fichiers:
1. Les fichiers originaux doivent être sur le stockage source (serveur ou S3)
2. Utilisez l'inventaire pour vérifier quels fichiers manquent
3. Restaurez depuis le stockage source

---

## Procédure complète

### Scénario: Restauration d'urgence

```bash
#!/bin/bash
set -euo pipefail

# 1. Configuration
export BACKUP_S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
export BACKUP_S3_ACCESS_KEY_ID="..."
export BACKUP_S3_SECRET_ACCESS_KEY="..."
export BACKUP_S3_BUCKET="motorsafe-backups"
export BACKUP_ENCRYPTION_PASS="..."
export DATABASE_URL="postgresql://user:pass@host:5432/motorsafe"

export AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY}"

# 2. Télécharger le dernier backup
mkdir -p /tmp/restore-emergency
cd /tmp/restore-emergency

ENDPOINT="--endpoint-url ${BACKUP_S3_ENDPOINT}"
BUCKET="s3://${BACKUP_S3_BUCKET}/motorsafe/production/"

LATEST=$(aws s3 ls ${ENDPOINT} "${BUCKET}" | grep "\.tar\.gz\.enc$" | sort | tail -1 | awk '{print $4}')
echo "Downloading: ${LATEST}"

aws s3 cp ${ENDPOINT} "${BUCKET}${LATEST}" .
aws s3 cp ${ENDPOINT} "${BUCKET}${LATEST}.sha256" .

# 3. Vérifier checksum
EXPECTED=$(cat *.sha256)
ACTUAL=$(sha256sum *.enc | cut -d' ' -f1)
[ "${EXPECTED}" = "${ACTUAL}" ] || { echo "Checksum failed!"; exit 1; }

# 4. Déchiffrer
ENC_FILE=$(ls *.enc)
TAR_FILE="${ENC_FILE%.enc}"

openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
    -in "${ENC_FILE}" \
    -out "${TAR_FILE}" \
    -pass env:BACKUP_ENCRYPTION_PASS

tar -xzf "${TAR_FILE}"

# 5. Restaurer DB
BACKUP_DIR=$(ls -d backup-* | head -1)
cd "${BACKUP_DIR}"

echo "Manifest:"
cat manifest.json

echo "Restoring database..."
pg_restore \
    "${DATABASE_URL}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    database.dump

# 6. Vérifier
psql "${DATABASE_URL}" -c "SELECT COUNT(*) as garages FROM \"Garage\";"
psql "${DATABASE_URL}" -c "SELECT COUNT(*) as interventions FROM \"Intervention\";"

echo "✓ Restauration terminée!"

# 7. Nettoyer
cd /
rm -rf /tmp/restore-emergency
```

---

## 🚨 En cas de problème

### Erreur "Checksum mismatch"

Le fichier est corrompu. Essayez:
1. Re-télécharger le backup
2. Utiliser un backup plus ancien

### Erreur "pg_restore: error"

Vérifiez:
1. Version PostgreSQL compatible (même version majeure)
2. Utilisateur a les droits CREATE/DROP
3. La base cible existe

### Passphrase incorrecte

```
error:06065064:digital envelope routines:EVP_DecryptFinal_ex:bad decrypt
```

La passphrase de déchiffrement est incorrecte. Vérifiez `BACKUP_ENCRYPTION_PASS`.

### Fichiers uploads manquants

Si les uploads ne sont pas dans le backup:
1. Vérifiez `manifest.json` → `includesUploads`
2. Utilisez `uploads-inventory.jsonl` pour identifier les fichiers
3. Restaurez depuis le stockage source (serveur/S3 original)

---

## 📞 Contacts

| Rôle | Contact |
|------|---------|
| Admin technique | admin@safemotor.fr |
| Hébergement DB | (votre provider) |
| Stockage backups | Cloudflare R2 |

---

*Dernière mise à jour: janvier 2025*
