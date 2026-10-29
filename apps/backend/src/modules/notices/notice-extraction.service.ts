import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Languages the notice desk actually drafts in. `auto` lets the provider decide. */
export type ExtractionLanguage = 'auto' | 'en' | 'hi';

export interface NoticeExtractionResult {
  /** Whole extracted body, newline separated. */
  text: string;
  /** One entry per detected line, for the per-line "Add" buttons. */
  lines: string[];
}

/** Longest image payload we forward: the 4 MB route ceiling minus JSON overhead. */
const MAX_IMAGE_LENGTH = 3_000_000;

/** Providers can be slow on a full scanned page; fail before the platform does. */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Admin-only proxy between the notice desk and whichever OCR/extraction service
 * the hospital contracts.
 *
 * The provider is not chosen yet, so the contract is deliberately small: POST
 * `{ image, language }` and return text in any of the shapes listed in
 * {@link collectText}. Until `NOTICE_TEXT_EXTRACTION_URL` is set the endpoint
 * answers 503, which the admin form shows as "not connected yet" rather than
 * failing silently.
 */
@Injectable()
export class NoticeExtractionService {
  private readonly logger = new Logger(NoticeExtractionService.name);

  constructor(private readonly config: ConfigService) {}

  /** The admin form asks this before offering the button. */
  get configured(): boolean {
    return Boolean(this.endpoint);
  }

  async extract(
    image: string,
    language: ExtractionLanguage = 'auto'
  ): Promise<NoticeExtractionResult> {
    const endpoint = this.endpoint;
    if (!endpoint) {
      throw new ServiceUnavailableException(
        'Notice text extraction is not connected yet. Set NOTICE_TEXT_EXTRACTION_URL on the backend.'
      );
    }

    const payload = this.assertUsableImage(image);
    const key = this.config.get<string>('NOTICE_TEXT_EXTRACTION_KEY')?.trim();

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(key ? { authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({ image: payload, language }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`Notice extraction request failed: ${(error as Error).message}`);
      throw new BadGatewayException('The text extraction service could not be reached.');
    }

    if (!response.ok) {
      this.logger.warn(`Notice extraction returned HTTP ${response.status}`);
      throw new BadGatewayException('The text extraction service rejected that image.');
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new BadGatewayException('The text extraction service returned an unreadable response.');
    }

    const text = collectText(body).trim();
    if (!text) {
      throw new BadGatewayException('No readable text was found in that image.');
    }

    return { text, lines: toLines(text) };
  }

  private get endpoint(): string | null {
    const url = this.config.get<string>('NOTICE_TEXT_EXTRACTION_URL')?.trim();
    return url ? url : null;
  }

  /**
   * Only data URLs and https links are forwarded: a `file:`/`blob:` value would
   * be meaningless to the provider and a plain-http URL would leak the page.
   */
  private assertUsableImage(image: string): string {
    const value = typeof image === 'string' ? image.trim() : '';

    if (!value) {
      throw new BadRequestException('Choose an image to read.');
    }
    if (value.length > MAX_IMAGE_LENGTH) {
      throw new BadRequestException('That image is too large to read. Attach a smaller scan.');
    }

    const isDataUrl = /^data:image\/(?:jpeg|png|webp);base64,/i.test(value);
    const isHttpsUrl = /^https:\/\/\S+$/i.test(value);
    if (!isDataUrl && !isHttpsUrl) {
      throw new BadRequestException('Images must be a base64 data URL or an https link.');
    }

    return value;
  }
}

/**
 * Reads text out of the common provider envelopes.
 *
 * Every service names the field differently, and the hospital has not picked
 * one yet, so accept the documented shapes and let anything else fall through
 * to an empty string (which the caller turns into a clear 502).
 */
export function collectText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';

  const record = payload as Record<string, unknown>;
  const direct = asText(record.text) || asText(record.lines) || asText(record.result);
  if (direct) return direct;

  // Google Vision: { responses: [{ fullTextAnnotation: { text } }] }
  const annotations = Array.isArray(record.responses)
    ? record.responses
        .map((entry) => asText((entry as Record<string, unknown>)?.fullTextAnnotation))
        .filter(Boolean)
    : [];
  if (annotations.length > 0) return annotations.join('\n\n');

  for (const key of ['blocks', 'results', 'pages', 'data'] as const) {
    const list = record[key];
    if (!Array.isArray(list)) continue;

    const parts = list
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim();
        if (!entry || typeof entry !== 'object') return '';
        const item = entry as Record<string, unknown>;
        return asText(item.text) || asText(item.content) || asText(item.value);
      })
      .filter(Boolean);

    if (parts.length > 0) return parts.join('\n');
  }

  // One level of nesting covers `{ data: { text } }` and `{ result: { text } }`.
  for (const key of ['data', 'result'] as const) {
    const nested = record[key];
    if (nested && typeof nested === 'object') {
      const text = collectText(nested);
      if (text) return text;
    }
  }

  return '';
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean)
      .join('\n');
  }
  // `{ text: '…' }` shows up nested (Vision's fullTextAnnotation, for one).
  if (value && typeof value === 'object') {
    return asText((value as Record<string, unknown>).text);
  }
  return '';
}

/** Trims each line and drops the blank ones so "Add" never inserts empty rows. */
export function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
