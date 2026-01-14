# Déploiement Motorsafe (Next.js + Prisma + Vercel)

## 1. Prérequis
- Repo GitHub à jour (branche main)
- Accès à Vercel (https://vercel.com)
- Variables d'environnement prêtes (voir `.env.example`)

## 2. Pipeline CI/CD
- CI : `.github/workflows/ci.yml` (lint, typecheck, test, build)
- Déploiement : `.github/workflows/deploy-vercel.yml` (push sur main = prod, PR = preview)

## 3. Setup Vercel
1. Crée un projet Vercel et connecte-le à ce repo.
2. Récupère les IDs :
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_TOKEN` (token personnel Vercel)
3. Ajoute ces secrets dans GitHub (Settings > Secrets > Actions) :
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `DATABASE_URL` (prod)
   - Toute autre variable d'env utile (voir `.env.example`)
4. Sur Vercel, configure les variables d'environnement (copie `.env.example`)
5. (Optionnel) Ajoute le domaine personnalisé dans Vercel (ex : safemotor.fr ou app.safemotor.fr)
6. Configure le DNS :
   - Pour un sous-domaine : CNAME vers l'URL Vercel
   - Pour le domaine principal : A record (voir doc Vercel)

## 4. Commandes utiles
- Lancer la CI manuellement : push ou PR sur main
- Déploiement preview : créer une PR
- Déploiement prod : merge sur main

## 5. Healthcheck
- Endpoint : `/api/health` (check API + DB si DATABASE_URL)

## 6. Prisma
- Les migrations sont appliquées automatiquement sur prod (`prisma migrate deploy`)
- Génération du client Prisma : `prisma generate` (postinstall)

## 7. Variables d'environnement
Voir `.env.example` pour la liste complète.

---

## 8. Yousign (Signature électronique)

### Configuration
Ajouter les variables d'environnement suivantes :

```env
# Clé API Yousign (obtenue depuis le dashboard Yousign)
YOUSIGN_API_KEY=RGxLXSRoG45efMkcPPhgjITcJwBkVGlh

# Secret pour vérifier les webhooks Yousign (HMAC SHA-256)
YOUSIGN_WEBHOOK_SECRET=4b514566c4948a5b421b22355fa20ac5

# Environnement Yousign: "sandbox" pour test, "production" pour prod
YOUSIGN_ENV=sandbox

# URL de l'application (utilisée pour générer le PDF via fetch interne)
APP_URL=https://votre-app.vercel.app
```

### Configuration du Webhook Yousign
1. Connectez-vous au dashboard Yousign (https://app.yousign.com ou https://sandbox.yousign.com)
2. Allez dans **Paramètres** > **Webhooks**
3. Créez un nouveau webhook :
   - **URL** : `{APP_URL}/api/webhooks/yousign`
   - **Events** à écouter :
     - `signature_request.done`
     - `signature_request.declined`
     - `signature_request.expired`
     - `signature_request.canceled`
     - `signer.done`
     - `signer.declined`
   - **Secret** : Copiez le secret affiché et mettez-le dans `YOUSIGN_WEBHOOK_SECRET`

### Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/webhooks/yousign` | POST | Réception des webhooks Yousign |
| `/api/interventions/[id]/signature/yousign` | POST | Créer une demande de signature |
| `/api/interventions/[id]/signature/yousign` | GET | Lister les demandes de signature |

### Flux de signature
1. Le garage clique "Demander signature client" sur une intervention
2. Le système génère le PDF de l'Ordre de Réparation
3. Le PDF est uploadé sur Yousign
4. Le client (signer) est ajouté avec un champ signature
5. La demande est activée → Yousign envoie l'email au client
6. Le client signe via l'interface Yousign
7. Webhook `signature_request.done` reçu
8. Le système télécharge le document signé + audit trail
9. Les fichiers sont stockés et associés à l'intervention

### Modèles de données

- `ESignatureRequest` : Stocke les demandes de signature Yousign
- `YousignWebhookEvent` : Audit log de tous les webhooks reçus (idempotence)

### Test HMAC
Pour tester la vérification HMAC localement :
```bash
npx ts-node scripts/test-yousign-hmac.ts
```

---

## Checklist Quentin (mise en prod)
- [ ] Créer le projet Vercel et le lier au repo
- [ ] Récupérer et ajouter les secrets dans GitHub
- [ ] Configurer les variables d'env sur Vercel
- [ ] Ajouter le domaine personnalisé
- [ ] Lancer un premier déploiement (push sur main)
- [ ] Vérifier `/api/health` et l'app en prod

---

Pour toute modif, push sur main = déploiement automatique sur __PROD_URL__
