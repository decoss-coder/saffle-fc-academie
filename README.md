# SAFFLE FC Académie

Plateforme de gestion pour club et académie de football — **web**, **iOS** et **Android**.

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

## Déploiement Vercel

1. Importer le dépôt GitHub sur [vercel.com/new](https://vercel.com/new)
2. Définir le **Root Directory** sur `apps/web`
3. Ajouter les variables d'environnement Supabase dans Vercel
4. Déployer

Ou via CLI :

```bash
cd apps/web
vercel link
vercel env pull .env.local
vercel --prod
```

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
