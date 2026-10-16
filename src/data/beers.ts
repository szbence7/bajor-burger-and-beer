export type BeerServe = "csapolt" | "palackos";

export interface BeerSize {
  label: string; // pl. "0,3 l"
  price: number;
}

export interface Beer {
  id: string;
  name: string;
  style: string;
  brewery: string;
  abv: number;
  serve: BeerServe;
  sizes: BeerSize[];
  house?: boolean;
}

export const beers: Beer[] = [
  { id: "bajor-helles", name: "Bajor Helles", style: "Helles Lager", brewery: "Bajor Házi Főzde", abv: 4.9, serve: "csapolt", house: true, sizes: [{ label: "0,3 l", price: 890 }, { label: "0,5 l", price: 1290 }] },
  { id: "bajor-weizen", name: "Bajor Weizen", style: "Hefeweizen", brewery: "Bajor Házi Főzde", abv: 5.3, serve: "csapolt", house: true, sizes: [{ label: "0,3 l", price: 950 }, { label: "0,5 l", price: 1390 }] },
  { id: "bajor-dunkel", name: "Bajor Dunkel", style: "Munich Dunkel", brewery: "Bajor Házi Főzde", abv: 5.5, serve: "csapolt", house: true, sizes: [{ label: "0,3 l", price: 950 }, { label: "0,5 l", price: 1390 }] },
  { id: "cheddar-ipa", name: "Cheddar IPA", style: "West Coast IPA", brewery: "Bajor Házi Főzde", abv: 6.4, serve: "csapolt", house: true, sizes: [{ label: "0,3 l", price: 1090 }, { label: "0,5 l", price: 1590 }] },
  { id: "monyo-flying", name: "Flying Rabbit", style: "American IPA", brewery: "MONYO Brewing", abv: 6.0, serve: "csapolt", sizes: [{ label: "0,3 l", price: 1190 }, { label: "0,5 l", price: 1690 }] },
  { id: "hedon-apa", name: "Ökör APA", style: "American Pale Ale", brewery: "Hedon Sörfőzde", abv: 5.2, serve: "csapolt", sizes: [{ label: "0,3 l", price: 1090 }, { label: "0,5 l", price: 1590 }] },
  { id: "augustiner", name: "Augustiner Edelstoff", style: "Export Lager", brewery: "Augustiner-Bräu", abv: 5.6, serve: "palackos", sizes: [{ label: "0,5 l", price: 1490 }] },
  { id: "rothaus-stout", name: "Fekete Bárány", style: "Oatmeal Stout", brewery: "Szent András Sörfőzde", abv: 6.8, serve: "palackos", sizes: [{ label: "0,33 l", price: 1390 }] },
];
