# Déploiement myPilot

## Architecture

- **Frontend** : Vercel → https://mypilot-five.vercel.app (déploiement auto sur push `main`)
- **Backend** : Render Web Service → https://mypilot-api.onrender.com (déploiement manuel)
- **DB** : Render PostgreSQL (interne au réseau Render)
- **Repo** : github.com/Damartire89/mypilot

---

## Déploiement initial (procédure complète)

### 1. Créer la DB sur Render

1. render.com → **New → PostgreSQL**
2. Nom : `mypilot-db` — Plan : Free
3. Copier l'**Internal Database URL**

### 2. Créer le Web Service sur Render

1. render.com → **New → Web Service** → connecter `Damartire89/mypilot`
2. **Root Directory** : `backend`
3. **Runtime** : Python 3
4. **Build command** : `pip install -r requirements.txt`
5. **Start command** (premier démarrage — crée les tables et le compte démo) :
   ```
   PYTHONPATH=. alembic upgrade head && PYTHONPATH=. python seed_demo.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. **Variables d'environnement** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | Internal Database URL copiée depuis Render PostgreSQL |
| `SECRET_KEY` | Générer avec `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | `https://mypilot-five.vercel.app` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |

7. Déployer et attendre que le service soit **Live**
8. **Remettre la Start command normale** (sans seed) pour éviter de réinitialiser les données à chaque redémarrage :
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### 3. Configurer Vercel

1. vercel.com → projet mypilot → **Settings → Environment Variables**
2. Ajouter :

| Variable | Valeur |
|---|---|
| `VITE_API_URL` | `https://mypilot-api.onrender.com` |

3. **Redéployer** le projet (Settings → Deployments → Redeploy)

---

## Mises à jour (workflow normal)

### Frontend uniquement (UI, textes, styles)
```
git push origin main
```
→ Vercel redéploie automatiquement. Rien d'autre à faire.

### Backend modifié (API, modèles, migrations)
```
git push origin main
```
Puis sur Render → Web Service → **Manual Deploy → Deploy latest commit**

Si migration ajoutée, changer temporairement la Start command :
```
PYTHONPATH=. alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
Puis remettre la normale après le premier démarrage.

---

## Comptes démo

| Compte | Email | Mot de passe | Rôle |
|---|---|---|---|
| Démo public | demo@taximartin.fr | demo1234 | admin |
| Supervision | admin@mypilot.app | superadmin2026! | superadmin |

Le superadmin accède au panel `/superadmin` — liste de toutes les entreprises + membres.

---

## Notes importantes

- Le free tier Render a un **cold start ~30 sec** après inactivité. La page login affiche "Démarrage du serveur..." au bout de 5s — c'est normal et géré dans le code.
- `frontend/.env` = local uniquement, jamais committé
- `frontend/.env.example` = référence pour Vercel
- `backend/.env` = local uniquement, jamais committé
- `backend/.env.example` = référence pour Render
