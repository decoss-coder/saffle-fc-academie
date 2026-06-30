# ADR-0002 — Modules « Vie du club »

**Statut :** Accepté  
**Date :** 2025-06-30

## Contexte

Lors de la réunion joueurs/coachs, plusieurs besoins opérationnels ont été identifiés au-delà de la gestion des effectifs et des paiements :

- Planning d'entraînement par catégorie et objectifs d'heures
- Suivi équipement (dotation joueur, inventaire club, prêts)
- Discipline (absences répétées, encouragements)
- Suivi médical (assurance, certificat, médecin du club)
- Matchs officiels et primes de victoire (2 500 / 5 000 FCFA)
- Intéressement (cagnottes réparties par groupe)
- Aides sociales (logement, nourriture)
- Logistique (terrain, gym, tondeuse…)
- Transport pour déplacements

Ces modules doivent rester cohérents avec l'architecture existante (Next.js App Router, Supabase, RLS par rôle) et réutiliser les groupes effectifs U12 / U16 / Équipe A / Équipe B.

## Décision

### 1. Hub `/dashboard/club` et navigation « Vie du club »

- Point d'entrée unique listant les 9 sous-modules.
- Lien visible pour le staff (`coach`, `admin`, `president`) et le trésorier (`treasurer`) — modules financiers réservés au trésorier.

### 2. Schéma Postgres dédié (migration `20250630310000_club_modules.sql`)

| Table | Rôle |
|-------|------|
| `training_schedules` | Créneaux hebdomadaires par `team` |
| `team_training_targets` | Heures minimales mensuelles par groupe |
| `player_equipment` | Dotation individuelle (maillot, chaussures…) |
| `equipment_inventory` | Stock club |
| `equipment_loans` | Prêts matériel |
| `player_discipline_records` | Incidents / encouragements |
| `club_matches` | Matchs et montant de prime |
| `match_player_bonuses` | Prime par joueur si victoire |
| `profit_sharing_pools` | Cagnottes d'intéressement |
| `welfare_requests` | Demandes d'aide sociale |
| `logistics_tasks` | Tâches opérationnelles |
| `transport_requests` | Demandes de transport |

Colonnes ajoutées sur `players` : `discipline_status`, `insurance_provider`, `insurance_number`, `medical_cert_expires_at`, `team_doctor_contact`.

RLS : lecture/écriture staff via `is_club_staff()` ; trésorier pour matchs et intéressement ; parents/joueurs peuvent soumettre des demandes d'aide et de transport liées à leurs joueurs.

### 3. Discipline automatique liée aux convocations

- Seuil : **3 absences ou déclins sur 30 jours** → création automatique d'un enregistrement `warning` dans `player_discipline_records` et mise à jour de `discipline_status`.
- Déclenché depuis `updateConvocationAttendance` via `checkAbsenceThreshold()` après notification d'absence.
- Évite les doublons : un seul warning par joueur sur la fenêtre glissante de 30 jours.

### 4. UI : Server Components + formulaires client

- Pages serveur pour chargement des données Supabase.
- Composants client (`*-client.tsx`) avec `useActionState` et actions dans `apps/web/src/app/dashboard/club/actions.ts`.
- Composants partagés : `club-ui.tsx` (cartes, messages, styles vert/blanc).

### 5. Droits par module

| Module | Rôles |
|--------|-------|
| Planning, équipement, discipline, médical, logistique, transport | Staff |
| Matchs, intéressement | Trésorier (+ admin/président) |
| Aides sociales — soumission | Staff |
| Aides sociales — validation | Admin, président |

## Conséquences

### Positives

- Couverture des besoins opérationnels du club dans une zone cohérente du dashboard.
- Réutilisation des groupes `PLAYER_GROUPS` et du système de notifications existant.
- Discipline semi-automatisée sans saisie manuelle du seuil d'absences.

### Négatives / limites

- Migration SQL à appliquer manuellement dans Supabase (comme les migrations précédentes).
- Pas encore d'intégration détaillée équipement/médical/discipline sur la fiche joueur individuelle (consultation via modules dédiés).
- Primes et intéressement enregistrés en base mais non liés au module Wave/paiements existant.

### Suites possibles

- Widgets récap sur la fiche joueur (`/dashboard/joueurs/[id]`).
- Export PDF planning ou certificats médicaux expirants.
- Lien primes → échéances de paiement ou historique trésorier.
