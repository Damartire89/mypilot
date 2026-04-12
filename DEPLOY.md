# Déploiement myPilot sur Railway

## Prérequis
- Compte GitHub avec ce repo (public ou privé)
- Compte Railway (gratuit sur railway.app)

---

## Étape 1 — Pusher le code sur GitHub

Dans le terminal, depuis le dossier `fleetly/` :

```bash
git init
git add .
git commit -m "feat: myPilot v1.1 — déploiement Railway"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/mypilot.git
git push -u origin main
```

---

## Étape 2 — Créer le projet Railway

1. Aller sur **railway.app** → Se connecter → **New Project**
2. Choisir **Deploy from GitHub repo** → Sélectionner `mypilot`
3. Railway propose de déployer automatiquement — **passer pour l'instant**

---

## Étape 3 — Ajouter PostgreSQL

Dans le projet Railway :
1. **New Service** → **Database** → **Add PostgreSQL**
2. PostgreSQL est créé — noter la variable `DATABASE_URL` (Railway l'injecte automatiquement)

---

## Étape 4 — Déployer le Backend

1. **New Service** → **GitHub Repo** → choisir `mypilot`
2. Dans les paramètres du service → **Root Directory** → `backend`
3. **Variables d'environnement** (onglet Variables) :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (lier au service PostgreSQL) |
| `SECRET_KEY` | Générer : `openssl rand -hex 32` (ex: `a3f8e2...`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |
| `ALLOWED_ORIGINS` | *(à remplir après création du frontend, voir étape 6)* |

4. Cliquer **Deploy** — attendre que le build passe ✓
5. Dans Settings → **Generate Domain** → noter l'URL (ex: `https://mypilot-backend.up.railway.app`)

---

## Étape 5 — Déployer le Frontend

1. **New Service** → **GitHub Repo** → choisir `mypilot`
2. **Root Directory** → `frontend`
3. **Variables d'environnement** :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://mypilot-backend.up.railway.app` *(URL du backend étape 4)* |

4. Cliquer **Deploy** — attendre ✓
5. Dans Settings → **Generate Domain** → noter l'URL (ex: `https://mypilot-frontend.up.railway.app`)

---

## Étape 6 — Mettre à jour le CORS backend

Revenir sur le service **backend** → Variables :
- `ALLOWED_ORIGINS` = `https://mypilot-frontend.up.railway.app`

**Redéployer le backend** (bouton Redeploy).

---

## Étape 7 — Vérifier

1. Ouvrir `https://mypilot-frontend.up.railway.app` dans le navigateur
2. Créer un compte → tester la démo
3. Partager l'URL à tes parents 🎉

---

## Notes

- **Données de démo** : lancer le seed depuis le backend Railway (onglet Terminal dans Railway) :
  ```bash
  python seed_demo.py
  ```
- **Mise à jour** : un `git push` sur `main` redéploie automatiquement
- **Gratuit** jusqu'à 500h/mois sur Railway (largement suffisant pour une démo)
