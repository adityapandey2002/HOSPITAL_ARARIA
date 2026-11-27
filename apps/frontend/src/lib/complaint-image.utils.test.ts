import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_COMPLAINTS_PAGE_LIMITS,
  COMPLAINT_PHOTO_PRESETS,
  DEFAULT_ADMIN_COMPLAINTS_LIMIT,
  MAX_ADMIN_COMPLAINTS_LIMIT,
  MAX_SOURCE_IMAGE_BYTES,
  clampComplaintPageLimit,
  estimateDataUrlBytes,
  formatBytes,
  formatCompressionSummary,
  isDisplayableImageUrl,
  validateImageFile,
} from './complaint-image';

test('COMPLAINT_PHOTO_PRESETS keep compact smaller than balanced and well below DTO ceiling', () => {
  assert.ok(COMPLAINT_PHOTO_PRESETS.compact.maxLength < COMPLAINT_PHOTO_PRESETS.balanced.maxLength);
  assert.ok(COMPLAINT_PHOTO_PRESETS.compact.maxEdge < COMPLAINT_PHOTO_PRESETS.balanced.maxEdge);
  assert.ok(COMPLAINT_PHOTO_PRESETS.balanced.maxLength < 500_000);
});

test('estimateDataUrlBytes accounts for base64 payload and padding', () => {
  // "Hello" in base64 is "SGVsbG8=" -> 5 bytes
  assert.equal(estimateDataUrlBytes('data:image/jpeg;base64,SGVsbG8='), 5);
  // "Hi" in base64 is "SGk=" -> 2 bytes
  assert.equal(estimateDataUrlBytes('data:image/jpeg;base64,SGk='), 2);
  // "Man" in base64 is "TWFu" -> 3 bytes
  assert.equal(estimateDataUrlBytes('data:image/jpeg;base64,TWFu'), 3);
  // Non-data URL falls back to string length
  assert.equal(estimateDataUrlBytes('https://example.com/a.jpg'), 25);
});

test('formatBytes formats bytes, kilobytes, and megabytes cleanly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(150 * 1024), '150 KB');
  assert.equal(formatBytes(2.4 * 1024 * 1024), '2.4 MB');
});

test('formatCompressionSummary reports reduction percentage when compressed', () => {
  const payload = 'A'.repeat(160_000); // ~120 KB binary
  const summary = formatCompressionSummary(2 * 1024 * 1024, `data:image/jpeg;base64,${payload}`);
  assert.match(summary, /^2\.0 MB → 117 KB \(94% smaller\)$/);

  const tinySummary = formatCompressionSummary(8, 'data:image/jpeg;base64,AAAAAAAAAAAA');
  assert.equal(tinySummary, 'Optimised (9 B)');
});

test('clampComplaintPageLimit enforces safe admin page size bounds', () => {
  assert.equal(DEFAULT_ADMIN_COMPLAINTS_LIMIT, 6);
  assert.ok(ADMIN_COMPLAINTS_PAGE_LIMITS.includes(DEFAULT_ADMIN_COMPLAINTS_LIMIT));
  assert.equal(clampComplaintPageLimit(6), 6);
  assert.equal(clampComplaintPageLimit(15), 15);
  assert.equal(clampComplaintPageLimit(100), MAX_ADMIN_COMPLAINTS_LIMIT);
  assert.equal(clampComplaintPageLimit(0), DEFAULT_ADMIN_COMPLAINTS_LIMIT);
  assert.equal(clampComplaintPageLimit(-5), DEFAULT_ADMIN_COMPLAINTS_LIMIT);
  assert.equal(clampComplaintPageLimit(Number.NaN), DEFAULT_ADMIN_COMPLAINTS_LIMIT);
});

test('validateImageFile and isDisplayableImageUrl enforce file and URL guards', () => {
  assert.equal(validateImageFile({ type: 'image/jpeg', size: 1024 }), null);
  assert.match(validateImageFile({ type: 'application/pdf', size: 1024 }) ?? '', /JPEG, PNG or WebP/);
  assert.match(validateImageFile({ type: 'image/jpeg', size: MAX_SOURCE_IMAGE_BYTES + 1 }) ?? '', /5 MB/);
  assert.match(validateImageFile({ type: 'image/jpeg', size: 0 }) ?? '', /empty/);

  assert.equal(isDisplayableImageUrl('data:image/jpeg;base64,abc'), true);
  assert.equal(isDisplayableImageUrl('blob:http://localhost:3000/dead'), false);
  assert.equal(isDisplayableImageUrl(null), false);
});
