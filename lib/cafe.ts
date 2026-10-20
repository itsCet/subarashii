// Informations du lieu physique affichées sur l'accueil.
// Source : https://www.subarashiimangacafe.ch, réseaux sociaux du café et horaires
// confirmés par l'équipe. Les champs `null` / « à compléter » restent à renseigner.

export const CAFE = {
  name: "Subarashii Manga Café",
  city: "Genève",
  tagline: "Ton QG manga à Genève",
  claim: "Le premier Manga Café de Suisse",
  website: "https://www.subarashiimangacafe.ch",
  address: {
    street: "Rue de Lyon 75-77",
    zip: "1203",
    city: "Genève",
    note: "Entrée côté avenue d'Aïre",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Subarashii+Manga+Caf%C3%A9+Rue+de+Lyon+75+1203+Gen%C3%A8ve",
  },
  access: [
    { mode: "Entrée", detail: "Côté avenue d'Aïre" },
    { mode: "Tram / Bus", detail: "Arrêt le plus proche à compléter" },
    { mode: "Gare", detail: "Depuis Cornavin, direction rue de Lyon" },
  ],
  socials: [
    { label: "Facebook", url: "https://www.facebook.com/subarashiimangacafe/" },
    { label: "TikTok", url: "https://www.tiktok.com/@subarashii.mangacafe" },
    { label: "Threads", url: "https://www.threads.com/@subarashii.mangacafe" },
    { label: "X", url: "https://x.com/smangacafe" },
  ],
  /** Lien de réservation d'alcôve (formulaire, outil de booking…). `null` → renvoie vers les infos pratiques. */
  alcoveBookingUrl: null as string | null,
};

export const UNIVERSES = [
  {
    key: "library",
    title: "Bibliothèque & Alcôves",
    description: "Des milliers de mangas à lire au calme, lovés dans nos alcôves.",
    icon: "book-open",
  },
  {
    key: "bar",
    title: "Bar & Fooding",
    description: "Boissons japonaises, bubble tea, snacks et douceurs maison.",
    icon: "coffee",
  },
  {
    key: "gaming",
    title: "Zone Gaming",
    description: "Consoles, jeux de société et soirées entre otakus.",
    icon: "gamepad-2",
  },
  {
    key: "shop",
    title: "Shop TCG & Mangas",
    description: "Nouveautés manga, boosters, displays et accessoires TCG.",
    icon: "layers",
  },
] as const;

export type DayHours = { open: string; close: string } | null;

/** Horaires par jour, index 0 = dimanche (comme `Date#getDay`). Une fermeture ≤ ouverture passe minuit. */
export const OPENING_HOURS: DayHours[] = [
  { open: "12:00", close: "18:00" }, // dimanche
  null, // lundi
  { open: "16:00", close: "22:00" }, // mardi
  { open: "14:00", close: "22:00" }, // mercredi
  { open: "16:00", close: "00:00" }, // jeudi
  { open: "14:00", close: "01:00" }, // vendredi
  { open: "12:00", close: "01:00" }, // samedi
];

export const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export const PARTNERS = [
  {
    name: "Post Tenebras Cards",
    kind: "TCG",
    description: "Partenaire TCG, co-organisateur d'événements au café.",
    url: null as string | null,
  },
  {
    name: "Arena Cinemas",
    kind: "Cinéma",
    description: "Partenaire du tournoi Lorcana organisé au cinéma.",
    url: null as string | null,
  },
  {
    name: "KBird",
    kind: "TCG",
    description: "Partenaire du tournoi Lorcana (Arena Cinemas).",
    url: null as string | null,
  },
  {
    name: "Genki Corp",
    kind: "Événementiel",
    description: "Partenaire du tournoi Lorcana (Arena Cinemas).",
    url: null as string | null,
  },
  {
    name: "GE Pokémon",
    kind: "Communauté",
    description: "Communauté Pokémon TCG de Genève : échanges et ventes au café.",
    url: null as string | null,
  },
  {
    name: "Ikigai Manga Shop",
    kind: "Manga",
    description: "Partenaire présent aux 2 ans du Suba.",
    url: null as string | null,
  },
  {
    name: "Moshy Club",
    kind: "Intervenant",
    description: "Partenaire présent aux 2 ans du Suba.",
    url: null as string | null,
  },
  {
    name: "Midnight Blossom",
    kind: "Intervenant",
    description: "Partenaire présent aux 2 ans du Suba.",
    url: null as string | null,
  },
];
