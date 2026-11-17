'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Cell = { code: string; name: string; shortName: string; units: number | null; status: 'in_stock' | 'nil' | 'not_reported' };
type Group = { code: string; label: string; totalUnits: number; hasStock: boolean; components: Cell[] };
type Center = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  reportStatus: 'reporting' | 'no_report';
  dataMode: 'live' | 'snapshot' | null;
  sourceEntryAt: string | null;
  fetchedAt: string | null;
  totalUnits: number | null;
  groupsWithStock: string[];
  groups: Group[];
};
type Data = {
  district: { name: string; state: string };
  asOf: string | null;
  sourceAsOf: string | null;
  freshness: string;
  counts: { centersListed: number; centersReporting: number; centersNoReport: number; totalUnits: number | null; groupsWithStock: number };
  centers: Center[];
};

const ist = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
const num = new Intl.NumberFormat('en-IN');

export default function BloodAvailabilityPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Data>('/blood/araria');
      // api.get returns {success, data}; handleApiResponse not applied here
      const payload = (res as any)?.data ?? res;
      setData(payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8 text-center">Loading blood availability…</div>;
  if (error || !data) return <div className="p-8 text-center text-red-600">Could not load data. <button onClick={load} className="underline">Retry</button></div>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm text-gray-500">e-RaktKosh · Blood availability</p>
        <h1 className="text-3xl font-bold">{data.district.name}, {data.district.state}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Checked by us: {data.asOf ? ist.format(new Date(data.asOf)) : '—'} · Centre data as of: {data.sourceAsOf ? ist.format(new Date(data.sourceAsOf)) : '—'}
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{data.freshness}</span>
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Centres listed" value={data.counts.centersListed} />
        <Stat label="Reporting" value={data.counts.centersReporting} />
        <Stat label="Units available" value={data.counts.totalUnits === null ? '—' : num.format(data.counts.totalUnits)} />
        <Stat label="Groups with stock" value={data.counts.groupsWithStock} />
      </section>

      {data.centers.filter(c => c.reportStatus === 'reporting').map((c) => {
        const key = c.id;
        const groups = c.groups;
        const sel = selected[key] || groups.find(g => g.hasStock)?.code || groups[0]?.code;
        const active = groups.find(g => g.code === sel) || groups[0];
        return (
          <section key={c.id} className="mb-8 rounded-xl border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">{c.name}</h2>
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                {c.totalUnits === null ? '—' : num.format(c.totalUnits)} units
              </span>
            </div>
            <p className="text-sm text-gray-600">{c.category} · {c.address}</p>
            {c.phone && <p className="text-sm"><a href={`tel:${c.phone}`} className="text-red-700 underline">{c.phone}</a></p>}
            <p className="text-xs text-gray-500 mt-1">
              Centre updated {c.sourceEntryAt ? ist.format(new Date(c.sourceEntryAt)) : '—'} · Checked {c.fetchedAt ? ist.format(new Date(c.fetchedAt)) : '—'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {groups.map(g => (
                <button
                  key={g.code}
                  onClick={() => setSelected(s => ({ ...s, [key]: g.code }))}
                  className={`rounded-full border px-3 py-1 text-sm ${g.code === sel ? 'bg-red-700 text-white' : g.hasStock ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {g.label} · {num.format(g.totalUnits)}
                </button>
              ))}
            </div>
            {active && (
              <table className="mt-4 w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-1">Component</th><th>Units</th><th>Status</th></tr></thead>
                <tbody>
                  {active.components.map(comp => (
                    <tr key={comp.code} className={comp.status === 'in_stock' ? 'bg-green-50' : ''}>
                      <td className="py-1">{comp.name} <span className="text-gray-400">({comp.shortName})</span></td>
                      <td>{comp.units === null ? '—' : num.format(comp.units)}</td>
                      <td>{comp.status === 'in_stock' ? 'In stock' : comp.status === 'nil' ? 'Nil' : 'Not reported'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}

      {data.centers.filter(c => c.reportStatus === 'no_report').length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">No current stock report</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {data.centers.filter(c => c.reportStatus === 'no_report').map(c => (
              <div key={c.id} className="rounded-xl border border-dashed p-4 text-gray-600">
                <h3 className="font-medium text-gray-800">{c.name}</h3>
                <p className="text-sm">This centre is registered but has not submitted a stock update. Call to confirm availability.</p>
                {c.phone && <p className="text-sm"><a href={`tel:${c.phone}`} className="text-red-700 underline">{c.phone}</a></p>}
                <p className="text-xs text-gray-500 mt-1">Checked by us: {c.fetchedAt ? ist.format(new Date(c.fetchedAt)) : '—'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Coverage</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="py-1">Centre</th><th>Status</th><th>Units</th></tr></thead>
          <tbody>
            {data.centers.map(c => (
              <tr key={c.id}>
                <td className="py-1">{c.name}</td>
                <td>{c.reportStatus === 'reporting' ? 'Reporting' : 'No current report'}</td>
                <td>{c.totalUnits === null ? '—' : num.format(c.totalUnits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="text-xs text-gray-500 border-t pt-4">
        Source: e-RaktKosh, Ministry of Health &amp; Family Welfare. Data is self-reported and may be out of date — call before travelling. Not medical advice.
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
