# 📋 Setter App — Les Instapreneurs

Système de gestion de la file d'appel setter : les leads tagués dans **System.io** (présents / absents au webinaire) arrivent automatiquement dans une base **Notion**, la setter les appelle depuis une interface guidée (script mot à mot), et chaque RDV booké met à jour la base Setter **et** le Pipeline.

```
System.io ──(webhook tag)──▶  Backend  ──▶  Notion (base 📋 File d'appel setter)
Calendly  ──(webhook résa)──▶  Backend  ──▶  Notion (Setter + Pipeline)
Setter    ──(interface web)─▶  Backend  ──▶  Notion
```

## Arborescence

```
setter-app/
├── .env.example          # variables d'environnement à copier en .env
├── package.json
├── Procfile              # déploiement Railway / Heroku-like
├── server.js             # point d'entrée Express
├── config.js             # ⚙️ tags System.io reconnus (à éditer à chaque nouveau webi)
├── routes/
│   ├── webhooks.js       # POST /webhook/sio-tag, POST /webhook/calendly
│   └── api.js            # GET/PATCH /api/leads, POST /api/leads/:id/book, GET /api/stats
├── services/
│   ├── notion.js         # tout le CRUD Notion (jamais de suppression, archivage only)
│   └── scoring.js        # score chaleur (10 → -1 tous les 3 jours)
└── public/               # interface setter (SPA vanilla, thème clair)
    ├── index.html
    ├── app.js            # logique + textes du script d'appel (modifiables ici)
    └── style.css
```

## 1. Variables d'environnement

Copier le modèle puis remplir :

```bash
cp .env.example .env
```

| Variable | Rôle |
| --- | --- |
| `NOTION_TOKEN` | Token de l'intégration Notion (`secret_…`) |
| `NOTION_CONTACTS_DB_ID` | Base Contacts (déjà : `417455b8-7563-47cc-8881-13a1015c402f`) |
| `NOTION_PIPELINE_DB_ID` | Base Pipeline (déjà : `722fc523-f7b1-452e-be04-09d59bd8f68f`) |
| `NOTION_SETTER_DB_ID` | Base setter — **laisser vide au 1er démarrage**, elle est créée automatiquement et son ID s'affiche dans les logs → le coller ici puis redémarrer |
| `NOTION_PARENT_PAGE_ID` | Page Notion sous laquelle créer la base setter (nécessaire seulement si `NOTION_SETTER_DB_ID` est vide) |
| `CALENDLY_WEBHOOK_SECRET` | Calendly → Webhooks → *Signing key* (vérification de signature) |
| `ANTHROPIC_API_KEY` | Optionnel — enrichissement de briefing IA |
| `PORT` | Port HTTP (3000 par défaut) |

⚠️ L'intégration Notion doit être **partagée** avec : la base Contacts, la base Pipeline et la page parente (puis la base setter créée).

## 2. Démarrage local

```bash
npm install
npm start          # → http://localhost:3000
```

Au premier démarrage, la base `📋 File d'appel setter` est créée dans Notion et son ID est loggé — l'ajouter dans `.env` (`NOTION_SETTER_DB_ID=...`).

💡 **Sans `.env`**, l'app démarre quand même et l'interface tourne en **mode démo** (données fictives) — pratique pour tester le script d'appel.

## 3. Webhooks System.io

Dans System.io → **Automatisations → Éditeur de workflows**, créer **3 workflows** qui pointent tous vers le même endpoint `POST https://TON_DOMAINE/webhook/sio-tag` :

| Workflow | Déclencheur (Tag ajouté) | ID du tag |
| --- | --- | --- |
| 1 — Présent webi | `Présent Webi (lundi)` | `1676347` |
| 2 — Absent webi | `Absent Webi (lundi)` | `1701606` |
| 3 — Résa call | `Résa call` | `1693176` |

Le backend route selon le tag reçu (nom exact **ou** ID — double vérification).

🆕 **Nouveau webinaire un autre jour ?** Ajouter simplement le nouveau tag dans [config.js](config.js) (`TAGS_PRESENT_WEBI` / `TAGS_ABSENT_WEBI`) + créer le workflow SIO correspondant. Aucun autre code à toucher.

## 4. Webhook Calendly

Calendly n'expose les webhooks que via son API (plan payant). Créer la souscription :

```bash
curl -X POST https://api.calendly.com/webhook_subscriptions \
  -H "Authorization: Bearer TON_TOKEN_CALENDLY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://TON_DOMAINE/webhook/calendly",
    "events": ["invitee.created"],
    "organization": "https://api.calendly.com/organizations/TON_ORG",
    "scope": "organization"
  }'
```

Puis récupérer la **signing key** retournée et la mettre dans `CALENDLY_WEBHOOK_SECRET`.
À chaque réservation sur `https://calendly.com/contact-3568/etre-rappele-par-les-instapreneurs-set` :
fiche setter → `✅ RDV booké` + date, et Pipeline → `📞 Call réservé`.

## 5. Déploiement

### Railway

1. Pousser le dossier sur un repo GitHub
2. Railway → *New Project* → *Deploy from GitHub repo*
3. Ajouter les variables d'env (onglet **Variables**)
4. Le `Procfile` (`web: node server.js`) est détecté automatiquement
5. Récupérer l'URL publique → la mettre dans les webhooks SIO + Calendly

### Render

1. *New* → *Web Service* → connecter le repo
2. **Build command** : `npm install` — **Start command** : `node server.js`
3. Ajouter les variables d'env, déployer, récupérer l'URL

## 6. Endpoints

| Méthode | Route | Rôle |
| --- | --- | --- |
| `POST` | `/webhook/sio-tag` | Tags SIO → création/MAJ fiche setter, ou archivage si `Résa call` |
| `POST` | `/webhook/calendly` | Résa Calendly → `✅ RDV booké` + MAJ Pipeline |
| `GET` | `/api/leads` | File d'appel (hors bookés), présents d'abord, score recalculé |
| `PATCH` | `/api/leads/:id` | MAJ fiche (statut, notes, note webi, financement…) |
| `POST` | `/api/leads/:id/book` | RDV confirmé par la setter → Setter + Pipeline |
| `GET` | `/api/stats` | Dashboard (compteurs, taux conv., RDV sur 7 jours) |
| `GET` | `/health` | Healthcheck |

## Règles métier intégrées

- Les leads `🔥 Présent webi` passent **toujours** avant les absents, puis tri par score décroissant
- Le **score chaleur** (10 au départ, −1 tous les 3 jours) est recalculé à chaque chargement, jamais figé
- **Aucune suppression** dans Notion — uniquement de l'archivage (`Résa call`)
- Doublons : un email déjà présent dans la base setter est **mis à jour**, pas dupliqué (sauf s'il est déjà booké)
- Les webhooks répondent immédiatement (< 500 ms), le traitement Notion est asynchrone
- Le téléphone est cliquable (`tel:`) → lance directement l'appel OnOff

## Modifier le script d'appel

Les textes lus par la setter (speechs) et les options des questions sont regroupés en haut de [public/app.js](public/app.js) (`SPEECHES` et `OPTIONS`) — modifiables sans toucher au reste du code.
