# Design — Gestion des accès et comptes (myPilot)

**Date :** 2026-04-13
**Statut :** Approuvé

---

## Contexte

myPilot est un SaaS B2B de gestion de flotte. Actuellement, chaque inscription crée une entreprise avec un unique compte `admin`. Il n'existe pas de :
- Panel superadmin pour voir/gérer tous les comptes (besoin Damien en tant que créateur du SaaS)
- Gestion de membres au sein d'une entreprise (besoin des gérants)

---

## Objectifs

1. Panel superadmin accessible depuis l'interface (rôle `superadmin`) pour gérer toutes les entreprises et utilisateurs
2. Système d'invitation par lien pour permettre à un gérant d'ajouter des membres à son entreprise avec un rôle défini
3. Restrictions UI/API selon le rôle de l'utilisateur connecté

---

## Modèle de données

### Table `users` — modification du champ `role`

Valeurs acceptées : `superadmin` | `admin` | `manager` | `readonly`

| Rôle | Description |
|---|---|
| `superadmin` | Accès complet à tout, panel admin global |
| `admin` | Accès complet à son entreprise, peut inviter des membres |
| `manager` | Saisie/modification courses, chauffeurs, véhicules — pas les paramètres ni l'équipe |
| `readonly` | Consultation uniquement — tous les POST/PUT/DELETE bloqués |

### Nouvelle table `invitations`

| Colonne | Type | Description |
|---|---|---|
| `id` | Integer PK | |
| `company_id` | Integer FK companies | Entreprise qui invite |
| `email` | String(200) | Email destinataire |
| `role` | String(20) | Rôle attribué à l'acceptation |
| `token` | String(64) | UUID unique |
| `created_by` | Integer FK users | Admin qui a créé l'invitation |
| `expires_at` | DateTime | Validité 7 jours |
| `used_at` | DateTime nullable | Renseigné à l'acceptation |
| `created_at` | DateTime | |

---

## Endpoints API

### Router `/api/v1/admin` — superadmin uniquement

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/companies` | Liste toutes les entreprises |
| GET | `/admin/companies/{id}/users` | Membres d'une entreprise |
| DELETE | `/admin/companies/{id}` | Supprimer une entreprise et ses données |
| POST | `/admin/users/{id}/reset-password` | Générer un nouveau mot de passe temporaire |
| PATCH | `/admin/users/{id}/role` | Changer le rôle d'un utilisateur |

### Router `/api/v1/members` — admin de l'entreprise

| Méthode | Route | Description |
|---|---|---|
| GET | `/members` | Liste les membres de son entreprise |
| POST | `/members/invite` | Créer un lien d'invitation (email + rôle) |
| DELETE | `/members/{id}` | Retirer un membre |
| PATCH | `/members/{id}/role` | Changer le rôle d'un membre |

### Router `/api/v1/invitations` — public

| Méthode | Route | Description |
|---|---|---|
| GET | `/invitations/{token}` | Vérifier validité du lien |
| POST | `/invitations/{token}/accept` | Créer son compte (email prérempli, choisir mdp) |

### Middleware de rôles sur les endpoints existants

Tous les routers existants (`/rides`, `/drivers`, `/vehicles`, `/settings`) reçoivent une vérification :
- `readonly` → bloque tous les POST, PUT, PATCH, DELETE (HTTP 403)
- `manager` → bloque les routes `/settings` et `/members`
- `admin` et `superadmin` → accès complet

---

## Frontend

### Panel superadmin (`/superadmin`)

- Lien discret en bas de sidebar, visible uniquement si `role === "superadmin"`
- Vue entreprises : tableau avec nom, email, date création, nb membres, actions (voir membres, supprimer)
- Vue membres d'une entreprise : email, rôle (badge), date création, boutons reset password + changer rôle

### Onglet Équipe dans Paramètres

- Visible uniquement si `role === "admin"`
- Liste des membres : email, rôle (badge coloré), date ajout, bouton supprimer
- Bouton "Inviter un membre" → modal : email + sélecteur rôle → génère lien → bouton copier

### Page acceptation invitation (`/invite/:token`)

- Route publique (pas besoin d'être connecté)
- Vérifie le token à l'arrivée (expired / already used → message d'erreur)
- Formulaire : prénom/nom + mot de passe → crée le compte → connecte directement → redirige vers dashboard

### Restrictions UI selon rôle

| Élément | admin | manager | readonly |
|---|---|---|---|
| Boutons Ajouter/Modifier/Supprimer | Visible | Visible | Masqué |
| Onglet Paramètres | Visible | Masqué | Masqué |
| Onglet Équipe | Visible | Masqué | Masqué |
| Lien panel superadmin | Masqué | Masqué | Masqué |

---

## Contraintes techniques

- Token d'invitation : UUID v4 généré côté backend (`secrets.token_urlsafe(32)`)
- Expiration : 7 jours après création
- Un token utilisé ne peut pas être réutilisé (`used_at` renseigné)
- Un email déjà inscrit ne peut pas accepter une invitation (retourner 409)
- Le superadmin ne peut pas être supprimé ou voir son rôle modifié via les endpoints
- Reset password superadmin : génère un mot de passe temporaire aléatoire retourné dans la réponse (à copier-coller et transmettre)

---

## Hors périmètre

- Envoi d'email automatique des invitations (prévu v1.3)
- Logs d'activité par utilisateur
- 2FA
