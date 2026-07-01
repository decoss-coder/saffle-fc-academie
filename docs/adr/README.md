# Architecture Decision Records (ADR)

Ce dossier recense les décisions d'architecture importantes du projet **SAFFLE FF Académie CI**.

## Format

Chaque ADR suit la structure :

1. **Statut** — Proposé, Accepté, Déprécié, Remplacé
2. **Contexte** — Problème ou besoin métier
3. **Décision** — Ce qui a été choisi
4. **Conséquences** — Avantages, inconvénients, suites possibles

## Index

| ADR | Titre | Statut |
|-----|-------|--------|
| [0001](./0001-donnees-joueurs-storage-notifications.md) | Données joueurs, Storage Supabase et notifications in-app | Accepté |
| [0002](./0002-modules-vie-du-club.md) | Modules « Vie du club » (planning, équipement, discipline, médical, matchs, intéressement, aides, logistique, transport) | Accepté |
| [0003](./0003-budget-comite-directeur.md) | Budget prévisionnel (SG + Président + TG) et cotisations comité directeur | Accepté |
| [0004](./0004-audit-ux-dashboard.md) | Audit UX dashboard — composants partagés, 22 pistes, import RPC sécurisé | Accepté |
| [0005](./0005-accueil-pilotage-operational.md) | Accueil pilotage opérationnel — inbox alertes, événements, rythme club live | Accepté |
| [0006](./0006-convocations-onglets.md) | Convocations en onglets Liste / Créer, stats de réponse | Accepté |
| [0007](./0007-modules-vie-du-club-onglets.md) | Modules Vie du club en onglets (équipement, discipline, planning, etc.) | Accepté |
| [0008](./0008-finance-admin-onglets.md) | Finance & Administration en onglets (comité, membres, budget, mes cotisations) | Accepté |
| [0009](./0009-crud-complet-super-admin.md) | CRUD complet (membres, cotisations, budget, planning, convocations) + super admin Boty Dia Armel | Accepté |

## Créer un nouvel ADR

1. Copier le modèle ci-dessous dans `docs/adr/NNNN-titre-court.md`
2. Incrémenter le numéro (`0002`, `0003`, …)
3. Mettre à jour cet index

### Modèle

```markdown
# ADR-NNNN — Titre

**Statut :** Proposé  
**Date :** AAAA-MM-JJ

## Contexte

…

## Décision

…

## Conséquences

### Positives

- …

### Négatives / limites

- …

### Suites possibles

- …
```
