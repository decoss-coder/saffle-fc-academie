# ADR-0006 — Convocations en onglets (Liste / Créer)

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

La page `/dashboard/convocations` empilait sur un seul écran long :

- Le formulaire « Nouvelle convocation » (titre, date, sélection de 39 joueurs dans une zone scrollable de 14 rem)
- La liste « Convocations récentes » en bas de page

Frictions identifiées :

- Scroll excessif pour accéder à l’historique ou au bouton d’envoi
- Liste joueurs trop petite pour convoquer tout un groupe
- Pas de distinction visuelle entre événements à venir et passés
- Aucun indicateur de taux de réponse parent sur la liste
- Pattern incohérent avec **Paiements** (`?tab=suivi` / `?tab=creer`) déjà adopté dans l’[ADR-0004](./0004-audit-ux-dashboard.md)

## Décision

### 1. Navigation par onglets (`?tab=`)

| Onglet | URL | Contenu |
|--------|-----|---------|
| **Liste** (défaut) | `/dashboard/convocations` | Historique scindé À venir / Passées |
| **Créer** | `/dashboard/convocations?tab=creer` | Formulaire isolé + `InfoBanner` |

Composant client `convocations-tabs.tsx`, calqué sur `paiements-tabs.tsx`, avec compteur sur l’onglet Liste.

### 2. Liste enrichie (`convocations-list.tsx`)

- Agrégation `convocation_entries` : `invited`, `pending`, `responded`
- Sections **À venir** (tri ascendant) et **Passées** (tri descendant)
- `StatusBadge` : type d’événement, « X en attente », « Passée »
- `ClickableCard` vers `/dashboard/convocations/[id]`
- `EmptyState` avec CTA « Créer une convocation »
- `ListCount` par section

### 3. Formulaire création

- Prop `expanded` sur `CreateConvocationForm` : liste joueurs `max-h-[min(32rem,55vh)]` en onglet Créer
- Bandeau `InfoBanner` rappelant le flux parent
- CTA header **Nouvelle convocation** (`primaryActionClass`) visible sur l’onglet Liste

### 4. Données

- Limite portée de 20 à **50** convocations sur la liste
- Requête entries groupée côté serveur (pas de RPC dédiée)

## Conséquences

### Positives

- Moins de scroll, parcours création vs consultation séparés
- Alignement UX avec Paiements et l’accueil pilotage ([ADR-0005](./0005-accueil-pilotage-operational.md))
- Visibilité immédiate des réponses en attente sur les convocations futures

### Négatives / limites

- Pas d’onglet « Historique » séparé (passées incluses dans Liste)
- Agrégation en mémoire (2 requêtes) ; acceptable jusqu’à ~50 convocations
- Onglet Créer charge quand même la liste des joueurs même si non affiché (optimisation possible)

### Suites possibles

- Filtre par type (entraînement / match) ou par groupe U12/U16 sur l’onglet Liste
- Recherche live sur les convocations passées
- Redirection post-création vers onglet Liste avec toast (au lieu de la fiche seule)
