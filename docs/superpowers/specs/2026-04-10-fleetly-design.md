# Fleetly — Design Spec MVP

**Date :** 2026-04-10  
**Statut :** Validé par Damien

---

## 1. Contexte & objectif

SaaS B2B mobile-first pour gérants de flotte taxi/VTC (3-20 véhicules). Cible : chefs d'entreprise non-tech, pas les indépendants solo. MVP validé avec les parents de Damien (gérants taxi) comme bêta-testeurs.

**Douleur principale :** pas de vue globale sur le CA, les factures impayées, et les courses.

**Ce que le MVP résout :**
- Saisie et suivi des courses (CPAM médical + privé)
- Visibilité CA en temps réel
- Suivi statut chauffeurs (manuel pour MVP — app chauffeur = v2)
- Alertes factures impayées

---

## 2. Périmètre MVP (v1)

### Inclus
- Dashboard KPIs
- Liste et saisie de courses (CPAM / Privé / Entreprise / Aéroport)
- Gestion chauffeurs (statut manuel)
- Stats CA (semaine, mois, par chauffeur, répartition CPAM/Privé)
- Écran Factures (liste + statut payé/en attente)

### Explicitement exclu (versions futures)
- App mobile côté chauffeur avec mise à jour statut (v2)
- Télétransmission CPAM automatique (v2)
- GPS / tracking temps réel (v2)
- Ambulance/VSL (réglementation CPAM complexe) (v2)
- Export comptable (v2)

---

## 3. Architecture

### Stack
- **Frontend :** React (Vite) — mobile-first, PWA
- **Backend :** Python FastAPI
- **Base de données :** PostgreSQL
- **Auth :** JWT simple, 2 rôles : `admin` (gérant) / `driver` (v2)
- **Hébergement :** VPS Hostinger ou OVH

### Structure de données clés

```
Société (tenant)
  ├── Chauffeurs (nom, véhicule, statut)
  ├── Véhicules (immat, modèle, km, alertes CT/assurance)
  ├── Courses (patient/client, trajet, chauffeur, montant, type, statut paiement)
  └── Factures (numéro, client, montant, statut, date)
```

### Multi-tenant
Chaque société a ses propres données isolées. Un gérant crée son compte, saisit son type (Taxi / VTC), et accède à son espace.

---

## 4. Écrans (5 écrans validés)

### Écran 1 — Dashboard
- KPIs : CA du mois, courses du jour, chauffeurs actifs / total, factures impayées (montant)
- Alerte banner si factures impayées > 0
- Liste des 5 dernières courses avec statut

### Écran 2 — Liste courses
- Filtres : Aujourd'hui / Cette semaine / Ce mois / CPAM / Privé
- Chaque course : patient/client, trajet, chauffeur, montant, badge type + badge statut paiement
- Bouton flottant "+ Nouvelle course"

### Écran 3 — Saisie course
- Type : Médical CPAM / Course privée / Contrat entreprise / Aéroport
- Champs : patient, N° Sécu (si CPAM), départ, arrivée, date/heure, chauffeur (liste), montant, km
- Un bouton "Enregistrer"

### Écran 4 — Chauffeurs
- Liste avec avatar, véhicule associé, CA du mois, statut (Libre / En course / Pause)
- Statut modifiable manuellement par le gérant
- Bouton "+ Ajouter un chauffeur"

### Écran 5 — Stats
- Sélecteur période : Ce mois / 3 mois / Cette année
- 3 KPIs : CA total, nb courses, moyenne/course
- Graphe barres CA par semaine
- Répartition CPAM vs Privé
- Classement chauffeurs par CA avec barre de progression

### Navigation
- Barre fixe en bas : Dashboard / Courses / Chauffeurs / Factures / Stats

---

## 5. Design system

- Couleurs : fond blanc, accent `#4f8ef7` (bleu), texte `#1a1a2e` (quasi-noir), topbar `#1a1a2e`
- Typo : system-ui / -apple-system
- Border-radius : 12px cards, 20px badges
- Mobile-first : max-width 420px, nav bottom fixe
- Badges statut : CPAM (bleu clair), Privé (gris), Payé (vert), En attente (jaune), Impayé (rouge)

---

## 6. Décisions clés

| Décision | Choix | Raison |
|---|---|---|
| App chauffeur | v2 | Trop complexe pour MVP, statut manuel suffit au départ |
| Télétransmission CPAM | v2 | Intégration API CPAM complexe, saisie manuelle pour valider le produit |
| Multi-profil | Architecture dès v1, UI taxi seul | Évite refactoring plus tard |
| N° Sécu | Inclus dans saisie CPAM | Requis pour la facturation médicale |
| Stack frontend | React (Vite) | Ecosystème large, PWA facile |
