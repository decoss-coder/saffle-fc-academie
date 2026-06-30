# ADR-0004 — Audit UX dashboard (22 pistes)

**Statut :** Accepté  
**Date :** 2026-06-30

## Contexte

Une revue UX de la console club (document « Analyse UIX Joueurs », élargie à **8 pages / 22 pistes**) a identifié des frictions sur :

- États vides et affordances trompeuses (matricules verts, tirets muets)
- Tableaux joueurs (colonnes redondantes, pas de tri/compteur, lignes non cliquables)
- Formulaires (sélection joueurs convocations, validation absente)
- Navigation (contexte redondant, CTA vs liens indifférenciés)
- Page Membres (chemin SQL exposé, statuts incohérents, téléphones en clair)
- Cohérence visuelle (banners hétérogènes, hub « Vie du club » statique)

La marque retenue reste **SAFFLE FF Académie CI** (`CLUB.name`) ; `shortName` uniquement sur header mobile compact.

## Décision

### 1. Couche UI partagée (`apps/web/src/lib/dashboard-ui.ts` + composants)

| Composant / token | Rôle |
|-------------------|------|
| `dashboard-ui.ts` | `matriculeClass`, `rowCompact`, `STATUS_VARIANT_CLASSES`, `primaryActionClass`, `navActionClass` |
| `dashboard-breadcrumbs.tsx` | Fil d'Ariane sous le `h1` |
| `nav-icons.tsx` | Icônes SVG sidebar (remplace pastilles lettres) |
| `group-tabs.tsx` | Onglets catégorie avec dim si `count = 0` |
| `live-search.tsx` | Recherche debounce 300 ms sans bouton OK |
| `data-table.tsx` | Tableau unifié + `ListCount` + `SortableTh` |
| `clickable-table-row.tsx` | Ligne cliquable + chevron |
| `clickable-card.tsx` | Cartes liste avec chevron |
| `empty-state.tsx` | État vide standardisé |
| `info-banner.tsx` | Bandeau info unifié (bord gauche vert) |
| `status-badge.tsx` | Badges sémantiques `good` / `warn` / `bad` / `neutral` |
| `form-field.tsx` | `RequiredLabel`, `FieldError`, validation `onBlur` |
| `phone-display.tsx` | Masquage RGPD + révélation au clic |

### 2. `DashboardShell`

- Breadcrumbs à la place des sous-titres `{contexte} — CLUB.name`
- Sidebar : `CLUB.name` + ville ; suppression pastille club en header
- Nom utilisateur uniquement en bas de sidebar (plus de doublon desktop)

### 3. Pages refondues (extraits)

| Zone | Changements clés |
|------|------------------|
| **Joueurs** | Colonne « Joueur » fusionnée, tri URL, recherche live, lignes cliquables, badges « Aucune » |
| **Paiements** | Onglets `?tab=suivi` (défaut) / `?tab=creer` |
| **Convocations** | Sélection U12/U16, compteur, recherche, validation 0 joueur |
| **Membres** | RPC `import_saffle_members()`, suppression chemin SQL UI, actions ligne, masquage téléphone |
| **Vie du club** | Tuiles avec icône + métrique live (counts Supabase) |
| **~30 pages** | Breadcrumbs, tableaux/cartes harmonisés |

### 4. Sécurité import membres (piste 19)

- Migration `20250630330000_import_saffle_members.sql`
- Fonction `public.import_saffle_members()` — `SECURITY DEFINER`, réservée `admin` / `president` via `get_my_role()`
- Retour JSON `{ staff_upserted, players_created, players_skipped }`
- Bouton UI « Importer les membres en masse » → server action `importMembers` (pas de référence au script SQL)

### 5. Actions membres (pistes 21–22)

- **Renvoyer le lien** : copie presse-papier message avec URL `/activer` (pas de SMS — hors scope)
- **Désactiver** : suppression utilisateur auth + `linked_user_id = null` dans `phone_registry`
- **Téléphone** : `maskPhoneDisplay` + `formatPhoneDisplay` normalisé

### 6. Hors scope immédiat (noté)

- Sélection multiple / export masse joueurs (piste 07 avancée)
- SMS réel pour activation
- Toggle mode compact utilisateur
- Validation inline sur tous les formulaires club (40+ champs fiche joueur)

## Conséquences

### Positives

- Console plus scannable : moins de scroll, moins de clics « Voir », contexte unique via fil d'Ariane
- Cohérence visuelle (banners, badges, tableaux, CTA)
- Fuite d'implémentation SQL supprimée de l'UI admin
- Import membres utilisable sans SQL Editor pour les admins

### Négatives / limites

- RPC import duplique la logique de `seed_saffle_members.sql` (maintenance parallèle)
- « Renvoyer le lien » dépend du copier-coller WhatsApp manuel
- Désactivation membre supprime le compte auth (réactivation = nouveau parcours `/activer`)

### Suites possibles

- Composant `InfoBanner` + `StatusBadge` sur modules club restants (formulaires client)
- SMS provider pour activation automatique
- Actions groupées joueurs (convoquer / exporter en masse)
- Tests E2E Playwright sur parcours Joueurs / Paiements / Membres
