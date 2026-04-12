# myPilot — Roadmap

## Légende
- [x] Terminé
- [ ] À faire
- 🔴 Bloquant pour la v1
- 🟡 Important mais pas bloquant
- 🟢 Post-v1 / amélioration

---

## v1.0 — Démo parents (objectif : semaine prochaine)

### Frontend
- [x] Page Login / Register avec auth réelle
- [x] Dashboard avec KPIs temps réel (CA, courses, chauffeurs, impayés)
- [x] Page Courses — liste, filtres, marquage payé en un tap
- [x] Formulaire Nouvelle Course (client, trajet, montant, type paiement, chauffeur)
- [x] Page Chauffeurs — liste, ajout/modif/suppression, statuts
- [x] Page Stats — CA mensuel, graphique hebdo, répartition, classement chauffeurs
- [x] Page Paramètres — entreprise, facturation, alertes, notifications, affichage
- [x] Guard auth (redirect login si non connecté)
- [x] React Router v7 câblé (PrivateRoute / PublicRoute)
- [x] Page Vehicles (Flotte) — liste, statuts, alertes CT/assurance, CRUD
- [x] Formulaire modification + suppression de course (EditRide)
- [x] 🟡 Page profil chauffeur détaillé (courses par chauffeur, stats individuelles)

### Backend
- [x] Auth JWT (register + login + guard)
- [x] API Drivers (CRUD complet)
- [x] API Rides (CRUD + filtres + stats)
- [x] API Settings (GET + PATCH)
- [x] Stats summary (dashboard)
- [x] Stats monthly (page stats)
- [x] API Vehicles (CRUD véhicules + alertes CT/assurance)
- [x] Endpoint export CSV courses (filtre par date, statut, chauffeur)
- [x] 🟡 Endpoint changement mot de passe

### Infra
- [x] PostgreSQL 17 local
- [x] Alembic migrations
- [x] CORS configuré
- [x] Fichier .env avec VITE_API_URL
- [x] Scripts de démarrage start.bat (prod) + start-dev.bat (dev HMR)
- [x] Variables d'environnement VITE_API_URL configurées

---

## v1.1 — Stabilisation (semaine 2)

- [x] Gestion des véhicules (liste, statuts, alertes CT/assurance)
- [ ] Génération PDF facture (via reportlab ou weasyprint)
- [x] Pagination côté frontend (courses — bouton "charger plus" par tranches de 30)
- [x] Formulaire édition course existante
- [x] Page profil chauffeur individuel
- [ ] Tests unitaires backend (pytest, ~70% coverage routes critiques)
- [x] Gestion erreurs frontend (toast notifications — composant global)
- [x] Loading states / skeletons sur toutes les pages

---

## v1.2 — Facturation (semaine 3-4)

- [ ] Génération de facture PDF conforme (mentions légales, TVA, numérotation auto)
- [ ] Envoi facture par email (SMTP ou Resend)
- [ ] Historique des factures
- [ ] Statuts de paiement factures (émise / envoyée / payée / en retard)
- [ ] Export comptable CSV / Excel (période, filtré par chauffeur ou type)
- [ ] Numérotation automatique des factures (préfixe configurable depuis Paramètres)

---

## v2.0 — Multi-profil (dans 2-3 mois)

- [ ] Sélection type d'activité à l'inscription (taxi / VTC / ambulance-VSL)
- [ ] Template facture VTC (TVA 10%, mentions spécifiques)
- [ ] Champs spécifiques ambulance (n° sécurité sociale, prescription médicale, convention CPAM)
- [ ] Tableau de bord spécifique par profil
- [ ] Rôle "chauffeur" — interface simplifiée (saisir ses courses uniquement)

---

## v3.0 — Croissance (6 mois+)

- [ ] Application mobile native (React Native ou PWA installable)
- [ ] Localisation GPS des véhicules (API Google Maps)
- [ ] Synchronisation bancaire (Linxo ou Budget Insight) pour rapprochement paiements
- [ ] Module RH simplifié (congés, fiches de paie basiques)
- [ ] API publique pour intégrations tierces
- [ ] Multi-entreprise (franchise, groupement de taxis)
- [ ] Hébergement production (VPS OVH / Hostinger + Nginx + SSL)
- [ ] Facturation SaaS — Stripe intégration (30€/mois standard, 60€/mois pro, 80€/mois multi-chauffeurs)

---

## Bugs connus / dette technique

| Priorité | Description | Impact |
|----------|-------------|--------|
| ~~🔴 Haute~~ | ~~Port backend hardcodé → VITE_API_URL~~ | ✅ Corrigé |
| ~~🔴 Haute~~ | ~~Routing manuel → React Router~~ | ✅ Corrigé |
| ~~🟡 Moyenne~~ | ~~Pas de gestion d'erreur API~~ | ✅ Toast global ajouté |
| ~~🟢 Faible~~ | ~~Pas de fallback SPA~~ | ✅ historyApiFallback activé |
| 🟡 Moyenne | Pas de pagination (rides/drivers chargent 30-50 max) | Charge OK pour MVP |
| 🟢 Faible | Pas de PWA / icône home screen | Post-v1 |

---

## Pour envoyer la v1 aux parents

**Checklist avant démo :**
1. [ ] Créer leur compte via /register
2. [ ] Ajouter leurs 3-4 chauffeurs
3. [ ] Saisir 5-10 courses de test réalistes (CPAM, espèces, différents chauffeurs)
4. [ ] Vérifier que les stats affichent bien
5. [ ] Montrer la page Paramètres (personnalisation préfixe facture, TVA, etc.)
6. [ ] Leur expliquer : tap sur le point orange pour marquer une course payée

**Contexte à préparer pour la démo :**
- Cours du mois simulées sur 4 semaines (pas juste aujourd'hui)
- Au moins 2 chauffeurs avec des statuts différents
- Quelques courses en attente pour montrer les alertes impayés
