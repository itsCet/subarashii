// Informations du lieu physique affichées sur l'accueil.
// ⚠️ À COMPLÉTER : adresse, accès, horaires et partenaires sont des valeurs
// provisoires à remplacer par les informations officielles du café.

export const CAFE = {
  name: "Subarashii Manga Café",
  city: "Genève",
  tagline: "Ton QG manga à Genève",
  address: {
    street: "Adresse à compléter",
    zip: "12xx",
    city: "Genève",
    mapsUrl: "https://maps.google.com/?q=Subarashii+Manga+Caf%C3%A9+Gen%C3%A8ve",
  },
  access: [
    { mode: "Tram / Bus", detail: "Arrêt le plus proche à compléter" },
    { mode: "Gare", detail: "Distance depuis Cornavin à compléter" },
    { mode: "Parking", detail: "Parking le plus proche à compléter" },
  ],
  contact: {
    email: null as string | null,
    phone: null as string | null,
    instagram: null as string | null,
  },
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
  { open: "12:00", close: "20:00" }, // dimanche
  null, // lundi
  { open: "12:00", close: "22:00" }, // mardi
  { open: "12:00", close: "22:00" }, // mercredi
  { open: "12:00", close: "22:00" }, // jeudi
  { open: "12:00", close: "00:00" }, // vendredi
  { open: "11:00", close: "00:00" }, // samedi
];

export const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export const PARTNERS = [
  {
    name: "Post Tenebras Cards",
    kind: "TCG",
    description: "Partenaire cartes à collectionner.",
    url: null as string | null,
  },
  {
    name: "Associations locales",
    kind: "Communauté",
    description: "Clubs manga, jeux et culture japonaise de la région.",
    url: null as string | null,
  },
];
