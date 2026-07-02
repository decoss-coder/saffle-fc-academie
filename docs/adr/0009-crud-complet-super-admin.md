# ADR-0009 — CRUD complet et super administrateur plateforme

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

L'audit CRUD (juin 2026) a montré une asymétrie systématique : **création** bien couverte, **modification** partielle, **suppression** quasi absente (archivage joueur, annulation paiements).

Zones concernées :

| Module | Manque identifié |
|--------|------------------|
| **Membres & accès** | Modifier nom/poste/rôle ; supprimer du registre |
| **Cotisations joueurs** | Modifier libellé/montant ; annuler une cotisation ouverte |
| **Cotisations comité** | Idem |
| **Budget** | Modifier/supprimer une ligne en brouillon |
| **Planning** | Modifier/supprimer un créneau d'entraînement |
| **Convocations** | Modifier titre/date/lieu ; supprimer une convocation |

Par ailleurs, le compte **Boty Dia Armel** (`+2250707189702`, administrateur plateforme) doit disposer de **tous les droits** (finance, comité, signatures budget, RLS) sans altérer les permissions des autres rôles.

## Décision

### 1. Principe « ajouter ⇒ modifier + supprimer »

Toute entité créée via formulaire staff reçoit des **Server Actions** complémentaires et une **UI inline** (boutons Modifier / Supprimer ou Annuler) sur la ligne ou la fiche concernée.

Règles métier communes :

- Pas de modification si **paiement déjà encaissé** (`amount_paid > 0`)
- Cotisations : annulation → `status = cancelled` (pas de `DELETE` sur `player_dues` / `committee_dues`)
- Budget : lignes modifiables uniquement si `budgets.status = draft`
- Membres : suppression interdite pour le super admin ; bloquée si cotisations comité encaissées
- Convocations : `DELETE` en cascade sur `convocation_entries`

### 2. Actions serveur ajoutées

| Fichier | Fonctions |
|---------|-----------|
| `admin/telephones/actions.ts` | `updateMember`, `deleteMember` |
| `paiements/actions.ts` | `updatePlayerDue`, `cancelPlayerDue` |
| `comite/actions.ts` | `updateCommitteeDue`, `cancelCommitteeDue` |
| `budget/actions.ts` | `updateBudgetLine`, `deleteBudgetLine`, `recalculateBudgetTotals` |
| `club/actions.ts` | `updateTrainingSchedule`, `deleteTrainingSchedule` |
| `convocations/actions.ts` | `updateConvocation`, `deleteConvocation` |

### 3. Composants UI

| Composant | Usage |
|-----------|--------|
| `member-row-actions.tsx` | Liste membres : modifier inline, supprimer, désactiver |
| `due-manage-actions.tsx` | Cotisations joueurs + comité |
| `budget-line-actions.tsx` | Lignes prévisionnelles (brouillon) |
| `schedule-table-row.tsx` | Créneaux planning |
| `convocation-admin-panel.tsx` | Fiche convocation |

### 4. Super administrateur plateforme

**Identification** (`lib/super-admin.ts`) :

- Téléphone `+2250707189702`
- Ou nom normalisé `boty dia armel`

**Couche application** :

- `requireUser()` : `profile.role` effectif `admin`, flag `isSuperAdmin`
- Toutes les fonctions `can*` / `require*` : bypass si `isSuperAdmin`
- `resolveSignoffCapabilities` : SG + Président + TG pour le super admin
- `isCommitteeMember` : toujours `true` pour le super admin

**Couche base** — migration `20250630350000_super_admin.sql` :

- `is_super_admin()` — `security definer`, vérifie téléphone ou nom via `profiles` + `phone_registry`
- `get_my_role()` — retourne `admin` si super admin (RLS + RPC alignés)

Les autres utilisateurs conservent leurs rôles et permissions inchangés.

### 5. ADR-0008 (Finance & Admin onglets)

Cette livraison inclut aussi la refonte onglets documentée dans [ADR-0008](./0008-finance-admin-onglets.md) (comité, membres, budget, mes cotisations), non commitée auparavant.

## Conséquences

### Positives

- Parité CRUD sur les entités les plus manipulées au quotidien
- Boty Dia Armel peut tout gérer sans contourner les rôles des autres
- RLS cohérente avec l'UI grâce à `get_my_role()` mis à jour

### Négatives / limites

- Pas encore de CRUD sur : matchs, inventaire, salaires (après création), documents
- ~~Modification du **numéro de téléphone** d'un membre non supportée~~ → supportée pour les membres non protégés ([ADR-0012](./0012-annuaire-administration-parents-comite-agents.md))
- Suppression membre : cascade sur `committee_dues` non payées — à communiquer aux admins

### Suites possibles

- CRUD matchs, lignes salaire, articles inventaire
- Filtre statut sur liste Membres (ADR-0008)
- RPC `cancel_player_due` / audit log pour annulations de cotisations
- Rôle `super_admin` explicite en enum plutôt qu'identité codée en dur
