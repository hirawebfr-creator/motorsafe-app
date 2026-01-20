export default async function DashboardLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");
  
  return <DashboardShell user={user}>{children}</DashboardShell>;
}# SafeMotor — Kit Commercial

> Scripts de vente, structure démo, objections & checklist.
> Document interne — Janvier 2026

---

## 📌 Pitch 30 secondes

> À utiliser en appel froid, message vocal, ou accroche rapide.

```
SafeMotor, c'est l'outil qui te protège quand il y a une casse, 
un client de mauvaise foi ou une assurance qui se retourne contre toi.

Tu fais signer le client sur son téléphone, tu as un dossier clair 
avec documents, preuves et historique, et tu peux exporter un ZIP 
prêt pour l'assurance ou un expert.

Ça te prend 2 minutes par véhicule et ça t'évite des mois de galère.
```

**Points clés :**
- Protection contre les litiges
- Signature mobile
- Export assurance-ready
- 2 minutes par véhicule

---

## 📌 Pitch 2 minutes

> À utiliser en rendez-vous, appel qualifié, ou démo courte.

```
Aujourd'hui, le garage est souvent le "fusible" dès qu'il y a une panne 
après une intervention. Même si t'as bien bossé, si t'as pas une preuve 
propre, tu peux te faire embarquer.

SafeMotor te donne un parcours simple : 
- Client, véhicule, intervention
- Document avec clauses légales
- Signature mobile (QR code)
- Dossier complet : OR, PV restitution, photos
- Et si besoin : dossier incident

Derrière, tout est tracé (dates, statuts, hash, historique) et tu peux 
sortir un export assurance/justice-ready en un clic.

Tu gardes tes preuves 10 ans, la compta 10 ans, l'opérationnel 12 mois.

Le but : gagner du temps, éviter les litiges, et être carré si quelqu'un 
te cherche.
```

**À adapter selon le contexte :**
- Reprogrammation/E85 → insister sur les clauses assurance/homologation
- Mécanique générale → insister sur le PV de restitution
- Grosse structure → insister sur les rôles/permissions

---

## 📌 Script démo 10 minutes

> Ordre exact à suivre pour une démo en direct.

### Étape 1 — Client + Véhicule (1 min)
1. Créer un client (Jean Martin, 06...)
2. Ajouter un véhicule (AB-123-CD ou recherche par plaque)
3. Montrer la fiche véhicule

**Point clé :** "30 secondes, t'as ton client et son véhicule."

### Étape 2 — Intervention (1 min)
1. Créer une intervention (ex: Conversion E85)
2. Ajouter des notes, tags
3. Montrer le statut (OUVERT)

**Point clé :** "Tu traces ce que tu fais, quand tu le fais."

### Étape 3 — Ordre de Réparation (2 min)
1. Générer l'OR
2. Montrer les clauses légales intégrées
3. Montrer la prévisualisation PDF

**Point clé :** "Les clauses sont déjà là : assurance, homologation, garantie."

### Étape 4 — Signature mobile (2 min)
1. Cliquer "Envoyer à signer"
2. Montrer le QR code
3. Scanner avec ton téléphone (ou celui du prospect)
4. Montrer la page de signature mobile
5. Signer
6. Revenir sur l'écran — montrer le statut SIGNÉ

**Point clé :** "Le client signe sur son tel, t'as le doc signé immédiatement."

### Étape 5 — Dossier complet (2 min)
1. Ouvrir le dossier intervention
2. Montrer : doc signé, hash, historique
3. Montrer le PV de restitution (si applicable)
4. Montrer les photos attachées

**Point clé :** "Tout est tracé : date, heure, IP, hash."

### Étape 6 — Export assurance (1 min)
1. Cliquer "Export ZIP"
2. Télécharger le fichier
3. Ouvrir et montrer le contenu

**Point clé :** "En un clic, t'as tout pour l'expert ou l'avocat."

### Étape 7 — Tarifs & onboarding (1 min)
1. Montrer la page tarifs
2. Expliquer : gratuit pour tester, Pro pour travailler
3. "Tu veux qu'on te crée ton compte ?"

---

## 📌 Objections & Réponses (résumé)

| Objection | Réponse courte |
|-----------|----------------|
| **"Pourquoi payer ?"** | Un litige mal géré = milliers d'€ + mois de stress. SafeMotor = assurance anti-galère. |
| **"Mon assureur s'en fiche"** | Ton assureur veut des preuves. Un dossier propre avec hash, c'est exactement ça. |
| **"Je fais déjà signer un papier"** | Un papier se perd, se conteste. Signature mobile = horodatée, hashée, opposable. |
| **"Et si le client dit qu'il n'a pas signé ?"** | Tu as date, heure, IP, hash, audit trail. Les preuves sont là. |
| **"RGPD ?"** | Conforme. Données EU, chiffrées, rétention légale, export/anonymisation possible. |
| **"Ça prend combien de temps ?"** | 2 min par véhicule. Plus rapide que chercher un stylo. |
| **"Et si internet tombe ?"** | Lien de signature valide. Copie SMS/WhatsApp. Sync après. |

---

## 📌 Checklist avant rendez-vous

### Préparation
- [ ] Compte démo prêt (données de test)
- [ ] Téléphone chargé (pour scanner le QR)
- [ ] WiFi/4G stable
- [ ] Onglets ouverts : dashboard, intervention, signature

### Documents à avoir
- [ ] One-pager Protection (PDF)
- [ ] One-pager Assurance (PDF)
- [ ] One-pager Tarifs (PDF)

### Questions à poser au prospect
1. "Tu fais quel type d'interventions principalement ?"
2. "T'as déjà eu un souci avec un client qui conteste ?"
3. "Comment tu fais signer aujourd'hui ?"
4. "Tu gardes tes documents comment / combien de temps ?"

### Objectif du RDV
- [ ] Démo complète (10 min)
- [ ] Identifier le besoin principal (protection / organisation / les deux)
- [ ] Proposer l'essai gratuit
- [ ] Fixer un suivi (relance J+3)

---

## 📌 Messages de prospection

### Message Instagram/Facebook
```
Salut ! Je développe un outil pour les garages : signature mobile, 
dossier complet, export assurance en cas de litige.

Si t'as déjà eu un client de mauvaise foi ou une assurance qui te 
cherche, ça peut t'intéresser.

Essai gratuit : safemotor.fr

Hésite pas si tu veux une démo rapide 👋
```

### SMS (< 160 caractères)
```
Bonjour, SafeMotor = protection garage : signature mobile + dossier 
assurance-ready. Essai gratuit : safemotor.fr — Intéressé ?
```

### Email froid
```
Objet : Protection garage — signature mobile + dossier assurance

Bonjour,

SafeMotor est un outil qui protège les garages en cas de litige :
- Signature client sur mobile (QR code)
- Dossier complet avec preuves (hash, historique)
- Export ZIP pour assurance ou expert

Ça prend 2 min par véhicule. Essai gratuit.

Démo rapide si ça vous intéresse ?

Cordialement,
[Ton nom]
safemotor.fr
```

---

## 📌 Liens utiles

| Page | URL |
|------|-----|
| Démo | safemotor.fr/demo |
| FAQ/Objections | safemotor.fr/objections |
| One-pager Protection | safemotor.fr/assets/onepager/protection |
| One-pager Assurance | safemotor.fr/assets/onepager/assurance |
| One-pager Tarifs | safemotor.fr/assets/onepager/tarifs |
| Inscription Pro | safemotor.fr/pro/inscription |
| Mentions légales | safemotor.fr/legal |

---

*Document interne SafeMotor — Janvier 2026*
