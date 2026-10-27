'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

interface QEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  isArchived: boolean;
}

interface ProgressRow {
  departmentId: string;
  departmentName: string;
  total: number;
  completed: number;
}

const EVENT_TYPES = ['NQAS', 'KAYAKALP', 'MUSQAN'];

export default function AdminQualityEventsPage() {
  const [events, setEvents] = useState<QEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('NQAS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/quality-events');
      setEvents(handleApiResponse(res) ?? []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadProgress = async (id: string) => {
    setSelectedEvent(id);
    try {
      const res = await api.get<any>(`/quality-events/${id}/progress`);
      setProgress(handleApiResponse(res) ?? []);
    } catch {
      toast.error('Failed to load progress');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/quality-events', { type, title: title.trim(), description: description.trim() || undefined });
      toast.success('Event launched');
      setTitle('');
      setDescription('');
      await load();
    } catch {
      toast.error('Failed to launch event');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (ev: QEvent) => {
    try {
      await api.patch(`/quality-events/${ev.id}`, { isArchived: !ev.isArchived });
      await load();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Quality events</h1>
        <p className="text-sm text-on-surface-variant">
          Launch NQAS / KAYAKALP / MUSQAN initiatives and track per-department progress.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Event type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" loading={saving}>Launch event</Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-on-surface-variant">No events yet.</p>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <Card key={ev.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-on-surface-variant">{ev.type}</p>
                  <h2 className="text-lg font-semibold text-on-surface">{ev.title}</h2>
                  {ev.description && <p className="text-sm text-on-surface-variant">{ev.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadProgress(ev.id)}>
                    Progress
                  </Button>
                  <Link href={`/admin/quality-events/${ev.id}`} className="text-sm text-primary-700 hover:underline">
                    Tasks
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => toggleArchive(ev)}>
                    {ev.isArchived ? 'Unarchive' : 'Archive'}
                  </Button>
                </div>
              </div>
              {selectedEvent === ev.id && progress.length > 0 && (
                <div className="mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-on-surface-variant">
                        <th className="py-1">Department</th>
                        <th className="py-1">Completed</th>
                        <th className="py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.map((p) => (
                        <tr key={p.departmentId} className="border-t border-outline-variant">
                          <td className="py-1">{p.departmentName}</td>
                          <td className="py-1">{p.completed}</td>
                          <td className="py-1">{p.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
