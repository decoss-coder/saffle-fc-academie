# ADR-0012 — Annuaire administration : Parents, Comité, Agents

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

Trois problèmes UX et métier sur l’administration des personnes :

1. **Parents mélangés aux staff** — les 52 entrées `role = parent` dans `phone_registry` apparaissaient dans « Membres & accès », alors qu’ils relèvent du parcours famille (fiches joueurs, cotisations, convocations).
2. **Comité directeur mal rangé** — le module cotisations comité était en **Finance** alors que la gestion des membres bureau est une fonction **Administration**.
3. **Modification incomplète** — l’édition inline ne couvrait pas le téléphone (clé primaire) ni un formulaire unifié nom / poste / rôle ; les membres du comité n’étaient pas cliquables.

Complète [ADR-0008](./0008-finance-admin-onglets.md) (onglets) et [ADR-0010](./0010-parcours-ux-une-intention.md) (section Parent).

## Décision

### 1. Sidebar — trois périmètres distincts

| Section | Entrée | Route | Public |
|---------|--------|-------|--------|
| **Club** | Joueurs | `/dashboard/joueurs` | Staff joueurs |
| **Club** | **Parents** | `/dashboard/parents` | Staff (`requireStaff`) |
| **Administration** | **Comité directeur** | `/dashboard/comite` | Finance (`canViewFinance`) |
| **Administration** | **Agents** | `/dashboard/admin/agents` | Admin (`canManagePhones`) |

- Ancienne route `/dashboard/admin/telephones` → redirection vers `/dashboard/admin/agents`.
- Ancienne route `/dashboard/admin/parents` → redirection vers `/dashboard/parents`.

### 2. Parents — annuaire famille (`/dashboard/parents`)

- Agrégation par téléphone via `lib/parents/directory.ts` (`player_guardians`, `phone_registry`, cotisations, convocations).
- Onglets : Tous / Compte activé / En attente.
- Fiche détail `/dashboard/parents/[key]` : enfants, paiements, convocations, documents, accès.
- Migration RLS : `20250630400000_player_guardians_staff_read.sql`.

### 3. Comité directeur — membres cliquables

- Onglet **Membres** : cartes `ClickableCard` → fiche staff `/dashboard/admin/agents/[phone]?from=comite`.
- `resolveComiteTab` extrait dans `lib/resolve-comite-tab.ts` (même pattern que [ADR-0011](./0011-resolve-club-tab-serveur.md)).

### 4. Agents — staff hors comité

- Liste filtrée : `role ≠ parent` **et** `role ∉ COMMITTEE_ROLES` (`lib/staff/registry.ts`).
- Les 11 membres bureau restent uniquement dans Comité directeur.
- Onglets : Liste / Ajouter / Import (inchangés, composant `agents-tabs.tsx`).

### 5. Fiche staff — édition complète de la ligne

Route `/dashboard/admin/agents/[phone]` avec `StaffMemberForm` :

| Champ | Modifiable |
|-------|------------|
| Nom et prénom | Oui (`full_name`) |
| Téléphone | Oui (recréation ligne + cascade FK) |
| Poste / fonction | Oui (`position_title`) |
| Droits plateforme | Oui (`role`) |

Changement de numéro (`updateMember`) :

1. Insert nouvelle ligne `phone_registry`
2. Mise à jour `committee_dues.member_phone` et `staff_salary_lines.beneficiary_phone`
3. Suppression ancienne ligne
4. Si compte activé : `profiles.phone` + email auth (`phoneToAuthEmail`)

Actions secondaires : supprimer, désactiver, renvoyer lien `/activer`.

### 6. Accueil pilotage — alertes scindées

| Alerte | Compteur | Lien |
|--------|----------|------|
| Parents non activés | `phone_registry` role = parent | `/dashboard/parents?statut=en-attente` |
| Agents non activés | staff hors comité | `/dashboard/admin/agents` |

## Conséquences

### Positives

- Une intention par liste : famille / bureau / encadrement.
- Fiche unique pour éditer toute la ligne, y compris le téléphone.
- Comité et Agents sans doublon.

### Négatives / limites

- Changement de téléphone : opération multi-tables côté app (pas de RPC Postgres dédiée).
- Compte super-admin protégé : numéro non modifiable (`isProtectedMemberPhone`).
- Fiche staff réservée aux admins (`requireAdmin`) même depuis Comité.

### Suites possibles

- RPC `relocate_phone_registry(old, new)` transactionnelle en base.
- Édition comité en lecture seule pour trésorier (sans `requireAdmin`).
- Filtre recherche sur `/dashboard/parents`.

## Références

- Remplace partiellement la section « Membres & accès » de [ADR-0008](./0008-finance-admin-onglets.md).
- Révoque la limite « numéro non modifiable » de [ADR-0009](./0009-crud-complet-super-admin.md) pour les membres non protégés.
