// Content lives in Supabase (taps); see src/server/content.ts.

/** A beer on tap ("Most csapon" on the home page): its name and round logo. */
export interface Tap {
  id: string;
  name: string;
  /** Absolute URL of the uploaded logo. */
  logo: string;
}
