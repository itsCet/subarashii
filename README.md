# Subarashii Manga Café — PWA

Web App / PWA du Subarashii Manga Café de Genève : vitrine du lieu (horaires, accès, partenaires),
agenda des événements, Pass de Combat saisonnier, XP & quêtes, classement TOP 10, carte membre QR et interface caisse.

DA « manga café chaleureux » : fond charbon, papier manga, rouge torii, or dorayaki, touches sakura,
cases de manga à bordure nette et trames halftone (`manga-panel`, `halftone-*` dans `app/globals.css`).

Les infos du lieu (adresse, horaires, réseaux, partenaires) sont dans `lib/cafe.ts`.
> ⚠️ **À compléter** : arrêt de tram/bus, liens des partenaires, et `alcoveBookingUrl` (le bouton
> « Réserver une Alcôve » renvoie aux infos pratiques tant qu'il n'est pas renseigné).

**Stack** : Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Framer Motion · Lucide · Supabase (Auth, Postgres, RLS, Realtime).

## Démarrage

```bash
npm install
npm run dev          # http://localhost:3000
```

Sans variables Supabase, l'app tourne en **mode démo** (données locales + boutons pour simuler un ticket de caisse).

### Brancher Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Copier `.env.example` en `.env.local` et renseigner l'URL et la clé `anon`.
3. Exécuter dans le SQL Editor, dans l'ordre :
   - `supabase/migrations/20261020000000_init.sql` (tables, RLS, fonctions, realtime)
   - `supabase/migrations/20261021000000_events.sql` (agenda, inscriptions à places limitées)
   - `supabase/seed.sql` (Saison 1 « Cyber Arcade », 30 paliers, quêtes, événements d'exemple)

   ou avec la CLI : `supabase db push` puis `supabase db reset` en local.
4. Authentication → URL Configuration : ajouter `http://localhost:3000/auth/callback**` (et l'URL de prod) aux Redirect URLs — le `**` autorise le paramètre `?next=`.
5. Donner un rôle au staff :
   ```sql
   update public.profiles set role = 'cashier' where id = '<uuid du compte>';
   ```

## Règles métier

| Règle | Où |
| --- | --- |
| 1 CHF = 10 XP | `record_transaction` (SQL) · `lib/game.ts` |
| Niveau = `floor(XP / 500) + 1` | trigger `sync_profile_level` · `levelForXp` |
| Pass Premium dès 25 CHF cumulés sur la saison | `record_transaction` · `applyTransaction` |
| Récompense réclamable si niveau atteint (+ Premium pour la voie Premium) | `claim_reward` · `rewardState` |

Toute écriture sensible (XP, montant, pass, récompenses, quêtes) passe par des fonctions
`security definer` ; les joueurs ne peuvent modifier que `username` et `avatar_url` de leur profil.
Le profil est publié en Realtime : quand le caissier valide un ticket, l'écran du joueur affiche
l'XP gagnée et l'animation « PASS PREMIUM DÉBLOQUÉ ! » en direct.

## Structure

```
app/
  page.tsx              Accueil : hero, prochains événements, Pass, horaires & accès, partenaires
  events/               Agenda filtrable + inscriptions
  pass/                 Pass de Combat & quêtes
  login/, auth/callback Connexion par lien magique
  profile/ leaderboard/ shop/ cashier/   (à venir)
  actions/              Server actions (pass, quêtes, inscriptions)
components/home/        Sections de l'accueil
components/events/      Cartes et filtres de l'agenda
components/dashboard/   Header joueur, jauge Premium, timeline 30 paliers, quêtes, overlay
lib/cafe.ts             Infos du lieu (adresse, horaires, univers, partenaires)
lib/events-content.ts   Catégories et événements d'exemple
lib/game.ts             Règles métier (miroir du SQL)
lib/season-content.ts   Contenu de saison (source du seed et du mode démo)
supabase/               Migration + seed (npm run db:seed:generate)
proxy.ts                Rafraîchissement de session Supabase
```
