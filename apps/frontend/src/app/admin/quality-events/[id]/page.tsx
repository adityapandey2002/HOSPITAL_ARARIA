'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface Task {
  id: string;
  eventId: string;
  departmentId: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
}

export default function QualityEventTasksPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deptNames, setDeptNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        api.get<any[]>(`/quality-events/${eventId}/tasks`),
        api.get<any>('/departments'),
      ]);
      const t = handleApiResponse(tRes) ?? [];
      setTasks(t as Task[]);
      const d = handleApiResponse(dRes);
      const list = Array.isArray(d) ? d : d?.data ?? [];
      const map: Record<string, string> = {};
      for (const dep of list) map[dep.id] = dep.name;
      setDeptNames(map);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (task: Task) => {
    try {
      await api.patch(`/quality-events/${eventId}/tasks/${task.id}`, { isCompleted: !task.isCompleted });
      await load();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    (acc[t.departmentId] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/quality-events" className="text-sm text-primary-700 hover:underline">
          ← Back to events
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-on-surface">Event tasks</h1>
      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-on-surface-variant">No tasks.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([deptId, list]) => (
            <Card key={deptId} className="p-4">
              <h2 className="mb-2 text-lg font-semibold text-on-surface">
                {deptNames[deptId] ?? deptId}
              </h2>
              <ul className="space-y-2">
                {list.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={t.isCompleted}
                      onChange={() => toggle(t)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={t.isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'}>
                      {t.title}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
