# 0005 — Notice scans and admin text extraction

- Status: Accepted
- Date: 2026-10-29

## Context

The notice desk drafts a notice, then retypes the order it came from. That is
slow, and it is where numbers and dates get transposed. Admins asked for two
things on the draft form:

1. Attach the scanned page(s) to the notice, so the published notice shows the
   order exactly as issued.
2. Pull the text out of a scan and insert the useful lines into the content box
   with an "Add" button.

The OCR/extraction provider has not been chosen yet. The hospital will supply
the endpoint and key later, so the system must work today without one and gain
the feature by setting two environment variables.

As with complaint photos (`docs/adr/0004-complaint-image-storage.md`), the portal
has no object storage and the data-residency rule keeps uploads in the primary
database.

## Decision

### Storage

Add `notices.imageUrls text[]` (default `{}`), holding up to **three** base64
data URLs. The existing `attachmentUrl` column stays for external links.

- The browser compresses each scan with the shared
  `compressImageToDataUrl()` helper, capped at 900,000 characters per image
  (three of those plus JSON overhead stay inside the 4 MB request limit).
- `POST /api/v1/notices`, `PUT|PATCH /api/v1/notices/:id` and
  `POST /api/v1/notices/extract-text` get a 4 MB JSON parser. Every other route
  keeps the 100 kB ceiling. This mirrors the complaint exceptions in
  `src/bootstrap.ts`.
- List queries select an explicit column set that **excludes** `imageUrls`, so
  the public notice board and the admin list stay small. Only `GET /notices/:id`
  returns the scans, and only the notice detail page renders them.
- The detail page filters values through `isDisplayableImageUrl()`, so a legacy
  or hand-edited row cannot render a broken image.

### Extraction

`POST /api/v1/notices/extract-text`, **ADMIN only** (staff can draft, but the
provider is a paid service and its output lands in a publishable notice).

Request:

```json
{ "image": "data:image/jpeg;base64,…", "language": "auto" }
```

`language` is `auto`, `en` or `hi`. `image` must be a base64 data URL
(`jpeg`/`png`/`webp`) or an `https://` link — anything else is a 400.

The backend forwards to `NOTICE_TEXT_EXTRACTION_URL`:

```
POST <NOTICE_TEXT_EXTRACTION_URL>
Authorization: Bearer <NOTICE_TEXT_EXTRACTION_KEY>   (only when set)
{ "image": "<same value>", "language": "auto|en|hi" }
```

Response: `{ "text": string, "lines": string[] }`, where `lines` is the
provider's text split on newlines with blanks and padding removed. To avoid
pinning a vendor, the proxy reads text out of the usual envelopes:
`{ text }`, `{ lines: [] }`, `{ result }`, `{ blocks: [] }`, `{ results: [] }`,
`{ pages: [] }`, `{ data: { text } }` and Google Vision's
`{ responses: [{ fullTextAnnotation: { text } }] }`.

Failure behaviour:

| Situation | Status | Message shown to the admin |
| --- | --- | --- |
| `NOTICE_TEXT_EXTRACTION_URL` unset | 503 | "Notice text extraction is not connected yet…" |
| Provider unreachable / non-2xx | 502 | "The text extraction service could not be reached." |
| Provider returns no text | 502 | "No readable text was found in that image." |
| Bad image value | 400 | Validation message |

The endpoint is admin-only and rate-limited by the existing global limiter; it
does not log image bytes or extracted text.

### Admin form

Each attached scan has a **Read text** button. Results render as one row per
line with an **Add** button (plus **Add all**), which appends to the content
textarea; nothing is inserted without the admin pressing a button.

## Consequences

- Attaching scans works today with no provider configured; only extraction is
  gated, and the form says so instead of failing silently.
- Wiring the real provider is a deployment change (two env vars plus a small
  adapter in `collectText()` if its envelope differs), not a code change in the
  form.
- A published notice can be up to ~2.7 MB of inline images. It is returned only
  by the detail endpoint, and the images are compressed JPEGs, so this matches
  the complaint-photo budget rather than the size of an original scan.
- Moving to object storage later means an upload endpoint that returns URLs:
  `imageUrls` already holds strings and the reader already accepts `https://`.
