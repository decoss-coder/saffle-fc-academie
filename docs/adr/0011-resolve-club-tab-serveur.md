# ADR-0011 — `resolveClubTab` utilisable côté serveur

**Statut :** Accepté  
**Date :** 2026-07-01

## Contexte

L’alerte **À traiter** du tableau de bord (« 52 membre(s) sans compte activé ») pointe vers `/dashboard/admin/telephones`. En production (Next.js 16), cette page renvoyait une erreur serveur Vercel (`ERROR 832468779`) :

```
Attempted to call resolveClubTab() from the server but resolveClubTab is on the client.
```

Cause : le helper `resolveClubTab` était exporté depuis `club-module-tabs.tsx`, fichier marqué `"use client"` ([ADR-0007](./0007-modules-vie-du-club-onglets.md), [ADR-0008](./0008-finance-admin-onglets.md)). Les pages serveur (Membres, Budget, Vie du club, Parents) l’appelaient au rendu pour valider le paramètre `?tab=` / `?statut=`.

Le build local passait ; l’erreur n’apparaissait qu’à l’exécution sur Vercel.

## Décision

1. Extraire `resolveClubTab` dans `apps/web/src/lib/resolve-club-tab.ts` (module sans directive client).
2. Conserver `ClubModuleTabs` dans `club-module-tabs.tsx` (composant client inchangé).
3. Importer `resolveClubTab` depuis `@/lib/resolve-club-tab` dans toutes les pages serveur concernées.

```ts
export function resolveClubTab(
  tab: string | undefined,
  allowed: string[],
  defaultTab: string,
) {
  if (tab && allowed.includes(tab)) return tab;
  return defaultTab;
}
```

## Conséquences

### Positives

- `/dashboard/admin/telephones` et les autres écrans à onglets se chargent en production.
- Le lien **À traiter** → Membres fonctionne sans changement d’URL.
- Séparation claire : logique pure (serveur) vs navigation interactive (client).

### Négatives / limites

- Deux points d’import à connaître (`resolve-club-tab` vs `club-module-tabs`).
- Tout nouveau helper partagé serveur/client devra suivre le même pattern (ne pas le placer dans un fichier `"use client"`).

### Suites possibles

- Documenter la règle dans `apps/web/AGENTS.md` ou une note ADR-0007.
- Filtrer l’alerte « non activés » vers `?tab=import` ou un onglet « En attente » dédié.
