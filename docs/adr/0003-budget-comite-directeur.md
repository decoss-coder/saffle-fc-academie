# ADR-0003 — Budget prévisionnel et cotisations comité directeur

**Statut :** Accepté  
**Date :** 2025-06-30

## Contexte

Le bureau souhaite un **budget prévisionnel** voté et arrêté **avant le début de saison (avant septembre)**, exécuté par le trésorier, avec :

- Validation du budget total par **SG + Président + TG** (trésorier)
- Recettes et dépenses saisies **manuellement** (pas d'alimentation automatique depuis Wave)
- Recettes distinctes : cotisations élèves, cotisations comité directeur, subventions, etc.
- Dépenses hors budget soumises à **SG + Président**
- Page **Comité directeur** pour les cotisations des membres, gérées par le trésorier

## Décision

### 1. Tables budget (`20250630320000_budget_committee.sql`)

- `budgets` — budget par saison, statuts : `draft` → `submitted` → `approved` → `active` → `closed`
- `budget_lines` — lignes recettes/dépenses prévisionnelles
- `budget_signoffs` — triple signature (SG, président, trésorier)
- `budget_receipts` — recettes réelles (saisie manuelle)
- `budget_expenses` — dépenses réelles, flag `is_over_budget`
- `budget_expense_signoffs` — approbation hors budget (SG + président)

### 2. Comité directeur

- Membres issus de `phone_registry` (rôles : président, bureau, trésorier, coach, communication, logistique, admin)
- `committee_dues` + `committee_due_payments` — cotisations et encaissements
- Option « lier au budget actif » : crée une `budget_receipt` type `cotisation_comite` (toujours manuelle, pas de sync auto Wave)

### 3. Identification SG

Fonction SQL `is_secretary_general()` : rôle `board` avec `position_title` contenant « secr » (ex. Secrétaire Loboué Brice), ou `admin`.

### 4. Workflow

| Action | Acteur |
|--------|--------|
| Créer brouillon + lignes | Trésorier |
| Soumettre | Trésorier |
| Signer budget | SG, Président, TG (chacun son rôle) |
| Activer | Trésorier (après 3 signatures) |
| Saisir recettes/dépenses | Trésorier |
| Approuver hors budget | SG + Président |

### 5. UI

- `/dashboard/budget` — liste et création
- `/dashboard/budget/[id]` — détail, signatures, exécution
- `/dashboard/comite` — cotisations comité directeur (trésorier)

## Conséquences

### Positives

- Respect du principe de vote avant saison
- Séparation claire recettes élèves (Wave) vs recettes budget (saisie manuelle)
- Traçabilité des approbations hors budget

### Négatives / limites

- Pas de lien automatique cotisations élèves Wave → budget (volontaire)
- SG identifié via `position_title` — nécessite registre téléphone à jour

### Suites possibles

- Export PDF budget voté
- Rappel notification avant septembre si budget non approuvé
- Clôture automatique en fin de saison
