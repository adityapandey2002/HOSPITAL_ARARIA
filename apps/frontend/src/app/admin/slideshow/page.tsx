'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Card } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

interface Slide {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminSlideshowPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSlideshowImages();
      const data = handleApiResponse(res) ?? [];
      setSlides(data as Slide[]);
    } catch (err) {
      toast.error('Failed to load slideshow images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Image URL is required');
      return;
    }
    setSaving(true);
    try {
      await api.createSlideshowImage({ url: url.trim(), alt: alt.trim() || undefined, caption: caption.trim() || undefined });
      toast.success('Image added');
      setUrl('');
      setAlt('');
      setCaption('');
      await load();
    } catch (err) {
      toast.error('Failed to add image');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (slide: Slide) => {
    try {
      await api.updateSlideshowImage(slide.id, { isActive: !slide.isActive });
      await load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this slideshow image?')) return;
    try {
      await api.deleteSlideshowImage(id);
      toast.success('Deleted');
      await load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Slideshow images</h1>
        <p className="text-sm text-on-surface-variant">
          Add images by URL. They appear on the homepage slideshow in order.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
          <Input label="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
          <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption" />
          <Button type="submit" loading={saving}>Add image</Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : slides.length === 0 ? (
        <p className="text-on-surface-variant">No slideshow images yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slides.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.alt || ''} className="h-40 w-full object-cover" />
              <div className="space-y-2 p-4">
                {s.caption && <p className="text-sm text-on-surface">{s.caption}</p>}
                <p className="text-xs text-on-surface-variant">{s.isActive ? 'Active' : 'Hidden'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                    {s.isActive ? 'Hide' : 'Show'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
