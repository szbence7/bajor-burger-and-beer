// The site is one page: these are the home page's sections, addressed as /#id. The old
// subpages (/menu, /galeria, /rolunk, /foglalas) redirect to them.
export const SECTIONS = {
  ajanlat: "Hónap ajánlata",
  etlap: "Étlapok",
  rolunk: "Rólunk",
  hely: "A hely",
  foglalas: "Asztalfoglalás",
  kapcsolat: "Kapcsolat",
} as const;

export type SectionId = keyof typeof SECTIONS;
