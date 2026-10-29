import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { collectText, NoticeExtractionService, toLines } from './notice-extraction.service';

const DATA_URL = 'data:image/jpeg;base64,AAAA';

function configWith(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

async function build(values: Record<string, string>): Promise<NoticeExtractionService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [NoticeExtractionService, { provide: ConfigService, useValue: configWith(values) }],
  }).compile();

  return module.get(NoticeExtractionService);
}

describe('NoticeExtractionService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reports itself as unconfigured until an endpoint is set', async () => {
    const service = await build({});

    expect(service.configured).toBe(false);
    await expect(service.extract(DATA_URL)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('forwards the image and the bearer key, then returns one entry per line', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '  रक्तदान शिविर\n\n12 नवंबर 2026  ' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = await build({
      NOTICE_TEXT_EXTRACTION_URL: 'https://ocr.example.gov.in/extract',
      NOTICE_TEXT_EXTRACTION_KEY: 'secret-key',
    });
    const result = await service.extract(DATA_URL, 'hi');

    expect(result.lines).toEqual(['रक्तदान शिविर', '12 नवंबर 2026']);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://ocr.example.gov.in/extract');
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer secret-key');
    expect(JSON.parse(init.body)).toEqual({ image: DATA_URL, language: 'hi' });
  });

  it('sends no authorization header when no key is configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Notice' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = await build({ NOTICE_TEXT_EXTRACTION_URL: 'https://ocr.example.gov.in/x' });
    await service.extract(DATA_URL);

    expect(fetchMock.mock.calls[0][1].headers.authorization).toBeUndefined();
  });

  it('rejects anything that is not an https link or an image data URL', async () => {
    const service = await build({ NOTICE_TEXT_EXTRACTION_URL: 'https://ocr.example.gov.in/x' });

    await expect(service.extract('file:///etc/passwd')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.extract('http://insecure.example/x.jpg')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('turns an empty reading into a clear upstream error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '   ' }),
    }) as unknown as typeof fetch;

    const service = await build({ NOTICE_TEXT_EXTRACTION_URL: 'https://ocr.example.gov.in/x' });

    await expect(service.extract(DATA_URL)).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('does not leak the provider status code to the admin', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const service = await build({ NOTICE_TEXT_EXTRACTION_URL: 'https://ocr.example.gov.in/x' });

    await expect(service.extract(DATA_URL)).rejects.toThrow(
      'The text extraction service rejected that image.'
    );
  });
});

describe('collectText', () => {
  it.each([
    ['a plain text field', { text: 'One' }, 'One'],
    ['a line array', { lines: ['One', 'Two'] }, 'One\nTwo'],
    ['page objects', { pages: [{ text: 'One' }, { text: 'Two' }] }, 'One\nTwo'],
    ['blocks with content', { blocks: [{ content: 'One' }] }, 'One'],
    ['a nested data envelope', { data: { text: 'One' } }, 'One'],
    ['a Google Vision response', { responses: [{ fullTextAnnotation: { text: 'One' } }] }, 'One'],
  ])('reads %s', (_label, payload, expected) => {
    expect(collectText(payload)).toBe(expected);
  });

  it('returns an empty string for shapes it does not know', () => {
    expect(collectText({ unexpected: true })).toBe('');
    expect(collectText(null)).toBe('');
    expect(collectText('One')).toBe('');
  });
});

describe('toLines', () => {
  it('trims and drops blank lines', () => {
    expect(toLines('  a \n\n b  \r\n')).toEqual(['a', 'b']);
  });
});
