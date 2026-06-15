# 🚀 Mettre l'app setter en ligne — Guide pas à pas (Railway)

> L'app est **branchée sur ta base Notion « 📢 Prospects webinaire »** : ta setter
> voit les vrais prospects, ses saisies + RDV s'enregistrent dedans, et tu as les
> stats en direct. Objectif : un lien `https://...` à lui envoyer. ⏱️ ~20 min.

**3 parties** : 1) Notion (jeton d'accès) · 2) GitHub (le code) · 3) Railway (en ligne).

---

## 🟦 Partie 1 — Le jeton Notion (2 min)

1. Va sur **https://www.notion.so/my-integrations** → **« + New integration »**
2. Nom : `Setter App` · choisis ton espace · **Submit**
3. Onglet **« Configuration »** → champ **« Internal Integration Secret »** → **Show** → **Copy**
   → ça commence par `secret_…` ou `ntn_…`. 📌 **Garde-le de côté.**

### Donner l'accès à la base à l'app
4. Ouvre ta base **« 📢 Prospects webinaire »** dans Notion
5. En haut à droite : **« ••• »** → **« Connexions »** → **« + Ajouter une connexion »** → **`Setter App`**

✅ À la fin : tu as ton jeton `secret_…`, et l'app a accès à la base.

---

## 🟩 Partie 2 — Mettre le code sur GitHub (5 min)

1. Crée un compte sur **https://github.com** (si besoin)
2. **« + »** (haut droite) → **« New repository »** → nom `setter-app` → **Create repository**
3. Clique **« uploading an existing file »**
4. Sur ton Mac, ouvre le dossier **`setter-app`** (`Desktop/CLaude/`)
5. Sélectionne **tout son contenu** (fichiers **+** dossiers `public`, `routes`, `services`) et **glisse-dépose** dans GitHub
6. En bas → **« Commit changes »**

✅ Tu dois voir `server.js`, `package.json`, `public/`, `routes/`, `services/`…

---

## 🟪 Partie 3 — Déployer sur Railway (10 min)

1. **https://railway.app** → **Login** → **« Login with GitHub »**
2. **« New Project »** → **« Deploy from GitHub repo »** → choisis **`setter-app`**
3. Railway démarre tout seul (~1 min). Clique sur le service créé.
4. Onglet **« Variables »** → ajoute (bouton « + New Variable ») :

   | Nom | Valeur |
   | --- | --- |
   | `NOTION_TOKEN` | *(ton jeton `secret_…` de la Partie 1)* |
   | `NOTION_SETTER_DB_ID` | `23fb927e-d71f-467e-aa9b-07e6c97c7522` |
   | `NODE_ENV` | `production` |

5. Railway redéploie automatiquement.
6. **Génère le lien** : onglet **« Settings »** → **« Networking »** → **« Generate Domain »**
   → tu obtiens `https://setter-app-production-xxxx.up.railway.app` 🎉

✅ Ouvre ce lien : tu dois voir la file d'appel avec tes prospects présents.

---

## 🟨 Partie 4 — Donner le lien à ta setter

Envoie l'adresse `https://….up.railway.app` à **Sylvie**. Elle l'ouvre sur son
ordi ou son téléphone :
- la **file d'appel** se remplit avec les prospects présents (les plus chauds en tête) ;
- elle clique un prospect → fiche + **script guidé** (étapes mot à mot) ;
- tout ce qu'elle saisit s'enregistre **tout seul** dans ta base Notion ;
- RDV booké → le prospect sort de la file, et tu le vois dans tes **stats**.

---

## 🟧 (Optionnel) Calendly automatique

Si tu veux que les RDV pris directement sur Calendly se marquent tout seuls :
- Crée un webhook Calendly `invitee.created` vers `https://TON-LIEN.up.railway.app/webhook/calendly`
- Mets la *signing key* Calendly dans une variable Railway `CALENDLY_WEBHOOK_SECRET`
*(Détails dans le [README.md](README.md).)*

---

### ❓ Un souci ?
Dis-moi **à quelle étape** (le numéro) et ce que tu vois — je débloque.
Tu n'as **pas besoin de me donner ton jeton** : tu le colles directement dans Railway.
