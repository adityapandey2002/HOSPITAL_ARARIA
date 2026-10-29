'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, Check, ImagePlus, Loader2, Plus, ScanText, Trash2, X } from 'lucide-react';
import { Button, Card, Input, Select, Textarea } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { compressImageToDataUrl, validateImageFile } from '@/lib/complaint-image';
import { toast } from 'sonner';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPublished: boolean;
  publishedAt?: string | null;
}

interface AttachedScan {
  id: string;
  name: string;
  dataUrl: string;
}

type ExtractionLanguage = 'auto' | 'en' | 'hi';

interface ExtractionState {
  scanId: string;
  status: 'running' | 'ready' | 'failed';
  lines: string[];
  /** Set when the provider is not connected yet, so the panel can explain it. */
  message?: string;
  added: string[];
}

/** Three scans per notice keeps the JSON body inside the 4 MB route limit. */
const MAX_SCANS = 3;

/** Smaller than the complaint default: three of these travel in one request. */
const SCAN_MAX_DATA_URL_LENGTH = 900_000;

const CATEGORY_OPTIONS = [
  'GENERAL',
  'RECRUITMENT',
  'TENDER',
  'PUBLIC_HEALTH',
  'SCHEDULE_CHANGE',
  'EMERGENCY',
].map((value) => ({ value, label: value.replaceAll('_', ' ') }));

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => ({
  value,
  label: value,
}));

const LANGUAGE_OPTIONS: Array<{ value: ExtractionLanguage; label: string }> = [
  { value: 'auto', label: 'Detect language' },
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
];

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [scans, setScans] = useState<AttachedScan[]>([]);
  const [preparingScan, setPreparingScan] = useState(false);
  const [language, setLanguage] = useState<ExtractionLanguage>('auto');
  const [extraction, setExtraction] = useState<ExtractionState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/notices');
      const data = handleApiResponse(res);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setNotices(list as Notice[]);
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetDraft = () => {
    setTitle('');
    setContent('');
    setScans([]);
    setExtraction(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const room = MAX_SCANS - scans.length;
    if (room <= 0) {
      toast.error(`A notice can carry ${MAX_SCANS} scans.`);
      event.target.value = '';
      return;
    }

    setPreparingScan(true);
    const next: AttachedScan[] = [];

    for (const file of files.slice(0, room)) {
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }

      try {
        const dataUrl = await compressImageToDataUrl(file, {
          maxLength: SCAN_MAX_DATA_URL_LENGTH,
        });
        next.push({ id: `${file.name}-${next.length}-${Date.now()}`, name: file.name, dataUrl });
      } catch (error: any) {
        toast.error(error?.message || 'Could not read that image.');
      }
    }

    if (files.length > room) {
      toast.error(`Only ${MAX_SCANS} scans fit on one notice.`);
    }

    if (next.length > 0) setScans((current) => [...current, ...next]);
    setPreparingScan(false);
    event.target.value = '';
  };

  const removeScan = (id: string) => {
    setScans((current) => current.filter((scan) => scan.id !== id));
    setExtraction((current) => (current?.scanId === id ? null : current));
  };

  const extractScan = async (scan: AttachedScan) => {
    setExtraction({ scanId: scan.id, status: 'running', lines: [], added: [] });

    try {
      const res = await api.post<{ text: string; lines: string[] }>('/notices/extract-text', {
        image: scan.dataUrl,
        language,
      });
      const result = handleApiResponse(res);
      const lines = result?.lines?.length ? result.lines : (result?.text ?? '').split(/\r?\n/);

      setExtraction({
        scanId: scan.id,
        status: 'ready',
        lines: lines.map((line) => line.trim()).filter(Boolean),
        added: [],
      });
    } catch (error: any) {
      setExtraction({
        scanId: scan.id,
        status: 'failed',
        lines: [],
        message: error?.message || 'Could not read that image.',
        added: [],
      });
    }
  };

  const addToContent = (line: string) => {
    setContent((current) => (current.trim() ? `${current.trimEnd()}\n\n${line}` : line));
    setExtraction((current) =>
      current ? { ...current, added: [...current.added, line] } : current
    );
  };

  const addAllLines = () => {
    if (!extraction || extraction.lines.length === 0) return;
    const pending = extraction.lines.filter((line) => !extraction.added.includes(line));
    if (pending.length === 0) return;

    setContent((current) => {
      const base = current.trimEnd();
      return base ? `${base}\n\n${pending.join('\n\n')}` : pending.join('\n\n');
    });
    setExtraction({ ...extraction, added: [...extraction.added, ...pending] });
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/notices', {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        isPublished: false,
        ...(scans.length > 0 ? { imageUrls: scans.map((scan) => scan.dataUrl) } : {}),
      });
      toast.success('Notice saved as a draft');
      resetDraft();
      await load();
    } catch (error: any) {
      toast.error('Failed to create notice', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (notice: Notice) => {
    try {
      await api.put(`/notices/${notice.id}`, { isPublished: !notice.isPublished });
      await load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      toast.success('Deleted');
      await load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const extractingScanId = extraction?.status === 'running' ? extraction.scanId : null;
  const extractionScan = extraction ? scans.find((scan) => scan.id === extraction.scanId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Notices</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Draft a notice, attach the scanned order, and pull its text in with the “Read text”
          button.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={create} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            hint="Text you add from a scan is appended here, ready to edit."
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORY_OPTIONS}
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={PRIORITY_OPTIONS}
            />
          </div>

          <section className="rounded-xl border border-outline-variant bg-surface-low/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-on-surface">Scanned pages</h2>
                <p className="text-xs text-on-surface-variant">
                  Attach up to {MAX_SCANS} images. Only admins can read text out of them.
                </p>
              </div>
              <Select
                label="Scan language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as ExtractionLanguage)}
                options={LANGUAGE_OPTIONS}
                className="w-full sm:w-48"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id="notice-scans"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleScanPick}
                className="sr-only"
                disabled={preparingScan || scans.length >= MAX_SCANS}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={preparingScan}
                disabled={scans.length >= MAX_SCANS}
              >
                <ImagePlus className="h-4 w-4" />
                Add image
              </Button>
              <span className="text-xs text-on-surface-variant">
                JPEG, PNG or WebP · up to 5 MB each
              </span>
            </div>

            {scans.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {scans.map((scan) => (
                  <li
                    key={scan.id}
                    className="overflow-hidden rounded-lg border border-outline-variant bg-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scan.dataUrl} alt={scan.name} className="h-28 w-full object-cover" />
                    <div className="space-y-2 p-2">
                      <p className="truncate text-xs text-on-surface-variant" title={scan.name}>
                        {scan.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void extractScan(scan)}
                          loading={extractingScanId === scan.id}
                          disabled={preparingScan}
                        >
                          <ScanText className="h-4 w-4" />
                          Read text
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => removeScan(scan.id)}
                          aria-label={`Remove ${scan.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {extraction && (
              <div className="mt-4 rounded-lg border border-outline-variant bg-card p-3">
                {extraction.status === 'running' && (
                  <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Reading {extractionScan?.name ?? 'the scan'}…
                  </p>
                )}

                {extraction.status === 'failed' && (
                  <div className="flex items-start gap-2 text-sm text-danger-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>{extraction.message}</p>
                  </div>
                )}

                {extraction.status === 'ready' && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-on-surface">
                        Found {extraction.lines.length}{' '}
                        {extraction.lines.length === 1 ? 'line' : 'lines'} — add what you need
                      </h3>
                      <Button type="button" size="sm" onClick={addAllLines}>
                        <Plus className="h-3.5 w-3.5" />
                        Add all
                      </Button>
                    </div>
                    <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                      {extraction.lines.map((line) => {
                        const added = extraction.added.includes(line);
                        return (
                          <li
                            key={`${line}-${extraction.lines.indexOf(line)}`}
                            className="flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-low/60 p-2"
                          >
                            <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-on-surface">
                              {line}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant={added ? 'outline' : 'primary'}
                              onClick={() => addToContent(line)}
                              disabled={added}
                              aria-label={added ? 'Already added' : 'Add this line to the content'}
                            >
                              {added ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                              {added ? 'Added' : 'Add'}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={saving}>
              Create draft
            </Button>
            {scans.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setScans([])}>
                <X className="h-4 w-4" />
                Clear scans
              </Button>
            )}
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Card key={notice.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-on-surface-variant">
                    {notice.category} · {notice.priority}
                  </p>
                  <h2 className="font-semibold text-on-surface">{notice.title}</h2>
                  <p className="line-clamp-2 text-sm text-on-surface-variant">{notice.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(notice)}>
                    {notice.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(notice.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {notices.length === 0 && <p className="text-on-surface-variant">No notices.</p>}
        </div>
      )}
    </div>
  );
}
