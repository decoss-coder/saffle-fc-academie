# ADR-0008 — Finance & Administration en onglets

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

Quatre zones Finance / Admin empilaient consultation et action sur un seul écran long :

| Page | Problème |
|------|----------|
| **Comité directeur** | Onglet « Suivi » mélangeait Wave, grille des 11 membres et cotisations |
| **Membres & accès** | Import en masse + formulaire staff + tableau 52 membres |
| **Budget** | Formulaire de création au-dessus de la liste des budgets |
| **Mes cotisations comité** | Cotisations en cours et historique en scroll continu |

Incohérence avec les onglets déjà adoptés (Paiements, Convocations, Vie du club — ADR-0006/0007).

## Décision

### 1. Comité directeur — 3 onglets (+ rétrocompat)

| Onglet | URL | Contenu |
|--------|-----|---------|
| **Cotisations** | `/dashboard/comite` | Wave en attente + liste + recherche |
| **Membres** | `?tab=membres` | Grille des membres du comité |
| **Créer** | `?tab=creer` | Bulk + cotisation individuelle |

- `comite-tabs.tsx` : compteurs cotisations / membres / Wave pending
- `?tab=suivi` (ancien) → traité comme Cotisations via `resolveComiteTab()`
- CTA header « Nouvelle cotisation » sur l'onglet Cotisations

### 2. Membres & accès — 3 onglets

| Onglet | Contenu |
|--------|---------|
| **Liste** | Tableau téléphones / statuts / actions |
| **Ajouter** | `StaffPhoneForm` + `InfoBanner` |
| **Import** | `ImportMembersButton` + badge non activés |

Composant `membres-tabs.tsx`.

### 3. Budget — 2 onglets

| Onglet | Contenu |
|--------|---------|
| **Budgets** | Liste `ClickableCard` |
| **Créer** | `CreateBudgetForm` (trésorier uniquement) |

Composant `budget-tabs.tsx`.

### 4. Mes cotisations comité — 2 onglets

| Onglet | Contenu |
|--------|---------|
| **En cours** | Cotisations pending/partial + paiement Wave |
| **Historique** | Tableau `committee_due_payments` |

Composant `mes-cotisations-tabs.tsx`.

### 5. Patterns transverses

- `Suspense` autour des barres d'onglets (navigation client)
- `primaryActionClass` sur l'onglet liste par défaut
- `EmptyState` avec CTA vers l'onglet Créer/Ajouter/Import
- Réutilisation de `resolveClubTab` / `ClubModuleTabs` là où pertinent

## Conséquences

### Positives

- Parcours consultation vs action séparés sur Finance et Admin
- Comité : membres et cotisations ne se mélangent plus
- Membres : liste plein écran sans scroll vers formulaires

### Négatives / limites

- Comité : 3 requêtes chargées quel que soit l'onglet actif
- Pas de filtre statut sur la liste Membres (activé / en attente) — piste future
- Budget : lecteurs `board` voient l'onglet Créer masqué mais pas de message explicite

### Suites possibles

- Filtre « En attente d'activation » sur Liste Membres
- Onglet Historique dédié pour Salaires (même pattern)
- Deep-link `?tab=cotisations&q=` partageable entre staff
