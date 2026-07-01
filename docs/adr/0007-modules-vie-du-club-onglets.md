# ADR-0007 — Modules Vie du club en onglets

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

Les sous-pages du hub **Vie du club** (`/dashboard/club/*`) empilaient formulaires et listes sur un seul écran long :

- **Équipement** : 3 formulaires côte à côte (fiche, inventaire, prêt) + tableau en dessous
- **Discipline** : formulaire + surveillance + historique en scroll continu
- **Planning** : vue globale, formulaires de créneau/objectifs et tableau mélangés
- **Médical, Logistique, Aides, Transport, Matchs, Intéressement** : formulaire au-dessus de la liste

Incohérence avec les patterns déjà adoptés ([ADR-0004](./0004-audit-ux-dashboard.md) Paiements, [ADR-0006](./0006-convocations-onglets.md) Convocations).

## Décision

### 1. Composant partagé `club-module-tabs.tsx`

- Navigation `?tab=` avec pills (style Paiements / Convocations)
- Compteurs optionnels par onglet
- `preserveParams` pour conserver `groupe` (Planning) ou filtres futurs
- Helper `resolveClubTab(tab, allowed, defaultTab)`

### 2. Onglets par module

| Module | Onglets | Défaut |
|--------|---------|--------|
| Équipement | Suivi · Fiche joueur · Inventaire · Prêts | Suivi |
| Discipline | Surveillance · Enregistrer · Historique | Surveillance |
| Planning | Vue d'ensemble · Planifier | Vue d'ensemble |
| Médical | Suivi · Enregistrer | Suivi |
| Logistique | Tâches · Créer | Tâches |
| Aides sociales | Demandes · Créer | Demandes |
| Transport | Demandes · Créer | Demandes |
| Matchs & primes | Historique · Créer | Historique |
| Intéressement | Pools · Créer | Pools |

**Planning** : onglet Planifier conserve les `GroupTabs` U12/U16/Équipe A/B via `?groupe=`.

### 3. Refactor Équipement

`equipment-client.tsx` scindé en 3 formulaires exportés :

- `PlayerEquipmentForm`
- `InventoryForm`
- `LoanEquipmentForm`

### 4. UX transversale

- `InfoBanner` sur chaque onglet d'action
- CTA header (`primaryActionClass`) sur l'onglet liste/suivi
- `EmptyState` sur listes vides (Discipline)
- Badges surveillance cliquables vers fiche joueur

## Conséquences

### Positives

- Moins de scroll, une intention par écran (consulter vs agir)
- Cohérence avec Convocations, Paiements et l'accueil pilotage
- Compteurs visibles (prêts en cours, demandes en attente, etc.)

### Négatives / limites

- 9 pages modifiées : maintenance du mapping onglets à garder aligné
- Pas de deep-link vers un joueur pré-sélectionné dans les formulaires
- Hub Vie du club (`/dashboard/club`) inchangé (grille de tuiles)

### Suites possibles

- Inventaire : liste des articles sur l'onglet Inventaire
- Planning : édition/suppression de créneaux depuis la vue d'ensemble
- Filtre groupe sur Équipement via `GroupTabs` (param `groupe` déjà partiellement supporté)
