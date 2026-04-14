# Déploiement myPilot — GitHub → Vercel (frontend) + backend séparé

## Prérequis

- Repo GitHub `Damartire89/mypilot` (déjà configuré)
- Compte Vercel connecté à GitHub
- Backend déployé séparément (Render, Fly.io, VPS...) avec PostgreSQL

---

## Étape 1 — Déployer le backend

Le backend FastAPI peut tourner sur n'importe quel hébergeur Python.

### Variables d'environnement requises

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL (ex: `postgresql://user:pass@host/db`) |
| `SECRET_KEY` | Clé JWT — générer avec `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | URL du frontend Vercel (ex: `https://mypilot.vercel.app`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée JWT en minutes (défaut: 1440 = 24h) |

### Commande de démarrage

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Appliquer les migrations

```bash
PYTHONPATH=. alembic upgrade head
```

---

## Étape 2 — Déployer le frontend sur Vercel

1. Aller sur **vercel.com** → **Add New Project**
2. Importer le repo GitHub `Damartire89/mypilot`
3. Configurer le projet :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Ajouter la variable d'environnement :

| Variable | Valeur |
|---|---|
| `VITE_API_URL` | URL du backend (ex: `https://mypilot-api.onrender.com`) |

5. Cliquer **Deploy**

---

## Étape 3 — Mettre à jour ALLOWED_ORIGINS sur le backend

Une fois le frontend déployé, noter l'URL Vercel (ex: `https://mypilot.vercel.app`) et la renseigner dans `ALLOWED_ORIGINS` sur le backend, puis redémarrer.

---

## Étape 4 — Vérification

1. Ouvrir l'URL Vercel dans le navigateur
2. Créer un compte ou se connecter
3. Vérifier que le dashboard, les courses et la flotte fonctionnent

---

## Données de démo (optionnel)

Depuis le répertoire `backend` :

```bash
PYTHONPATH=. python seed_demo.py
```

---

## Mises à jour

Un `git push` sur `main` redéploie automatiquement le frontend via Vercel.
