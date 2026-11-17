import { z } from "zod";

/** Shape of one record from /eraktkosh/blood-availability. */
export const availabilityRecordSchema = z
  .object({
    hospitalname: z.string(),
    hospitaladd: z.string().nullish(),
    hospitalcontact: z.string().nullish(),
    hospitalCode: z.union([z.string(), z.number()]).transform(String),
    hospitalType: z.string().nullish(),
    entrydate: z.string().nullish(),
    offline: z.union([z.string(), z.number()]).nullish(),
    components: z
      .record(
        z.object({
          available_WithQty: z.string().nullish(),
          not_available_WithQty: z.string().nullish(),
        })
      )
      .nullish(),
  })
  .passthrough();

export type RawAvailabilityRecord = z.infer<typeof availabilityRecordSchema>;

export const availabilityResponseSchema = z.array(availabilityRecordSchema);

export const centerSchema = z
  .object({
    hospitalCode: z.union([z.string(), z.number()]).transform(String),
    hospitalName: z.string(),
    mobileNo: z.union([z.string(), z.number()]).nullish(),
  })
  .passthrough();

export type RawCenter = z.infer<typeof centerSchema>;

export const centersResponseSchema = z.array(centerSchema);

/** Provider payloads that fail here are a failed sync, not an empty district. */
export class ProviderSchemaError extends Error {
  readonly issues: unknown;

  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "ProviderSchemaError";
    this.issues = issues;
  }
}

export function parseCenters(payload: unknown): RawCenter[] {
  const parsed = centersResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ProviderSchemaError("Unexpected /bloodbanks payload", parsed.error.issues);
  }
  return parsed.data;
}

export function parseAvailability(payload: unknown): RawAvailabilityRecord[] {
  const parsed = availabilityResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ProviderSchemaError("Unexpected /blood-availability payload", parsed.error.issues);
  }
  return parsed.data;
}
