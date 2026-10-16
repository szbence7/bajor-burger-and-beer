import { images } from "./images";

export type MenuBadge = "Új" | "Csípős" | "Vega" | "A ház kedvence";

export interface Burger {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  image: string;
  badges: MenuBadge[];
  featured?: boolean;
}

export interface Side {
  id: string;
  name: string;
  description: string;
  price: number;
  badges?: MenuBadge[];
}

export const burgers: Burger[] = [
  {
    id: "bajor-dupla",
    name: "Bajor Dupla",
    description: "Két smash-elt marhapogácsa, dupla cheddar, karamellizált hagyma és házi mustáros szósz.",
    ingredients: ["2× 90 g marha", "cheddar", "karamellizált hagyma", "savanyú uborka", "mustáros majonéz", "brióskifli"],
    price: 4290,
    image: images.burgerHero,
    badges: ["A ház kedvence"],
    featured: true,
  },
  {
    id: "pokol-tuze",
    name: "Pokol Tüze",
    description: "Ropogós bacon, jalapeño, füstös chilis BBQ és pepper jack sajt — csak bátraknak.",
    ingredients: ["180 g marha", "bacon", "jalapeño", "pepper jack", "chilis BBQ", "szezámos buci"],
    price: 4590,
    image: images.burgerSpicy,
    badges: ["Csípős", "Új"],
    featured: true,
  },
  {
    id: "zold-perec",
    name: "Zöld Perec",
    description: "Grillezett halloumi és házi babpogácsa perecbuciban, rukkolával és fokhagymás szósszal.",
    ingredients: ["babpogácsa", "halloumi", "paradicsom", "rukkola", "fokhagymás krém", "perecbuci"],
    price: 3890,
    image: images.burgerVeggie,
    badges: ["Vega"],
    featured: true,
  },
  {
    id: "weisswurst",
    name: "München Classic",
    description: "Marhapogácsa, sörben párolt hagyma, Bergkäse sajt és édes bajor mustár.",
    ingredients: ["180 g marha", "Bergkäse", "sörös hagyma", "édes mustár", "brióskifli"],
    price: 4190,
    image: images.burgerHero,
    badges: [],
  },
  {
    id: "smoky-joe",
    name: "Füstös Jóska",
    description: "12 órán át füstölt tépett tarja, coleslaw és whiskys BBQ mázzal.",
    ingredients: ["pulled pork", "coleslaw", "whiskys BBQ", "lilahagyma", "brióskifli"],
    price: 4390,
    image: images.burgerSpicy,
    badges: ["Új"],
  },
  {
    id: "kerti-mezo",
    name: "Kerti Mező",
    description: "Sült gombás-zöldséges pogácsa, kecskesajt, mézes dió és friss saláta.",
    ingredients: ["gombapogácsa", "kecskesajt", "mézes dió", "salátamix", "teljes kiőrlésű buci"],
    price: 3790,
    image: images.burgerVeggie,
    badges: ["Vega"],
  },
];

export const sides: Side[] = [
  { id: "hasabburgonya", name: "Hasábburgonya", description: "Kétszer sütve, tengeri sóval, házi ketchuppal.", price: 1190 },
  { id: "truffel", name: "Szarvasgombás krumpli", description: "Parmezánnal, petrezselyemmel és szarvasgombaolajjal.", price: 1690, badges: ["A ház kedvence"] },
  { id: "perec", name: "Óriás bajor perec", description: "Frissen sütve, Obatzda sajtkrémmel és mustárral.", price: 1490, badges: ["Vega"] },
  { id: "hagymakarika", name: "Sörtésztás hagymakarika", description: "Ropogós, füstös paprikás mártogatóssal.", price: 1390 },
];
