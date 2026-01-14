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

## 8. Signature électronique (interne)

Le système de signature est entièrement interne et ne nécessite aucun service externe.

### Fonctionnement
1. Le garage crée une demande de signature depuis l'intervention
2. Un lien unique est généré (token sécurisé)
3. Le lien peut être partagé par email, SMS ou copié-collé
4. Le client ouvre le lien sur son appareil (mobile-first)
5. Il consulte le PDF, saisit son nom et signe
6. La signature est enregistrée avec horodatage et IP

### Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/signatures/start` | POST | Créer une demande de signature |
| `/api/signatures/[token]` | GET | Consulter une demande |
| `/api/signatures/[token]/sign` | POST | Signer un document |
| `/api/signatures/[token]/viewed` | POST | Marquer comme consulté |
| `/api/signatures/[token]/pdf` | GET | Télécharger le PDF |
| `/api/interventions/[id]/signatures` | GET | Lister les signatures d'une intervention |

### Page publique de signature
`/sign/[token]` - Page mobile-first permettant au client de signer

### Modèles de données
- `SignatureRequest` : Demande de signature avec token, expiration, statut
- `SignatureEvent` : Audit log (CREATED, SENT, VIEWED, SIGNED, DECLINED)

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
