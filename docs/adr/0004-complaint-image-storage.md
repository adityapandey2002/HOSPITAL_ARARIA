# 0004 — Complaint photo storage

- Status: Accepted
- Date: 2026-10-26

## Context

Citizens may attach one photo to a complaint. The original implementation in
`ComplaintForm` rendered a preview with `URL.createObjectURL(file)` and then sent
that **same blob URL** to `POST /complaints`. A `blob:` URL is scoped to the
document that created it, so every stored value was dead as soon as the tab
closed. The admin panel rendered `<img src="blob:http://…">` and the browser
reported `net::ERR_FILE_NOT_FOUND` against the blob's UUID.

Two further limits made a real image impossible to store:

- `CreateComplaintDto.imageUrl` capped the string at 2,000 characters, while a
  base64 image needs hundreds of kilobytes.
- The API's JSON parser capped request bodies at 100 kB.

The portal has no object storage configured (no S3/Supabase Storage bucket,
credentials, or upload endpoint), and photos are evidence in a public grievance
flow, so they must survive the request that created them.

## Decision

Store the photo **inline as a base64 data URL** in `grievances.imageUrl`, with
compression done in the browser before submission.

1. `apps/frontend/src/lib/complaint-image.ts` decodes the chosen file, scales the
   long edge to at most 1280 px, flattens transparency to white, re-encodes as
   JPEG, and steps quality (then dimensions) down until the data URL is under
   1,800,000 characters. Originals are capped at 5 MB.
2. The form submits that data URL, never a blob URL.
3. `CreateComplaintDto` accepts only `http(s)://` or
   `data:image/(jpeg|png|webp);base64,` values, up to 2,000,000 characters.
   Anything else is a 400.
4. `POST /api/v1/complaints` alone gets a 2 MB JSON parser; every other route
   keeps the 100 kB ceiling that bounds body-parser decompression work.
5. Read paths run `toDisplayableImageUrl()`, so a legacy `blob:` value is
   returned as `null` instead of a broken image, and the admin card falls back to
   "no photo".

## Consequences

- Photos work with no new infrastructure and no new credentials, and the image
  data stays in the primary Postgres database, which matches the data-residency
  requirement.
- Complaint rows can now be up to ~1.8 MB. The admin list returns each page's
  photos inline (10 rows ≈ up to 1.8 MB per page in the worst case, typically
  a few hundred kB after compression).
- There is no CDN or thumbnail variant: the same bytes are used for the card
  thumbnail and the full-screen viewer.
- Rows written by the old form cannot be recovered; they read as "no photo".
- **Migration path:** `isDisplayableImageUrl()` and the DTO already accept
  `https://` URLs. Moving to object storage later means adding an upload endpoint
  that writes the file and returns its URL, then relaxing the size cap — no
  schema change and no client-visible API change.
