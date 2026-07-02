# ADR-0010 — Parcours UX : une intention par écran

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

L’audit UX (juin–juillet 2026) a montré que plusieurs pages cumulent plusieurs jobs (lire, créer, filtrer, alerter, configurer) sur un seul écran. Les modules Vie du club et Convocations suivent déjà le modèle `?tab=` ; les zones Parent, Paiements (Wave), Salaires et fiche joueur restaient surchargées.

La sidebar utilisait le libellé « Famille », peu explicite pour le parcours parent/tuteur.

## Décision

### 1. Règle produit

| Niveau | Rôle | Exemple |
|--------|------|---------|
| **Pilotage** | Quoi traiter en premier | Accueil, notifications |
| **Suivi** | Où en est-on | Listes, filtres, compteurs |
| **Action** | Une tâche précise | Créer cotisation, créer salaire |
| **Détail** | Un cas / une fiche | Profil joueur, onglet documents |

**Si une page a deux intentions fortes → deux onglets ou deux routes.**

### 2. Sidebar — section « Parent »

- Renommer le groupe **Famille** en **Parent**.
- Ordre : Mes enfants → Convocations → Paiements → Documents.
- Visible pour les rôles parent, joueur compte, et staff avec enfants liés (`player_guardians`).

### 3. Onglets ajoutés (phase 1)

| Module | Onglets |
|--------|---------|
| Parent (sous-pages) | `ParentTabs` : Mes enfants / Convocations / Paiements / Documents |
| Parent paiements | En cours / Historique |
| Paiements staff | Suivi / Wave / Créer / Historique |
| Salaires | Liste / Créer |
| Fiche joueur | Profil / Documents / Accès parent / Admin |

### 4. Hub parent simplifié

`/dashboard/parent` : liste des enfants + signaux (cotisations en attente, convocations à répondre), sans répéter les liens déjà présents dans la sidebar.

## Conséquences

### Positives

- Parcours parent identifiable dans la nav et sur chaque sous-page.
- Moins de scroll et de CTA concurrents sur Paiements et fiche joueur.
- Modèle `?tab=` homogène avec Convocations et Vie du club.

### Négatives / limites

- Budget détail et hub Vie du club non traités dans cette phase.
- Parents accèdent encore à `/joueurs/[id]` (vue staff) depuis la fiche enfant — à traiter en phase 2 (`/parent/enfants/[id]`).

### Suites possibles

- Budget `[id]` en onglets (Synthèse / Lignes / Signatures / Exécution).
- Hub `/dashboard/club` orienté alertes uniquement.
- Fiche parent lecture seule dédiée.
