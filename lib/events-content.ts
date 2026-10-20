// Événements d'exemple (seed Supabase + mode démo). Dates relatives à aujourd'hui.

export type EventCategory = "tcg" | "game_night" | "nocturne";

export const EVENT_CATEGORIES: { key: EventCategory; label: string; examples: string }[] = [
  { key: "tcg", label: "Tournois TCG", examples: "One Piece, Pokémon, Yu-Gi-Oh!" },
  { key: "game_night", label: "Soirées Jeux", examples: "Loup-Garou, Quiz, JDR" },
  { key: "nocturne", label: "Befores & Nocturnes", examples: "K-Pop, Hip-Hop" },
];

export const SAMPLE_EVENTS = [
  {
    slug: "tournoi-one-piece",
    title: "Tournoi One Piece TCG",
    description: "Store tournament en rondes suisses, lots pour le top 4 et booster de participation.",
    category: "tcg",
    tag: "One Piece",
    day_offset: 3,
    time: "14:00",
    duration_min: 300,
    price_chf: 10,
    conditions: "Deck de 50 cartes + Leader, decklist à remettre à l'accueil",
    capacity: 32,
  },
  {
    slug: "soiree-loup-garou",
    title: "Soirée Loup-Garou",
    description: "Le village de Thiercelieux s'invite au café. Débutants bienvenus, un MJ anime chaque table.",
    category: "game_night",
    tag: "Loup-Garou",
    day_offset: 5,
    time: "19:30",
    duration_min: 180,
    price_chf: 0,
    conditions: "Gratuit avec une consommation",
    capacity: 18,
  },
  {
    slug: "quiz-manga-anime",
    title: "Quiz Manga & Animé",
    description: "Blind tests d'openings, questions shōnen, seinen et culture japonaise.",
    category: "game_night",
    tag: "Quiz",
    day_offset: 9,
    time: "20:00",
    duration_min: 150,
    price_chf: 5,
    conditions: "Par personne · équipes de 2 à 5",
    capacity: 40,
  },
  {
    slug: "tournoi-pokemon",
    title: "Tournoi Pokémon TCG",
    description: "Format Standard, ambiance conviviale, ouvert à tous les niveaux.",
    category: "tcg",
    tag: "Pokémon",
    day_offset: 11,
    time: "13:30",
    duration_min: 300,
    price_chf: 10,
    conditions: "Format Standard · decklist obligatoire",
    capacity: 24,
  },
  {
    slug: "before-kpop",
    title: "Before K-Pop",
    description: "Random play dance, playlist K-Pop et bubble tea avant de sortir.",
    category: "nocturne",
    tag: "K-Pop",
    day_offset: 13,
    time: "19:00",
    duration_min: 180,
    price_chf: 0,
    conditions: "Entrée libre",
    capacity: 60,
  },
  {
    slug: "yugioh-locals",
    title: "Yu-Gi-Oh! Locals",
    description: "Tournoi local en format Advanced, cartes promo à gagner.",
    category: "tcg",
    tag: "Yu-Gi-Oh!",
    day_offset: 17,
    time: "14:00",
    duration_min: 300,
    price_chf: 8,
    conditions: "Format Advanced · Konami ID requis",
    capacity: 24,
  },
  {
    slug: "soiree-jdr",
    title: "Soirée JDR découverte",
    description: "One-shot d'initiation au jeu de rôle dans un univers inspiré des mangas.",
    category: "game_night",
    tag: "JDR",
    day_offset: 20,
    time: "19:00",
    duration_min: 240,
    price_chf: 15,
    conditions: "Boisson incluse · aucune expérience requise",
    capacity: 10,
  },
  {
    slug: "nocturne-hip-hop",
    title: "Nocturne Hip-Hop × Manga",
    description: "DJ set hip-hop, lectures en accès libre et cocktails japonais jusqu'à tard.",
    category: "nocturne",
    tag: "Hip-Hop",
    day_offset: 24,
    time: "21:00",
    duration_min: 240,
    price_chf: 10,
    conditions: "Une boisson offerte",
    capacity: 80,
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  description: string;
  category: EventCategory;
  tag: string;
  day_offset: number;
  time: string;
  duration_min: number;
  price_chf: number;
  conditions: string;
  capacity: number | null;
}[];
