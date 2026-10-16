export interface Drink {
  id: string;
  name: string;
  detail: string;
  price: number;
}

export const drinks: Drink[] = [
  { id: "limo-bodza", name: "Házi bodzalimonádé", detail: "0,5 l", price: 990 },
  { id: "limo-gyomber", name: "Gyömbéres-citromos limonádé", detail: "0,5 l", price: 990 },
  { id: "cola", name: "Coca-Cola / Zero", detail: "0,33 l", price: 690 },
  { id: "tonic", name: "Fever-Tree Tonic", detail: "0,2 l", price: 790 },
  { id: "almale", name: "Préselt almalé", detail: "0,3 l", price: 790 },
  { id: "spritz", name: "Fröccs (hosszúlépés)", detail: "1 dl bor + 2 dl szóda", price: 890 },
  { id: "palinka", name: "Szilvapálinka", detail: "4 cl", price: 1290 },
  { id: "espresso", name: "Espresso", detail: "dupla", price: 690 },
];
