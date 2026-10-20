# Subarashii Manga Café — PWA

Web App / PWA du Subarashii Manga Café de Genève : vitrine du lieu (horaires, accès, partenaires),
agenda des événements, Pass de Combat saisonnier, XP & quêtes, classement TOP 10, carte membre QR et interface caisse.

DA « planche de manga » : fond charbon, cases papier à gouttières noires, rouge torii, or dorayaki,
trames d'impression et lignes de vitesse (`tone`, `speed-lines`, `manga-panel` dans `app/globals.css`).
Polices auto-hébergées dans `app/fonts` ; après avoir ajouté du texte japonais : `npm run fonts:jp`.

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
3. **Installer la base** : SQL Editor → New query → coller tout `supabase/setup.sql` → Run.
   Ce fichier regroupe les migrations de `supabase/migrations/` et le seed (régénéré par `npm run db:bundle`).
   Sur une base déjà installée, n'exécuter que les nouvelles migrations.

4. Authentication → URL Configuration :
   - **Site URL** : l'URL de prod (ex. `https://subarashii-one.vercel.app`), pas `localhost` — sinon les liens des e-mails renvoient vers `localhost:3000`.
   - **Redirect URLs** : `https://<prod>/auth/callback**` et `http://localhost:3000/auth/callback**`.
5. Authentication → Emails → modèles **Magic Link** et **Confirm signup** : remplacer le contenu par
   ```html
   <h2>Connexion au Subarashii Manga Café</h2>
   <p>Ton code : <strong>{{ .Token }}</strong></p>
   <p>Ou clique ici : <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/pass">se connecter</a></p>
   ```
   Le code à 6 chiffres et le lien `token_hash` marchent même si l'e-mail s'ouvre dans un autre
   navigateur ou si l'app est installée sur l'écran d'accueil (le lien par défaut, lui, échoue dans ces cas).
6. **E-mails (indispensable en production)** : le service d'e-mail intégré de Supabase est limité à
   quelques envois par heure et sert uniquement aux tests. Configurer un SMTP (Resend, Brevo, Postmark…)
   dans Authentication → SMTP Settings, puis relever la limite dans Authentication → Rate Limits.
7. Donner un rôle au personnel (la personne doit s'être connectée une première fois) :
   ```sql
   update public.profiles set role = 'admin'   -- ou 'cashier'
   where id = (select id from auth.users where email = 'prenom@exemple.ch');
   ```

## Espace staff (`/staff`)

Accessible aux rôles `cashier` et `admin` (lien depuis « Mon profil »).

- **Caisse** : scanner la carte membre du client (QR code dans « Mon profil ») ou le chercher par pseudo,
  saisir le montant du ticket. L'XP, le cumul de saison et le déblocage du Pass Premium sont calculés
  par la base ; le client voit le résultat en direct sur son téléphone.
- **Agenda** : créer, modifier, dépublier ou supprimer un événement, ajouter une affiche, voir les inscrits.
- **Shop** : gérer les articles (catégorie, prix, stock, photo, nouveauté, visibilité). Ils apparaissent sur `/shop`.

Le scanner utilise la caméra : il faut le site en **https** (c'est le cas sur Vercel).

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
  profile/              Carte membre (QR code) et historique
  shop/                 Catalogue public
  staff/                Espace staff : caisse, agenda, shop
  leaderboard/          (à venir)
  actions/              Server actions (pass, quêtes, inscriptions)
components/home/        Sections de l'accueil
components/events/      Cartes et filtres de l'agenda
components/dashboard/   Header joueur, jauge Premium, timeline 30 paliers, quêtes, overlay
components/staff/       Caisse + scanner QR, gestion agenda et shop, envoi d'images
lib/cafe.ts             Infos du lieu (adresse, horaires, univers, partenaires)
lib/events-content.ts   Catégories et événements d'exemple
lib/game.ts             Règles métier (miroir du SQL)
lib/season-content.ts   Contenu de saison (source du seed et du mode démo)
supabase/               Migration + seed (npm run db:seed:generate)
proxy.ts                Rafraîchissement de session Supabase
```
