# ADR-0001 — Données joueurs, Storage Supabase et notifications in-app

**Statut :** Accepté  
**Date :** 2025-06-30

## Contexte

SAFFLE FF Académie CI doit gérer des effectifs jeunes (U12, U16, équipes compétition) avec plusieurs profils utilisateurs : admin, coach, trésorier, parent et joueur. Les besoins récents couvrent :

- Fiches joueurs complètes (identité, fédération, sportif)
- Dépôt de documents administratifs par les parents
- Photos de profil visibles par le staff
- Suivi des cotisations et des présences aux entraînements
- Alertes aux parents et au staff en cas d'absence, retard ou performance remarquable

L'application web est en **Next.js 16** (App Router) avec **Supabase** (Postgres, Auth, Storage, RLS). Le déploiement se fait via **Vercel** ; le dépôt GitHub alimente la CI/CD, tandis que le schéma SQL est appliqué manuellement dans le SQL Editor Supabase.

## Décision

### 1. Modèle de données joueur centralisé dans `public.players`

- Une table `players` unique porte l'effectif, avec champs métier (identité, fédération, sportif) et `photo_url` (chemin Storage, pas URL publique).
- Les groupes effectifs (U12, U16, Équipe A/B) sont matérialisés par la colonne `team`, filtrée côté UI par onglets (`?groupe=U12`).
- Les modifications staff passent par des pages dédiées ; les parents/joueurs ne modifient pas directement la table (sauf photo via RPC dédiée).

### 2. Documents et photos dans Supabase Storage (buckets privés)

| Bucket | Usage | Taille max | Accès |
|--------|-------|------------|-------|
| `player-documents` | PDF / images administratives | 10 Mo | RLS via `can_access_player()` |
| `player-photos` | Photo de profil | 5 Mo | RLS + RPC `update_player_photo()` |

- Métadonnées en base : table `player_documents` (type, statut validation, chemin fichier).
- Affichage via **URLs signées** (1 h) générées côté serveur — pas de bucket public.
- Workflow document : `pending` → `approved` / `rejected` par le staff.

### 3. Présences et performances via le module Convocations

Plutôt qu'une table `training_sessions` séparée (non implémentée à ce stade), les **entraînements** sont des `convocations` avec `event_type = 'training'`.

- Présence : enum `convocation_response` (`confirmed`, `absent`, `late`, `declined`, `pending`).
- Performance coach : colonne `performance_level` sur `convocation_entries` (`excellent`, `satisfactory`, `needs_improvement`).
- Le coach saisit présence + performance après la séance sur la fiche convocation.
- La liste joueurs affiche la **dernière séance passée** ; le détail complet est sur `/dashboard/joueurs/[id]/presences`.

### 4. Cotisations : lecture agrégée depuis `player_dues`

- Pas de duplication de statut en base sur `players`.
- La liste joueurs calcule un badge (À jour, En attente, Partiel, En retard) à partir des lignes `player_dues`.
- L'historique complet est sur `/dashboard/joueurs/[id]/cotisations` (cotisations + paiements).

### 5. Notifications in-app (pas push/SMS pour l'instant)

- Table `notifications` avec enum `notification_type` (`absence`, `late`, `performance`, `payment_overdue`, `general`).
- Création via RPC **`create_player_notifications`** (`SECURITY DEFINER`) pour notifier :
  - les guardians du joueur (`player_guardians`)
  - le staff (`admin`, `president`, `coach`)
- Déclenchement actuel : enregistrement des présences/performances par le coach (changements uniquement, pas de doublon à chaque re-save).
- UI : menu **Notifications** pour tous les utilisateurs authentifiés.

### 6. Autorisation : RLS + fonctions `SECURITY DEFINER`

- `get_my_role()` et `can_access_player()` évitent la récursion RLS sur `profiles`.
- Les écritures sensibles (photo, notifications multi-utilisateurs) passent par des RPC plutôt que des policies UPDATE larges sur `players`.

### 7. Frontend : Server Components + Server Actions

- Pages dashboard en React Server Components ; formulaires interactifs (upload fichier, présences) en Client Components ciblés.
- Upload Storage depuis le navigateur (clé anon + RLS Storage), puis enregistrement métadonnées via Server Action.

## Conséquences

### Positives

- Cohérence avec la stack existante (Supabase, pas de second backend).
- Sécurité : buckets privés, RLS par rôle, pas de `service_role` côté client.
- Réutilisation du module Convocations pour les entraînements (moins de tables, livraison plus rapide).
- Fiches historiques cliquables depuis la liste joueurs (cotisations, présences).

### Négatives / limites

- **Notifications in-app seulement** : pas d'alerte SMS, e-mail ou push mobile tant qu'un provider externe n'est pas branché.
- **Migrations SQL manuelles** : le schéma Supabase n'est pas appliqué automatiquement au push GitHub ; risque de décalage prod/local.
- **Présence = dernière séance globale** : si plusieurs entraînements le même jour ou des groupes différents, la liste ne distingue pas encore par équipe.
- **Pas de table dédiée entraînements** : exercices, objectifs, consignes (doc Coach) restent à modéliser.

### Suites possibles

- ADR-0002 : canal de notification externe (SMS parent, e-mail admin).
- Table `training_sessions` ou enrichissement `convocations` (exercices, durée).
- Application automatique des migrations Supabase (CLI / GitHub Action).
- Notification `payment_overdue` déclenchée par job ou trigger sur `player_dues.status`.
- App mobile React Native : réutiliser les mêmes buckets et RPC.

## Références

- Migrations : `supabase/migrations/20250630270000_*` à `20250630300000_*`
- Modules : `apps/web/src/app/dashboard/joueurs/`, `documents/`, `convocations/`, `notifications/`
- Règles métier : `docs/SAFFLE_Docs_02_Business/03-Regles-metier.md`
