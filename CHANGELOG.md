# CHANGELOG — myPilot

Format : `[YYYY-MM-DD] scope — description`
Scopes : `infra` | `feature` | `design` | `doc` | `fix`

---

## 2026-04-20 — v1.9.0 (JWT HttpOnly cookies + CSRF)

### Sécurité (anti-XSS)
- `[feature]` JWT migré de `localStorage` → cookie `mypilot_access` HttpOnly, SameSite=Lax, Secure en prod
- `[feature]` CSRF double-submit : cookie `mypilot_csrf` (lisible JS) + header `X-CSRF-Token` vérifié sur POST/PATCH/PUT/DELETE
- `[feature]` Endpoint `POST /auth/logout` — clear des cookies côté serveur
- `[feature]` `get_current_user` lit cookie en priorité, fallback header `Authorization: Bearer` (compat progressive)
- `[feature]` Paths exemptés CSRF : `/auth/login`, `/auth/register`, `/auth/logout`, `/invitations/{token}/accept`

### Frontend
- `[feature]` `axios` passe `withCredentials: true`, injecte automatiquement `X-CSRF-Token` depuis le cookie
- `[feature]` `AuthContext` hydraté via `/auth/me` au boot — plus aucun token/user en localStorage
- `[feature]` `BootGate` sur routes privées/publiques : attend la réponse `/me` avant de décider du routing
- `[fix]` `downloadRidePDF` / `exportRidesCSV` : `fetch` passe `credentials: "include"` (plus de Bearer manuel)

### Tests
- `[feature]` `test_auth_cookies.py` (8 tests : HttpOnly/SameSite, clear, fallback header, CSRF exempt)
- **139 tests pytest verts** (131 → 139)

---

## 2026-04-18 — v1.8.7 (audit export CSV)

### Audit
- `[feature]` `rides.export_rides_csv` : log `export_csv` avec count, filtres (date_from/to, status, driver_id) — trace exports massifs RGPD

---

## 2026-04-18 — v1.8.6 (rate limits endpoints sensibles + tests présence)

### Sécurité
- `[feature]` `invitations.check_invitation` : rate limit 20/min (anti-enumération tokens)
- `[feature]` `invitations.accept_invitation` : rate limit 5/min (anti brute-force)
- `[feature]` `admin.reset_user_password` : rate limit 10/min (anti-abus admin compromis)
- `[feature]` `auth.change_password` : rate limit 5/min (anti brute-force mot de passe actuel)

### Tests
- `[feature]` `test_rate_limits.py` (8 tests : présence decorateurs, module limiter, formats slowapi)
- **131 tests pytest verts** (123 → 131)

---

## 2026-04-18 — v1.8.5 (audit settings + staleTime admin + 13 tests)

### Audit
- `[feature]` `settings.update_settings` : log action `update_settings` si champ sensible modifié (iban/billing_email/invoice_prefix/siret/company_name/tva_rate)
- `[feature]` IBAN masqué dans audit : seuls les 4 derniers chars loggés (conformité RGPD)
- `[feature]` Diff before/after par champ dans details JSON

### UX / Perf
- `[feature]` SuperAdmin.jsx : `staleTime` 30s (companies) / 60s (stats) / 15s (audit logs) → moins de refetch inutile
- `[feature]` SuperAdmin.jsx : `keepPreviousData` sur audit-logs pour éviter flash blanc au changement de filtre

### Tests
- `[feature]` `test_settings_audit_diff.py` (7 tests : diff, masquage IBAN, multi-change, fields non audités)
- `[feature]` `test_members_role_delete.py` (6 tests : role whitelist, self-modify/delete blocked, isolation company, MemberOut sans password)
- **123 tests pytest verts** (110 → 123)

---

## 2026-04-18 — v1.8.4 (perf list_all_companies N+1)

- `[feature]` `/admin/companies` : une seule requête GROUP BY pour tous les counts membres (au lieu de N queries)

---

## 2026-04-18 — v1.8.3 (audit invoice_issued + robustesse UI + tests invite)

### Audit
- `[feature]` `rides.create_ride` : log `invoice_issued` (reference, amount) quand facture émise automatiquement — trace conformité URSSAF
- `[fix]` SuperAdmin.jsx : `auditLogs?.items?.length ?? 0` (guard optional chain, évite crash si items undefined)

### Tests
- `[feature]` `test_members_invite.py` (5 tests : rôle valide, expires 7j, token URL-safe, schema InviteCreate OK/KO)
- **110 tests pytest verts** (105 → 110)

---

## 2026-04-18 — v1.8.2 (UI audit logs + stats + indexes)

### Superadmin
- `[feature]` SuperAdmin.jsx : panneau **KPIs globaux** (entreprises actives/supprimées, users, drivers, vehicles, rides, audit_logs) — lit `/admin/stats/global`
- `[feature]` SuperAdmin.jsx : panneau **Audit logs** (50 derniers, filtre entreprise + action) — lit `/admin/audit-logs`
- `[feature]` api/admin.js : `getGlobalStats()`, `getAuditLogs({ companyId, action, limit, offset })`

### Performance
- `[feature]` Index `idx_audit_logs_action` sur `audit_logs.action` (migration `b8c9d0e1f2a3`) — accélère filtre action côté superadmin

### Tests
- `[feature]` `test_admin_stats_endpoint.py` (4 tests : route, signature, shape réponse, audit shape)
- **105 tests pytest verts** (101 → 105)

### Notes
- Build frontend 502 kB (gzip 134 kB), +5 kB vs v1.8.1

---

## 2026-04-18 — v1.8 (Audit Opus 4.7 — Sprint 1 suite & fin)

### Sécurité & audit
- `[feature]` Table `audit_logs` + migration `c3d4e5f6a7b8` : log actions critiques (user, action, entity, IP, details JSON)
- `[feature]` Helper `app/audit.py::log_action()` — extraction IP via x-forwarded-for, sérialisation JSON
- `[feature]` Logs sur : soft_delete company, reset_password, change_role (admin), delete driver/vehicle, invite/role/delete membre
- `[fix]` Soft-delete Company (admin.py) : `deleted_at` au lieu de CASCADE DELETE (évite data loss)
- `[feature]` Validation IBAN (checksum mod 97 ISO 13616) dans settings.py — rejette IBAN malformé en 400
- `[feature]` Security headers middleware (main.py) : X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS en prod
- `[feature]` Invitation : re-validation rôle à l'acceptation + blocage si entreprise soft-deleted (410)

### Conformité facture (URSSAF)
- `[feature]` Ride : champs `client_address`, `client_siret` (migration `d5e6f7a8b9c0`) — SIRET normalisé 14 chiffres
- `[feature]` Ride : champ `issued_at` (migration `f6a7b8c9d0e1`) — figé à la création de la facture
- `[feature]` Settings.update : **freeze numéro facture** — refuse modif `invoice_prefix`/`invoice_next_number` en 409 si au moins 1 facture émise
- `[feature]` PDF facture : bloc Facturé à étendu avec adresse multiligne + SIRET client
- `[feature]` Frontend Settings : bannière jaune "Numérotation figée" + inputs désactivés quand freeze actif

### Bugs & edge cases
- `[fix]` rides.py : driver supprimé dans PDF — détache proprement si orphelin au lieu d'afficher silencieusement "Non assigné"
- `[fix]` gasoil.py : cache thread-safe (`threading.Lock`, fonction `_cache_is_fresh` extraite)
- `[fix]` Factorisation `_alert_for_date` dupliqué drivers/vehicles → `app/utils/alerts.py`
- `[fix]` Helper `format_invoice_reference` extrait → `app/utils/invoice.py` (PREFIX-YEAR-NNNN padded 4)

### UX & monitoring
- `[feature]` Search box Drivers (name/phone/license) + Vehicles (plate/brand/model) — visible à partir de 6 items
- `[feature]` NewRide + EditRide : inputs client_address (textarea) + client_siret + hydratation
- `[feature]` CompanySettings : option `show_gasoil_widget` (toggle Settings) + migration `e5f6a7b8c9d0`
- `[feature]` Login : ping `/health` dès ouverture de la page (anti cold-start Render)
- `[feature]` Endpoint `/health/db` (SELECT 1) pour monitoring

### Tests
- `[feature]` **97 tests pytest** (0% → couverture solide) : alerts, audit, audit_log_model, config, driver/vehicle/ride schemas, IBAN (+endpoint), invitation, invoice helpers, invoice_freeze, PDF, gasoil cache

### Notes
- **6 migrations appliquées sur BDD locale** (a1b2c3d4e5f6 → f6a7b8c9d0e1)
- Sprint 1 quasi-complet. Restent (Sprint 2+) : JWT HttpOnly cookies, CSRF, backups DB auto, mot de passe oublié, envoi email facture Resend, export FEC
- Build frontend 497 kB (gzip 133 kB)

---

## 2026-04-17 — v1.7 (Audit Opus 4.7 — Sprint 1 Fiabilité)

### Fix critiques
- `[fix]` rides.py `create_ride` : race condition sur `invoice_next_number` résolue (SELECT FOR UPDATE via `with_for_update()`) — élimine les doublons de référence facture
- `[fix]` rides.py `update_ride` : verrou comptable — une course `status=paid` ne peut plus être modifiée sauf par admin/superadmin, qui doit d'abord la repasser en `pending` pour toucher amount/reference/client_name/payment_type
- `[fix]` auth.py `login` : rate limit durci de `20/min;100/h` à `5/min;30/h` — brute-force inexploitable
- `[fix]` config.py : validation stricte `SECRET_KEY` en production (32+ chars, pas de "dev"/"change") + validation `ALLOWED_ORIGINS` (rejette localhost en prod, refuse vide)
- `[fix]` schemas/ride.py : enums stricts (`PAYMENT_TYPES`, `RIDE_STATUSES`) + validation montant (≥0, ≤99 999 €) — plus de valeurs fantaisistes en DB
- `[fix]` rides.py `list_rides` : filtres `status` et `payment_type` validés contre les enums (400 sinon)
- `[fix]` NewRide.jsx : validation côté client des champs requis (client, départ, arrivée) + bornes montant (0-99 999 €)

### Conformité facture (mentions légales FR)
- `[feature]` pdf.py : libellé "Facture n° X" explicite (mention obligatoire)
- `[feature]` pdf.py : date limite de paiement (émission + 30 jours)
- `[feature]` pdf.py : bloc "Facturé à" (identité destinataire + n° bon de transport si CPAM/mutuelle)
- `[feature]` pdf.py : mention "TVA non applicable, art. 293 B du CGI" si `tva_rate=0`
- `[feature]` pdf.py : footer mention retard de paiement (indemnité 40 €, art. L441-10 C. com.)

### Notes
- Aucune migration DB requise pour cette salve — changements code-only
- SPRINT 1 restants : JWT cookies HttpOnly (risque prod, reporté), CSRF protection, backups auto
- Backend à redéployer sur Render après merge (changement config)

---

## 2026-04-16 — v1.5 (Audit + corrections + index DB)

### Fix
- `[fix]` drivers.py + vehicles.py : `ALERT_DAYS` hardcodé → lit désormais `alert_days_before` depuis `CompanySettings` (fallback 30j)
- `[fix]` rides.py `stats_monthly` : `by_driver` groupé par `Driver.id` (était `Driver.name` → fusion si 2 chauffeurs avec le même prénom)
- `[fix]` rides.py `stats_monthly` : `rides_count` filtre maintenant uniquement `status = "paid"` (cohérent avec `ca_total`)
- `[fix]` admin.py `delete_company` : supprime désormais `CompanySettings` et `Invitation` (données orphelines évitées)
- `[fix]` DriverProfile.jsx : heatmap "jours travaillés" utilise `Europe/Paris` pour déterminer le jour (évite glissement J+1 pour les courses après 23h)

### Infra
- `[infra]` Migration Alembic b2c3d4e5f6a7 — 4 index sur la table `rides` (`company_id`, `company_id+ride_at`, `driver_id`, `status`)

---

## 2026-04-16 — v1.4 (Paramètres étendus)

### Features
- `[feature]` Paramètres entreprise : zone d'activité, n° licence/agrément, email facturation, IBAN
- `[feature]` Section Tarification : tarif/km par défaut, coefficient nuit, coefficient week-end, alerte montant élevé
- `[feature]` NewRide + EditRide : tarif/km pré-rempli depuis les paramètres
- `[feature]` NewRide + EditRide : confirmation si montant dépasse le seuil d'alerte configuré
- `[infra]` Migration Alembic a1b2c3d4e5f6 — 8 nouvelles colonnes sur company_settings

### Fix
- `[fix]` rides.py : import timedelta manquant (crash garanti sur /stats/summary)
- `[fix]` Dashboard : widget gasoil affiche l'heure réelle de la dernière mise à jour

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
