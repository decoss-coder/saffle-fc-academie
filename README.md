# SAFFLE FC Académie

Plateforme numérique officielle du club **SAFFLE FC Académie**, basé à **Sinfra, Côte d'Ivoire**.

Elle centralise la gestion du club — **web**, **iOS** et **Android** — pour les dirigeants, coaches, parents et joueurs.

## Stack

| Couche | Technologie |
|--------|-------------|
| Web | Next.js 16 (App Router) — déployé sur **Vercel** |
| Mobile | Expo (React Native) — **iOS** et **Android** |
| Backend | **Supabase** (Auth, PostgreSQL, Storage, Realtime) |
| Monorepo | npm workspaces |

## Structure

```
├── apps/
│   ├── web/          # Application web Next.js
│   └── mobile/       # Application Expo iOS / Android
├── packages/
│   └── supabase/     # Types et helpers partagés
└── docs/             # Cahier des charges fonctionnel
```

## Prérequis

- Node.js 20+
- Compte [Supabase](https://supabase.com)
- Compte [Vercel](https://vercel.com)
- Pour le mobile : Xcode (iOS) et/ou Android Studio

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/VOTRE_ORG/saffle-fc-academie.git
cd saffle-fc-academie

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env
```

Renseignez dans Supabase Dashboard → **Settings → API** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_URL` (même URL)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (même clé anon)

## Lancer en local

```bash
# Web
npm run dev:web

# Mobile
npm run dev:mobile
```

## Déploiement

| Service | URL |
|---------|-----|
| **Web (production)** | https://saffle-fc-academie.vercel.app |
| **GitHub** | https://github.com/decoss-coder/saffle-fc-academie |
| **Vercel Dashboard** | https://vercel.com/decoss-coders-projects/saffle-fc-academie |

Le déploiement automatique est activé à chaque push sur `main`.

## Configuration Supabase

**Projet :** `rfmilqrkpairxyaluzni`  
**URL :** `https://rfmilqrkpairxyaluzni.supabase.co`

1. Exécuter **une seule fois** dans **SQL Editor** :
   → `supabase/scripts/repair_policies.sql`
   *(corrige RLS + politiques joueurs, sans erreur si déjà appliqué)*
2. **Authentication → URL Configuration** :
   - Site URL : `https://saffle-fc-academie.vercel.app`
   - Redirect : `https://saffle-fc-academie.vercel.app/auth/callback`
3. Variables déjà configurées sur Vercel (`NEXT_PUBLIC_SUPABASE_*`)
4. Localement : `apps/web/.env.local` et `apps/mobile/.env`

### CLI Supabase (sur votre machine)

```bash
supabase login
cd "SAFFLE FC Académie"
supabase link --project-ref rfmilqrkpairxyaluzni
supabase db push
```

## Déploiement Vercel (déjà configuré)

## Déploiement mobile

```bash
cd apps/mobile
npx expo start
```

Pour les builds de production, utiliser [EAS Build](https://docs.expo.dev/build/introduction/) :

```bash
npx eas build --platform all
```

## Documentation métier

Le cahier des charges fonctionnel se trouve dans `docs/` :

- Volume 1 — Présentation du projet
- Modules Joueurs, Parents, Coach, Paiements

## Prochaines étapes

1. Créer le schéma Supabase (utilisateurs, rôles, joueurs, paiements)
2. Implémenter l'authentification (email, magic link ou OTP)
3. Développer le module Joueurs (cœur de la plateforme)
4. Brancher les paiements Wave (Équipe A / B)
