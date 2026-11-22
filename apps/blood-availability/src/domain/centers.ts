/**
 * The three centres registered for Araria. e-RaktKosh sometimes omits one of
 * them from `/bloodbanks`, so the sync worker seeds these explicitly rather
 * than relying on the provider to enumerate the district. A centre is only
 * dropped from the public page if it is removed from this list.
 */
export interface RegisteredCentre {
  code: string;
  name: string;
}

export const ARARIA_CENTRES: readonly RegisteredCentre[] = [
  { code: "284908", name: "Ms Lions Blood Centre Forbesganj Araria" },
  { code: "10140", name: "Sadar Hospital Araria" },
  { code: "284905", name: "Ms Lions Blood Centre" },
] as const;

export const REGISTERED_CENTRE_CODES: ReadonlySet<string> = new Set(
  ARARIA_CENTRES.map((center) => center.code)
);
