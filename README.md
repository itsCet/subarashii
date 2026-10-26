# Subarashii Manga Café — PWA

Web App / PWA du Subarashii Manga Café de Genève : vitrine du lieu (horaires, accès, partenaires),
agenda des événements, Pass de Combat saisonnier, XP & quêtes, classement TOP 10, carte membre QR et interface caisse.

DA « planche de manga » : fond charbon, cases papier à gouttières noires, rouge torii, or dorayaki,
trames d'impression et lignes de vitesse (`tone`, `speed-lines`, `manga-panel` dans `app/globals.css`).
Polices auto-hébergées dans `app/fonts` ; après avoir ajouté du texte japonais : `npm run fonts:jp`.

**Mode clair / sombre** : bouton soleil/lune dans le header. Par défaut le site suit le réglage du
téléphone ; le choix est ensuite mémorisé. Le thème clair redéfinit les variables de couleur dans
`app/globals.css` (`ink`, `charcoal`, `paper` et l'échelle `zinc` inversée), sans classes `dark:`.
Sur un fond d'accent plein (`bg-torii`, `bg-gold`…), utiliser `text-white` / `text-black`.

Les infos du lieu (adresse, horaires, réseaux, partenaires) sont dans `lib/cafe.ts`.
> ⚠️ **À compléter** : arrêt de tram/bus, liens des partenaires, et `alcoveBookingUrl` (le bouton
> « Réserver une Alcôve » renvoie aux infos pratiques tant qu'il n'est pas renseigné).

## Outils de design installés dans le projet

- **Motion** (`.claude/skills/` : `emil-design-eng`, `animate`, `review-animations`,
  `find-animation-opportunities`, `animation-vocabulary`) — skills d'Emil Kowalski.
- **Impeccable** (`.claude/skills/impeccable`) — revue de design ; détecteur automatique :
  `npx impeccable detect http://localhost:3000` (ajouter `--viewport 390x844` pour le mobile).
- **Playwright MCP** (`.mcp.json`) — navigateur piloté par Claude Code pour tester le site.

Règles de couleur : un accent existe en version **fond** (`bg-torii`, `bg-gold` : texte blanc/noir
dessus) et **texte** (`text-torii-ink`, `text-gold-ink`, `text-sakura-ink`), et `-ink-inv` dans les
cases inversées (`bg-paper`). Pas de texte sous 11 px. Retour tactile global sur les boutons
(`scale: 0.97`) ; ajouter `pressable` aux liens stylés en bouton.

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
   **Sur une base déjà installée** : coller plutôt tout `supabase/update.sql` (relançable sans risque,
   régénéré lui aussi par `npm run db:bundle`).

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

Accessible aux rôles `cashier` et `admin` : lien discret « Espace équipe » en bas de « Mon profil »
(visible uniquement par ces comptes), ou directement l'adresse `/staff` à mettre en favori sur la tablette de caisse.
Pour un compte client, `/staff` répond « page introuvable ».

- **Caisse** : toucher les articles (onglets Bar & snacks, Mangas, TCG, Goodies) pour remplir le ticket,
  ajouter au besoin une ligne « Montant libre », puis **glisser** la barre « Encaisser » (évite les validations
  par erreur ; « Remettre » une récompense fonctionne pareil). Le client paie au comptoir comme d'habitude.
  Le stock est décrémenté automatiquement. Membre facultatif : scanner sa carte (QR code dans « Mon profil »)
  ou le chercher par pseudo pour lui créditer l'XP (1 CHF = 10 XP) ; le client voit le résultat en direct.
  Si le membre a réclamé des récompenses physiques dans son Pass (boisson, booster, goodies…),
  elles s'affichent sous sa fiche avec un bouton « Remettre » : une récompense ne peut être remise qu'une fois.
- **Commandes** : les commandes passées par les clients depuis le shop arrivent en direct (avec un petit son).
  « Préparer » → « C'est prêt » (le client est prévenu sur son téléphone) → « Encaisser » / « Remise au client ».
  L'XP est créditée à la remise (ou dès le paiement en ligne). « Annuler » remet le stock en rayon.
- **Agenda** : créer, modifier, dépublier ou supprimer un événement, ajouter une affiche, voir les inscrits.
- **Shop** : gérer les articles (catégorie, prix, stock, photo, nouveauté, visibilité). Ils apparaissent sur `/shop`.

## Premier passage (onboarding)

Après sa première connexion, le joueur passe par `/bienvenue` : pseudo (unique), univers préféré
(mangas, TCG, gaming, bar), puis le fonctionnement du Pass en 3 cases. Le personnel en est dispensé.

## Commander depuis l'app (clients)

Sur `/shop`, le client ajoute des articles au panier puis commande depuis `/shop/panier` (connexion requise).
Il suit sa commande dans `/commandes` : reçue → en préparation → prête → remise. 3 commandes en cours maximum ;
il peut annuler tant que le staff ne l'a pas prise en charge. Les prix sont toujours recalculés par la base.

### Paiement en ligne (Stripe : carte, TWINT…) — facultatif

Sans configuration, seul « payer au comptoir » est proposé. Pour l'activer :

1. Créer un compte [Stripe](https://dashboard.stripe.com) (mode **Test** pour essayer), activer TWINT dans
   Settings → Payment methods.
2. Developers → Webhooks → Add endpoint : `https://<site>/api/stripe/webhook`, événements
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`.
3. Dans Vercel → Settings → Environment Variables, ajouter `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   (secret de signature du webhook) et `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API), puis redéployer.

Le stock est réservé pendant le paiement (30 min max) ; une session abandonnée ou expirée annule la commande.
En mode test, la carte `4242 4242 4242 4242` est acceptée.

Le scanner utilise la caméra : il faut le site en **https** (c'est le cas sur Vercel).

## Règles métier

| Règle | Où |
| --- | --- |
| 1 CHF = 10 XP | `credit_purchase` (SQL) · `lib/game.ts` |
| Prix, stock et total d'une vente toujours calculés par la base | `pos_checkout` · `place_order` |
| XP d'une commande créditée une seule fois (remise ou paiement en ligne) | `complete_order` · `mark_order_paid` |
| Niveau = `floor(XP / 500) + 1` | trigger `sync_profile_level` · `levelForXp` |
| Pass Premium dès 25 CHF cumulés sur la saison | `record_transaction` · `applyTransaction` |
| Récompense réclamable si niveau atteint (+ Premium pour la voie Premium) | `claim_reward` · `rewardState` |
| Récompense physique à retirer au comptoir ; badges, titres, cadres, avatars, fonds d'écran = numériques | `redeem_reward` · `isDigitalReward` |

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
  shop/                 Catalogue public + panier (shop/panier)
  commandes/            Suivi des commandes du client (temps réel)
  api/stripe/webhook/   Confirmation des paiements en ligne
  staff/                Espace staff : caisse, commandes, agenda, shop
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
