# 🚀 Runbook Production - MotorSafe

Ce document décrit les procédures opérationnelles pour le déploiement et la maintenance de MotorSafe en production.

## 📋 Table des matières

1. [Go-Live Checklist](#go-live-checklist)
2. [Variables d'environnement](#variables-denvironnement)
3. [Health Checks](#health-checks)
4. [Monitoring & Alertes](#monitoring--alertes)
5. [Procédures d'urgence](#procédures-durgence)
6. [Maintenance planifiée](#maintenance-planifiée)

---

## ✅ Go-Live Checklist

### Infrastructure

- [ ] **Base de données PostgreSQL** configurée (Prisma Accelerate ou autre)
  - [ ] `DATABASE_URL` défini avec les credentials production
  - [ ] Migrations appliquées: `npx prisma migrate deploy`
  - [ ] Connexion testée via `/api/health`

- [ ] **Domaine & SSL**
  - [ ] Domaine configuré sur Vercel/hébergeur
  - [ ] SSL actif (Let's Encrypt ou custom)
  - [ ] `NEXT_PUBLIC_APP_URL` pointe vers le domaine prod


### Services externes

- [ ] **Stripe (Paiements)**
  - [ ] Compte Stripe vérifié et activé
  - [ ] `STRIPE_SECRET_KEY` (live, pas test!)
  - [ ] `STRIPE_WEBHOOK_SECRET` configuré
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] Webhook `/api/stripe/webhook` configuré dans Stripe Dashboard
  - [ ] Produits/Prices créés (starter, pro, enterprise)

- [ ] **Resend (Emails)**
  - [ ] Domaine vérifié dans Resend
  - [ ] `RESEND_API_KEY` configuré
  - [ ] `EMAIL_FROM` défini (ex: `notifications@votredomaine.fr`)

- [ ] **IA (Optionnel)**
  - [ ] `AI_PROVIDER` défini (`openai`, `anthropic`, ou `mock`)
  - [ ] `AI_API_KEY` si provider != mock

### Sécurité

- [ ] **Admin access**
  - [ ] `ADMIN_KEY` défini (pour accès programmatique)
  - [ ] Utilisateur admin créé: `node scripts/create-admin.js`
  
- [ ] **Headers sécurité** (déjà configurés dans next.config.ts)
  - CSP, X-Frame-Options, X-Content-Type-Options, etc.

- [ ] **Rate limiting** actif sur toutes les routes publiques

### Tests finaux

- [ ] Build réussi: `npm run build`
- [ ] Health check OK: `GET /api/health`
- [ ] Admin health OK: `GET /api/admin/health` (avec auth)
- [ ] Inscription garage fonctionnelle
- [ ] Paiement Stripe test réussi
- [ ] Email de bienvenue reçu

---

## 🔐 Variables d'environnement

### Obligatoires

```env
# Database (connexion directe PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/motorsafe"

# App URL (pour OAuth callbacks et liens emails)
NEXT_PUBLIC_APP_URL="https://votredomaine.fr"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="MotorSafe <notifications@votredomaine.fr>"

# Admin
ADMIN_KEY="votre-cle-admin-secrete"
```

> **Note**: MotorSafe utilise un système d'authentification custom basé sur des sessions (cookie `ms_session`), pas NextAuth. Les variables `NEXTAUTH_*` ne sont pas nécessaires.

### Optionnelles

```env
# IA (défaut: mock)
AI_PROVIDER="openai"  # openai | anthropic | mock
AI_API_KEY="sk-..."

# Vehicle lookup
SIV_API_KEY="..."     # API immatriculation

# Encryption
ENCRYPTION_KEY="..."  # 32 bytes hex pour chiffrement client
```

---

## 🏥 Health Checks

### Endpoint public (uptime monitors)

```
GET /api/health
```

Réponse:
```json
{ "ok": true }
```

ou en cas d'erreur:
```json
{ "ok": false, "error": "db-error" }
```

**Usage:** Configurer un monitor (UptimeRobot, Pingdom, etc.) pour vérifier toutes les minutes.

### Endpoint admin (détaillé)

```
GET /api/admin/health
Header: x-admin-key: <ADMIN_KEY>
```

ou avec session admin authentifiée.

Réponse:
```json
{
  "overall": "ok",
  "services": [
    { "service": "db", "status": "ok", "latencyMs": 12 },
    { "service": "stripe", "status": "ok" },
    { "service": "email", "status": "ok" },
    { "service": "ai", "status": "ok", "message": "Mock provider" },
    { "service": "storage", "status": "ok" }
  ],
  "metrics": {
    "totalGarages": 42,
    "activeSubscriptions": 38,
    "pendingApprovals": 3
  },
  "recentEvents": [...]
}
```

### Dashboard admin

```
https://votredomaine.fr/admin/system
```

Interface graphique pour visualiser l'état du système en temps réel.

---

## 📊 Monitoring & Alertes

### Métriques clés à surveiller

| Métrique | Seuil warning | Seuil critique |
|----------|---------------|----------------|
| DB latency | > 100ms | > 500ms |
| Health check | 1 échec | 3 échecs consécutifs |
| 5xx errors | > 1/min | > 10/min |
| Pending approvals | > 10 | > 20 |

### Configuration alertes recommandée

1. **UptimeRobot/Pingdom** sur `/api/health`
   - Intervalle: 1 minute
   - Alerte: email + SMS si down > 2 min

2. **Vercel Analytics** (si sur Vercel)
   - Activer les alertes de performance
   - Seuil: TTFB > 1s

3. **Stripe Dashboard**
   - Activer les notifications webhook failures
   - Surveiller les paiements échoués

4. **Logs Vercel/Hébergeur**
   - Filtrer les erreurs 5xx
   - Alerter si > 10 erreurs/heure

---

## 🚨 Procédures d'urgence

### Site inaccessible

1. Vérifier `/api/health` directement
2. Vérifier le dashboard Vercel/hébergeur
3. Vérifier les logs pour identifier l'erreur
4. Si DB down:
   - Vérifier Prisma Accelerate status
   - Vérifier credentials dans `DATABASE_URL`
5. Rollback si déploiement récent

### Paiements ne fonctionnent pas

1. Vérifier Stripe Dashboard pour les événements
2. Vérifier que le webhook est bien configuré
3. Vérifier les logs du endpoint `/api/stripe/webhook`
4. Vérifier `STRIPE_WEBHOOK_SECRET` correct

### Emails non reçus

1. Vérifier Resend Dashboard
2. Vérifier le domaine vérifié
3. Vérifier `RESEND_API_KEY` et `EMAIL_FROM`
4. Tester manuellement via Resend

### Saturation rate-limit

Si des utilisateurs légitimes sont bloqués:

```sql
-- Voir les limites actives
SELECT * FROM "RateLimitEntry" 
WHERE "windowStart" > NOW() - INTERVAL '1 hour'
ORDER BY count DESC LIMIT 20;

-- Réinitialiser pour une IP spécifique
DELETE FROM "RateLimitEntry" WHERE key LIKE '%<IP>%';
```

---

## 🔧 Maintenance planifiée

### Avant un déploiement

1. Vérifier que le build passe: `npm run build`
2. Tester en staging si disponible
3. Prévenir les utilisateurs si downtime prévu

### Migrations de base de données

```bash
# Générer la migration
npx prisma migrate dev --name description

# Appliquer en production
npx prisma migrate deploy

# Rollback manuel si nécessaire
# (voir les fichiers SQL dans prisma/migrations/)
```

### Nettoyage périodique

```sql
-- Purger les anciens événements système (> 90 jours)
DELETE FROM "SystemEvent" WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Purger les anciens rate limits (> 1 jour)
DELETE FROM "RateLimitEntry" WHERE "windowStart" < NOW() - INTERVAL '1 day';

-- Purger les anciens audit logs (optionnel, > 1 an)
DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '1 year';
```

---

## 📞 Contacts d'urgence

| Rôle | Contact |
|------|---------|
| Admin technique | admin@safemotor.fr |
| Support Stripe | dashboard.stripe.com |
| Support Resend | resend.com/support |
| Support Vercel | vercel.com/support |

---

## 📝 Changelog opérationnel

| Date | Action | Responsable |
|------|--------|-------------|
| YYYY-MM-DD | Go-live initial | - |
| | | |

---

*Dernière mise à jour: janvier 2025*
