/**
 * One place for every facility fact the UI is allowed to state.
 *
 * Honesty rule (docs/UI_OUTLINE_PROMPT.md §9.4): a value that has not been
 * confirmed by the hospital stays `null` and the UI omits the claim instead of
 * guessing. The Stitch bundle disagrees with itself on bed count (150 vs 300),
 * OPD hours (five variants), consultation fee (₹0/₹2/₹5/₹15) and accreditation,
 * so none of those are encoded here until the hospital signs them off.
 *
 * Contact details below were already published by the existing site and are
 * carried over unchanged.
 */

export interface HospitalPhone {
  label: string;
  number: string;
}

export interface HospitalAddress {
  line1: string;
  line2: string;
  city: string;
  district: string;
  state: string;
  pin: string;
  country: string;
}

export interface HospitalConfig {
  name: string;
  shortName: string;
  authority: string;
  department: string;
  address: HospitalAddress;
  receptionPhone: string;
  bloodBankPhone: string;
  email: string;
  emergencyNumbers: HospitalPhone[];
  /** Confirmed by the hospital; `null` hides the row rather than guessing. */
  opdHours: string | null;
  visitingHours: string | null;
  bedCount: number | null;
  registrationFee: string | null;
  /** Only claims backed by a certificate the hospital can produce. */
  accreditations: string[];
  mapsUrl: string | null;
}

export const HOSPITAL: HospitalConfig = {
  name: 'District Hospital Araria',
  shortName: 'DH Araria',
  authority: 'Government of Bihar',
  department: 'Department of Health, Government of Bihar',
  address: {
    line1: 'District Hospital Araria',
    line2: 'Near District Collectorate',
    city: 'Araria',
    district: 'Araria',
    state: 'Bihar',
    pin: '854311',
    country: 'India',
  },
  receptionPhone: '+91-6453-222123',
  bloodBankPhone: '+91-6453-222102',
  email: 'dh.araria@bihar.gov.in',
  emergencyNumbers: [
    { label: 'Ambulance', number: '102' },
    { label: 'Emergency', number: '108' },
  ],
  opdHours: null,
  visitingHours: null,
  bedCount: null,
  registrationFee: null,
  accreditations: [],
  mapsUrl: null,
};

/** `tel:` href that keeps a leading `+` but drops spacing and dashes. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function formatAddress(address: HospitalAddress = HOSPITAL.address): string {
  return `${address.line1}, ${address.line2}, ${address.city}, ${address.state} ${address.pin}`;
}

/** Short one-line address for the utility bar. */
export function shortAddress(address: HospitalAddress = HOSPITAL.address): string {
  return `${address.city}, ${address.state} - ${address.pin}`;
}

export function mapSearchHref(address: HospitalAddress = HOSPITAL.address): string {
  const query = encodeURIComponent(
    `${address.line1}, ${address.line2}, ${address.city}, ${address.state} ${address.pin}`
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
