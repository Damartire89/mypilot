# myPilot — SaaS gestion de flotte (taxi, VTC, ambulance)

> Repo GitHub : Damartire89/mypilot

Projet SaaS B2B à destination des gérants de flotte de véhicules de transport. Objectif : outil simple de gestion multi-véhicules/chauffeurs, vendable après validation avec les parents de Damien.

## Cible (décision 2026-04-10)

**Cible principale : gérants d'entreprise de transport (chefs de flotte)**
- Profil : patrons de sociétés taxi, VTC, ambulance gérant 3-20 véhicules et plusieurs chauffeurs
- Douleur : pas d'outil simple pour suivre la flotte, la facturation et les courses — outils existants trop complexes ou trop chers
- Prix accepté : 30-80€/mois par entreprise
- Ticket d'entrée : parents de Damien (gérants taxi, réseau existant pour revente)

**Ce n'est PAS :**
- Un outil pour indépendant VTC solo (marché trop concurrencé : Qonto, Indy, Finom...)
- Un logiciel de dispatch ou de mise en relation clients

**Pourquoi cette cible :**
- Moins concurrencée que l'indépendant
- Ticket moyen plus élevé
- Les parents de Damien = labo vivant + réseau de contacts dans le secteur

## Périmètre multi-profil (architecture dès v1)

À la création de compte, l'utilisateur choisit son type d'activité :
- Taxi (réglementation taximètre, tarifs préfectoraux)
- VTC (facturation libre, TVA 10%)
- Ambulance/VSL (v2 — CPAM, conventions SS, plus complexe)

Le core est identique pour tous. La différence = templates de facture + champs spécifiques.

## Fonctionnalités MVP (taxi uniquement d'abord)

### 1. Gestion de flotte
- Liste des véhicules (immatriculation, modèle, année, km)
- Statut : disponible / en course / en maintenance
- Alertes : CT, assurance, révision

### 2. Gestion chauffeurs
- Profils chauffeurs associés aux véhicules
- Suivi des heures / courses par chauffeur

### 3. Saisie de courses
- Enregistrement rapide : client, départ, arrivée, tarif, mode de paiement
- Historique filtrable

### 4. Facturation
- Génération de factures conformes (TVA, numérotation automatique)
- Export PDF
- Suivi des paiements

### 5. Dashboard
- CA du jour/semaine/mois
- Alertes véhicules
- Taux d'utilisation flotte

## Stack technique (à décider)
- **Frontend** : React ou Vue — mobile-first (les gérants consultent sur téléphone)
- **Backend** : Python FastAPI ou Node.js
- **Base de données** : PostgreSQL
- **Hébergement** : VPS (Hostinger ou OVH)
- **Auth** : simple email/password + rôles (admin gérant / chauffeur vue limitée)

## Prochaines étapes
1. ✅ Nom validé : myPilot
2. Choisir la stack définitivement
3. Wireframes des 5 écrans clés (dashboard, flotte, courses, facturation, chauffeurs)
4. Développement MVP avec parents comme bêta-testeurs

## Notes importantes
- Simplicité d'usage avant tout — les gérants taxi sont non-tech
- Mobile-first (tablette/téléphone en priorité sur desktop)
- Conformité facturation : obligations légales taxi FR (mentions obligatoires, TVA 10%)
- Ambulance en v2 seulement (réglementation CPAM trop spécifique pour le MVP)
