/**
 * Canonical blood groups and components.
 *
 * The provider identifies these by display name ("A+Ve", "Whole Blood"), so
 * this module is the single translation point. Unknown names are skipped and
 * warned about rather than guessed.
 */

export interface BloodGroup {
  code: string;
  label: string;
  /** Name used by e-RaktKosh. */
  providerName: string;
  sort: number;
}

export interface BloodComponent {
  code: string;
  name: string;
  shortName: string;
  /** Name used by e-RaktKosh. */
  providerName: string;
  sort: number;
}

export const BLOOD_GROUPS: readonly BloodGroup[] = [
  { code: "A+", label: "A+", providerName: "A+Ve", sort: 1 },
  { code: "A-", label: "A−", providerName: "A-Ve", sort: 2 },
  { code: "B+", label: "B+", providerName: "B+Ve", sort: 3 },
  { code: "B-", label: "B−", providerName: "B-Ve", sort: 4 },
  { code: "O+", label: "O+", providerName: "O+Ve", sort: 5 },
  { code: "O-", label: "O−", providerName: "O-Ve", sort: 6 },
  { code: "AB+", label: "AB+", providerName: "AB+Ve", sort: 7 },
  { code: "AB-", label: "AB−", providerName: "AB-Ve", sort: 8 },
  { code: "Oh+", label: "Oh+", providerName: "Oh+VE", sort: 9 },
  { code: "Oh-", label: "Oh−", providerName: "Oh-VE", sort: 10 },
] as const;

export const BLOOD_COMPONENTS: readonly BloodComponent[] = [
  { code: "whole_blood", name: "Whole Blood", shortName: "WB", providerName: "Whole Blood", sort: 10 },
  { code: "packed_red_blood_cells", name: "Packed Red Blood Cells", shortName: "PRBC", providerName: "Packed Red Blood Cells", sort: 20 },
  { code: "fresh_frozen_plasma", name: "Fresh Frozen Plasma", shortName: "FFP", providerName: "Fresh Frozen Plasma", sort: 30 },
  { code: "random_donor_platelets", name: "Random Donor Platelets", shortName: "RPLA", providerName: "Random Donor Platelets", sort: 40 },
  { code: "single_donor_platelet", name: "Single Donor Platelet", shortName: "PLA", providerName: "Single Donor Platelet", sort: 50 },
  { code: "platelet_concentrate", name: "Platelet Concentrate", shortName: "PC", providerName: "Platelet Concentrate", sort: 60 },
  { code: "platelet_rich_plasma", name: "Platelet Rich Plasma", shortName: "PRP", providerName: "Platelet Rich Plasma", sort: 70 },
  { code: "cryoprecipitate", name: "Cryoprecipitate", shortName: "CRYO", providerName: "Cryoprecipitate", sort: 80 },
  { code: "cryo_poor_plasma", name: "Cryo Poor Plasma", shortName: "CPP", providerName: "Cryo Poor Plasma", sort: 90 },
  { code: "plasma", name: "Plasma", shortName: "PLS", providerName: "Plasma", sort: 100 },
  { code: "single_donor_plasma", name: "Single Donor Plasma", shortName: "SDP", providerName: "Single Donor Plasma", sort: 110 },
  { code: "irradiated_rbc", name: "Irradiated RBC", shortName: "IRBC", providerName: "Irradiated RBC", sort: 120 },
  { code: "leukoreduced_rbc", name: "Leukoreduced RBC", shortName: "LRBC", providerName: "Leukoreduced Rbc", sort: 130 },
  { code: "sagm_packed_red_blood_cells", name: "SAGM Packed Red Blood Cells", shortName: "SPRBC", providerName: "Sagm Packed Red Blood Cells", sort: 140 },
] as const;

export const GROUP_BY_PROVIDER_NAME: ReadonlyMap<string, BloodGroup> = new Map(
  BLOOD_GROUPS.map((g) => [normalizeName(g.providerName), g])
);

export const GROUP_BY_CODE: ReadonlyMap<string, BloodGroup> = new Map(
  BLOOD_GROUPS.map((g) => [g.code, g])
);

export const COMPONENT_BY_PROVIDER_NAME: ReadonlyMap<string, BloodComponent> = new Map(
  BLOOD_COMPONENTS.map((c) => [normalizeName(c.providerName), c])
);

export const COMPONENT_BY_CODE: ReadonlyMap<string, BloodComponent> = new Map(
  BLOOD_COMPONENTS.map((c) => [c.code, c])
);

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve a provider group label to a canonical code.
 * Exact names are tried first; the regex is a safety net for spacing/case
 * drift such as "ab - ve".
 */
export function resolveGroupCode(raw: string): string | null {
  const direct = GROUP_BY_PROVIDER_NAME.get(normalizeName(raw));
  if (direct) return direct.code;

  const compact = raw.replace(/\s+/g, "");
  const oh = /^Oh([+-])(?:ve)?$/i.exec(compact);
  if (oh?.[1]) return `Oh${oh[1]}`;

  const abo = /^(A|B|O|AB)([+-])(?:ve)?$/i.exec(compact);
  if (abo?.[1] && abo[2]) return `${abo[1].toUpperCase()}${abo[2]}`;

  return null;
}
