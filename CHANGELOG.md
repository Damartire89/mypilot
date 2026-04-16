# CHANGELOG — myPilot

Format : `[YYYY-MM-DD] scope — description`
Scopes : `infra` | `feature` | `design` | `doc` | `fix`

---

## 2026-04-16 — v1.3 (Déploiement démo live)

### Infra
- `[infra]` Déploiement backend FastAPI sur Render Web Service
- `[infra]` Base de données PostgreSQL sur Render (réseau interne)
- `[infra]` Frontend Vercel configuré avec VITE_API_URL → Render
- `[infra]` Migrations Alembic appliquées sur la DB cloud
- `[infra]` Seed démo exécuté — comptes demo@taximartin.fr et admin@mypilot.app opérationnels

### Doc
- `[doc]` DEPLOY.md — procédure complète mise à jour (Render + Vercel)
- `[doc]` .env.example frontend et backend mis à jour avec les vraies valeurs de prod

### Fix
- `[fix]` Suppression de railpack.toml (Railway abandonné, Render utilisé)
- `[fix]` Start command Render intègre migrations + seed au premier démarrage

---

## 2026-04-15 — v1.3 (Corrections UX + dark mode)

### Corrections UX
- `[fix]` Login — validation password min 8 chars côté client + hint UI en mode register
- `[fix]` Onboarding — "Passer la configuration" visible dès l'étape 1
- `[fix]` Settings — suppression compte → modal avec mailto prérempli
- `[design]` index.css — dark mode complet via @media (prefers-color-scheme: dark)
- `[feature]` Dashboard — chaque course récente cliquable → /rides/:id/edit
- `[feature]` Rides — champ de recherche textuelle (client, départ, arrivée) avec reset ×
- `[fix]` Settings — bouton "Sauvegarder" sticky en bas mobile / inline desktop
- `[fix]` NewRide — confirmation native si montant = 0€

---

## 2026-04-14 — v1.0.0-demo (Redesign complet + Onboarding)

### Design system
- `[design]` Refonte complète du design system — CSS variables (--brand, --text, --surface, --border…), Inter Google Fonts, Linear/Stripe aesthetic
- `[design]` Layout desktop — sidebar blanche 240px avec navigation, TopBar mobile redesignée sur CSS vars
- `[design]` BottomNav — indicateur actif, CSS vars, icônes cohérentes
- `[design]` Toast — thème clair (success/error/warning) avec bordures colorées
- `[design]` Skeleton — shimmer animation sur CSS vars

### Pages redesignées (design system CSS vars)
- `[design]` Login — panneau gauche desktop (valeur proposition + 4 features), formulaire épuré
- `[design]` Dashboard — KPI cards avec icônes colorées en rounded square
- `[design]` Rides — filtres pills, FAB mobile
- `[design]` Drivers — compteurs colorés, modal bottom sheet avec drag handle
- `[design]` Vehicles — même pattern que Drivers
- `[design]` Stats — carte CA brand-colored, barres semaine, progress bars répartition
- `[design]` Settings — sections inline-styles, modales mot de passe + invitation membres
- `[design]` NewRide / EditRide — sections Client/Facturation/Chauffeur, pills paiement
- `[design]` DriverProfile — carte identité, navigation mois, répartition paiements
- `[design]` SuperAdmin — grille entreprises/membres, badges rôles colorés
- `[design]` InviteAccept — redesign complet sur CSS vars
- `[design]` Logo.jsx — couleurs migrées sur CSS vars (var(--brand), var(--text))
- `[design]` TopBar.jsx — redesign sur CSS vars, utilise useAuth pour les initiales

### Nouvelles fonctionnalités
- `[feature]` Composant EmptyState — illustration SVG + titre + sous-titre + CTA sur toutes les pages vides (Dashboard, Courses, Équipe, Flotte, Stats)
- `[feature]` Onboarding wizard — 3 étapes au premier login (type activité → véhicule → chauffeur), tout skippable
- `[feature]` Route /onboarding — déclenchée automatiquement après register, flag localStorage

### Corrections
- `[fix]` Dashboard — doublon className/style sur le div racine
- `[fix]` TopBar — utilisait company prop statique au lieu de useAuth()

---

## 2026-04-10

### Session 1 (après-midi)
- `[doc]` Création du projet — CLAUDE.md avec contexte, MVP features, stack envisagée
- `[design]` Brainstorming + spec design : cible (gestionnaires flotte taxi/VTC), architecture multi-profil, fonctionnalités MVP
- `[doc]` Plan d'implémentation complet — docs/superpowers/plans/2026-04-10-mypilot-mvp.md
- `[infra]` Init projet React 18 + Vite 8 + Tailwind CSS v4.2 + React Query v5 + Axios
- `[design]` Logo myPilot — "my" (noir) + "pil" (bleu) + volant SVG (remplace le "o") + "t" (bleu)
- `[feature]` Page Login — toggle login/register, validation, design mobile-first
- `[feature]` Page Dashboard — KPI cards (CA, courses, chauffeurs, impayés), alerte impayés, courses récentes
- `[feature]` Page Courses (Rides) — liste groupée par date, filtres rapides, badges CPAM/Privé/Mutuelle
- `[feature]` Page Chauffeurs (Drivers) — statuts, résumé flotte, CA mensuel par chauffeur
- `[feature]` Page Stats — CA mensuel, barres hebdo, répartition par type, classement chauffeurs
- `[design]` Dashboard v2 — KPI cards en bleu solide (#3fa9f5) avec texte blanc

### Session 2 (soirée — nuit)
- `[infra]` Backend FastAPI — structure app/, models SQLAlchemy, schemas Pydantic, auth JWT + bcrypt
- `[infra]` PostgreSQL 17 — base `mypilot` créée, migrations Alembic (6 tables : companies, users, drivers, vehicles, rides, alembic_version)
- `[feature]` API Auth — POST /register + /login avec JWT, isolation par company_id
- `[feature]` API Drivers — CRUD complet (GET, POST, PATCH, DELETE), filtré par entreprise
- `[feature]` API Rides — CRUD + filtres (status, payment_type, driver_id, date), pagination
- `[feature]` API Rides/stats/summary — CA mois, courses aujourd'hui, impayés
- `[feature]` API Rides/stats/monthly — CA détaillé, par semaine, par type, par chauffeur, navigation mois
- `[feature]` API Settings — GET + PATCH paramètres entreprise (facturation, alertes, affichage, notifications)
- `[fix]` bcrypt/passlib incompatibilité — remplacé passlib par bcrypt direct
- `[feature]` Frontend — couche API (client axios + interceptors JWT + redirect 401)
- `[feature]` Frontend — AuthContext (JWT localStorage, signIn/signOut)
- `[feature]` Frontend — Guard auth dans App.jsx (redirect login si non authentifié)
- `[feature]` Login — connexion réelle au backend, redirect dashboard après auth
- `[feature]` Dashboard — données réelles depuis API (stats, rides récentes, chauffeurs actifs)
- `[feature]` Rides — données réelles, filtres actifs, marquage payé en un tap sur le point
- `[feature]` Drivers — données réelles, modal ajout/modification/suppression
- `[feature]` Stats — données réelles, navigation par mois, graphiques dynamiques
- `[feature]` NewRide — formulaire complet (client, trajet, montant, type paiement, statut, chauffeur)
- `[feature]` Settings — page paramètres complète (entreprise, facturation, alertes, notifications, affichage) avec sauvegarde réelle en DB
- `[design]` BottomNav — ajout onglet "Réglages" (icône engrenage), 5 onglets total
- `[infra]` Table company_settings — migration Alembic, defaults sensibles

### Session 3 (matin 2026-04-10)
- `[feature]` API Vehicles — CRUD complet (GET, POST, PATCH, DELETE), alertes CT/assurance auto (calcul jours restants)
- `[feature]` Endpoint GET /rides/export/csv — export filtrés (date, statut, chauffeur), UTF-8 BOM compatible Excel
- `[feature]` Page Véhicules (Flotte) — liste, statuts (disponible/en course/maintenance), badges alertes, CRUD modal
- `[feature]` Dashboard — alertes véhicules (CT/assurance) dans la bannière, KPI "Flotte disponible"
- `[feature]` BottomNav — ajout onglet "Flotte" (icône voiture), 6 onglets total (Accueil, Courses, Flotte, Équipe, Stats, Réglages)
- `[feature]` Export CSV dans Rides — bouton "CSV" à côté du compteur, exporte les filtres actifs
- `[feature]` Export CSV dans Stats — bouton téléchargement dans navigation mensuelle
- `[feature]` Export CSV dans Settings — bouton "Exporter toutes les courses"
- `[fix]` Settings.jsx — variable `address` manquante définie, correction bug silencieux
- `[feature]` NewRide — ajout type paiement "Chèque" dans les options
- `[feature]` Seed démo — ajout de 4 véhicules avec alertes CT/assurance réalistes (1 expiré, 1 proche)
- `[doc]` ROADMAP mise à jour — véhicules et export CSV marqués comme terminés
- `[feature]` Page EditRide — formulaire complet de modification + suppression de course
- `[feature]` API GET /rides/{id} + DELETE /rides/{id} — endpoints manquants
- `[feature]` RideUpdate étendu — permet de modifier tous les champs (client, trajet, montant, etc.)
- `[feature]` Rides — courses cliquables pour accéder à l'édition

## 2026-04-12 — Session 5 (nouvelles features + audit + déploiement)

### Nouvelles fonctionnalités
- `[feature]` Page DriverProfile — profil individuel chauffeur (stats CA/mois, comparaison mois précédent, répartition paiements, liste courses)
- `[feature]` Endpoint GET /drivers/{id}/stats — stats mensuelles + globales par chauffeur
- `[feature]` Drivers — chauffeurs cliquables → profil individuel (stopPropagation sur boutons edit/delete)
- `[feature]` Composant Skeleton.jsx — 5 variantes réutilisables (KpiCards, List, RideList, StatCard, Card)
- `[feature]` Loading skeletons sur toutes les pages (Dashboard, Rides, Drivers, Vehicles, Stats, DriverProfile, EditRide)
- `[feature]` Pagination Rides — "Charger 30 de plus", remise à zéro au changement de filtre
- `[feature]` Changement de mot de passe — endpoint POST /auth/change-password + modal Settings
- `[infra]` Déploiement Railway — railway.toml + nixpacks.toml backend/frontend, Procfile, .gitignore, DEPLOY.md
- `[infra]` CORS backend dynamique — ALLOWED_ORIGINS depuis variable d'env (compatible Railway)

### Corrections bugs (audit session 5)
- `[fix]` Rides — badge "Chèque" jamais affiché (clé "chèque" accent vs "cheque" en DB)
- `[fix]` Rides — badge Chèque sans couleur (manquait dans PAYMENT_COLORS)
- `[fix]` NewRide / EditRide — chauffeur sélectionné non mis en surbrillance (string vs number driver_id)
- `[fix]` exportRidesCSV — pas d'erreur levée si réponse HTTP 4xx/5xx
- `[fix]` Vehicles — labels "Expiry CT/Assurance" en anglais → "Contrôle technique / Expiration assurance"
- `[fix]` Vehicles — dates CT/assurance affichaient J-1 (décalage UTC) → parsing direct de la chaîne ISO
- `[fix]` Rides — groupByDate coupait au mauvais jour (UTC vs timezone locale)
- `[fix]` Rides — heure de course affichée en timezone Europe/Paris
- `[fix]` DriverProfile — crash si ID invalide dans l'URL (isError + page d'erreur)
- `[fix]` Settings — pas de toast d'erreur si sauvegarde échoue
- `[fix]` Backend — limite max rides portée de 200 à 500 (pagination frontend tronquée silencieusement)
- `[fix]` Stats — import client inline supprimé, utilise api/stats.js
- `[fix]` Dashboard — import SkeletonCard inutilisé supprimé

---

## 2026-04-11 — Session 4 (audit + corrections)

### Corrections bugs
- `[fix]` rides.py — routes statiques (/export/csv, /stats/summary, /stats/monthly) déplacées AVANT /{ride_id} pour éviter le shadowing FastAPI
- `[fix]` rides.js — exportRidesCSV : ajout du lien au DOM avant click() (compatibilité navigateurs)
- `[fix]` seed_demo.py — calculs de dates via timedelta (plus de risque de jour invalide)
- `[fix]` Dashboard — import getDrivers inutilisé supprimé
- `[fix]` Settings — address non envoyée dans handleSave, corrigé + champ address ajouté au modèle Company
- `[fix]` Stats — barres semaine affichent montant en € si < 1000 (plus de "0k")

### Nouvelles fonctionnalités
- `[feature]` Composant Toast global — notifications succès/erreur sur toutes les mutations (rides, drivers, vehicles, new/edit)
- `[feature]` Dashboard — bouton "Nouvelle course" rapide en haut à droite
- `[feature]` NewRide et EditRide — BottomNav ajoutée pour navigation cohérente
- `[feature]` Invalidation du cache stats après création/modification/suppression de course

### Infra
- `[infra]` start.bat + start-dev.bat — exécution auto de `alembic upgrade head` au démarrage
- `[infra]` Migration c3d1a7e8f921 — colonne address sur la table companies
- `[infra]` vite.config.js — historyApiFallback activé (fix refresh 404 sur les routes SPA)
- `[infra]` rides.py — importation datetime au niveau du module (suppression des imports locaux)
