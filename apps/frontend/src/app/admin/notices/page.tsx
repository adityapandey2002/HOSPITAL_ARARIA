'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Card, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
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

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/notices');
      const data = handleApiResponse(res);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setNotices(list as Notice[]);
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/notices', { title: title.trim(), content: content.trim(), category, priority, isPublished: false });
      toast.success('Notice created');
      setTitle(''); setContent('');
      await load();
    } catch {
      toast.error('Failed to create notice');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (n: Notice) => {
    try {
      await api.put(`/notices/${n.id}`, { isPublished: !n.isPublished });
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Notices</h1>
      <Card className="p-6">
        <form onSubmit={create} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Content" value={content} onChange={(e) => setContent(e.target.value)} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}
              options={['GENERAL','RECRUITMENT','TENDER','PUBLIC_HEALTH','SCHEDULE_CHANGE','EMERGENCY'].map((v) => ({ value: v, label: v }))} />
            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}
              options={['LOW','MEDIUM','HIGH','CRITICAL'].map((v) => ({ value: v, label: v }))} />
          </div>
          <Button type="submit" loading={saving}>Create draft</Button>
        </form>
      </Card>
      {loading ? <p className="text-on-surface-variant">Loading…</p> : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-on-surface-variant">{n.category} · {n.priority}</p>
                  <h2 className="font-semibold text-on-surface">{n.title}</h2>
                  <p className="text-sm text-on-surface-variant line-clamp-2">{n.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(n)}>
                    {n.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(n.id)}>Delete</Button>
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
