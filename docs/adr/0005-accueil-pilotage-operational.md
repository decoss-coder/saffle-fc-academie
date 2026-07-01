# ADR-0005 — Accueil pilotage opérationnel (inbox + signaux live)

**Statut :** Accepté  
**Date :** 2026-06-30

## Contexte

L’accueil staff (`/dashboard`) héritait d’une structure « menu déguisé » :

- 5 cartes modules dupliquant la sidebar (Joueurs, Convocations, Paiements, etc.)
- Section « Priorités » redondante avec les mêmes chiffres
- « Rythme club » affichant **Stable** en dur, sans requête Supabase
- Métriques hétérogènes (`39`, `Match`, `OTP`, `Club`) non comparables
- Sous-titre masqué dès qu’un fil d’Ariane était présent (`DashboardShell`)
- Aucune remontée d’alertes actionnables (Wave, convocations, documents, médical…)

Complète l’[ADR-0004](./0004-audit-ux-dashboard.md) qui harmonisait les **pages modules** mais laissait l’accueil en marge.

## Décision

### 1. Couche `lib/dashboard/`

| Fichier | Rôle |
|---------|------|
| `alerts.ts` | Types `DashboardAlert`, `DashboardKpi`, `DashboardSnapshot` ; construction alertes/KPIs/actions par rôle |
| `snapshot.ts` | `fetchDashboardSnapshot()` — requêtes Supabase parallèles, point d’entrée unique |
| `events.ts` | Prochains événements staff (agrégat réponses) et parent (par enfant) |
| `rhythm.ts` | Rythme club calculé : présences 7 j, documents pending, recouvrement cotisations du mois |

### 2. Composants `components/dashboard/`

| Composant | Rôle |
|-----------|------|
| `kpi-strip.tsx` | Bandeau chiffres compacts (non cliquable) |
| `alert-inbox.tsx` | Inbox triée par priorité (`critical` → `high` → `normal`), max 5 items |
| `upcoming-events.tsx` | 3 prochains événements avec taux de réponse ou statut parent |
| `club-rhythm.tsx` | Tuiles Présences / Documents / Cotisations avec `StatusBadge` |
| `quick-actions-bar.tsx` | CTA directs (premier bouton = `primaryActionClass`) |

### 3. Structure page Accueil

Ordre vertical :

1. **KPI strip** — effectif, alertes ouvertes, Wave, docs, non activés (selon rôle)
2. **À traiter** — inbox cliquable vers le module concerné
3. **Prochains événements** — convocations à venir
4. **Rythme club** + **Actions rapides** (grille 2 colonnes desktop ; parents : actions seules)

### 4. Alertes staff (selon permissions)

| Alerte | Source | Priorité |
|--------|--------|----------|
| Paiements Wave en attente | `payments` | critical |
| Réponses convocation en attente (événements futurs) | `convocations` + `convocation_entries` | high |
| Documents à valider | `player_documents` | high |
| Cotisations en retard | `player_dues` | high |
| Certificats médicaux < 30 j | `players.medical_cert_expires_at` | high |
| Membres sans compte activé | `phone_registry.linked_user_id IS NULL` | normal |
| Notifications non lues | `notifications` | normal |

**Parents** : convocations sans réponse, cotisations à régler, notifications.

### 5. Rythme club (données réelles)

| Pilier | Calcul | Seuils `StatusBadge` |
|--------|--------|----------------------|
| Présences | absences + retards sur entraînements 7 derniers jours | 0 good · 1–3 warn · 4+ bad |
| Documents | `player_documents` status `pending` | 0 good · 1–5 warn · 6+ bad |
| Cotisations | % recouvrement cotisations créées ce mois | ≥ 80 % good · 50–79 warn · < 50 bad |

Visibilité : Présences/Documents si `canManagePlayers` ; Cotisations si `canManagePayments`.

### 6. `DashboardShell`

Affichage **simultané** du fil d’Ariane et du sous-titre (plus de exclusivité `breadcrumbs XOR subtitle`).

## Conséquences

### Positives

- L’accueil répond à « que faire maintenant ? » plutôt qu’à « où aller ? »
- Suppression des placeholders (`Match`, `OTP`, `Stable`)
- Réutilisation de `StatusBadge`, `ClickableCard`, `EmptyState`, tokens `dashboard-ui`
- Vue parent alignée sur le même modèle inbox

### Négatives / limites

- 10–14 requêtes Supabase au chargement de l’accueil (acceptable ; optimisation possible via vue SQL ou RPC)
- Pas de page « toutes les alertes » dédiée (inbox limitée à 5 items)
- Recouvrement cotisations basé sur `created_at` du mois, pas sur `due_date`
- Parents sans section Rythme club (hors scope famille)

### Suites possibles (hors scope immédiat)

- RPC `get_dashboard_snapshot()` pour un seul round-trip
- Badge compteur notifications dans la sidebar
- État actif visuel sur le lien « Accueil »
- Tests E2E Playwright sur l’inbox et les événements à venir
