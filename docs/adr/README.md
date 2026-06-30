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
