'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Droplet,
  Heart,
  AlertCircle,
  CheckCircle,
  Search,
  ArrowRight,
  RefreshCw,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import {
  BLOOD_COMPONENT_LABELS,
  BLOOD_GROUP_LABELS,
  BloodComponentType,
  BloodGroup,
} from '@dh-araria/shared/types';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Table } from '@dh-araria/ui/components';

import { api, handleApiResponse } from '@/lib/api';

const ALL = 'All';

const bloodGroups = Object.values(BloodGroup);
const componentTypes = Object.values(BloodComponentType);

/** Unit-count thresholds shared by the summary cards and the table badges. */
const LOW_STOCK_THRESHOLD = 20;
const CRITICAL_STOCK_THRESHOLD = 10;

const statusStyles = {
  available: 'bg-success-100 text-success-700',
  low: 'bg-warning-100 text-warning-700',
  critical: 'bg-danger-100 text-danger-700',
} as const;

const statusLabels = {
  available: 'Available',
  low: 'Low Stock',
  critical: 'Critical',
} as const;

type StockStatus = keyof typeof statusLabels;

interface BloodStockItem {
  id: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsAvailable: number;
  lastUpdated: string;
}

function statusFor(units: number): StockStatus {
  if (units <= CRITICAL_STOCK_THRESHOLD) return 'critical';
  if (units <= LOW_STOCK_THRESHOLD) return 'low';
  return 'available';
}

interface DecoratedStock extends BloodStockItem {
  status: StockStatus;
  groupLabel: string;
  componentLabel: string;
}

interface SummaryCard {
  group: BloodGroup;
  label: string;
  totalUnits: number;
  status: StockStatus;
  count: number;
}

/** O-negative is the universal donor group; highlight it so it stands out. */
function groupChipClass(group: BloodGroup): string {
  return group === BloodGroup.O_NEGATIVE ? 'bg-danger-600' : 'bg-primary-600';
}

export function BloodBankInventory() {
  const [stock, setStock] = useState<BloodStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL);
  const [selectedComponent, setSelectedComponent] = useState<string>(ALL);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<BloodStockItem[]>('/blood-bank', { limit: 100 });
      setStock(handleApiResponse(response));
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load blood inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Decorate the raw API rows with the display status the tables render. */
  const rows = useMemo<DecoratedStock[]>(
    () =>
      stock.map((item) => ({
        ...item,
        status: statusFor(item.unitsAvailable),
        groupLabel: BLOOD_GROUP_LABELS[item.bloodGroup] ?? item.bloodGroup,
        componentLabel: BLOOD_COMPONENT_LABELS[item.componentType] ?? item.componentType,
      })),
    [stock]
  );

  const filtered = useMemo<DecoratedStock[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    return rows.filter((item) => {
      const matchesSearch =
        !query ||
        item.groupLabel.toLowerCase().includes(query) ||
        item.componentLabel.toLowerCase().includes(query);
      const matchesGroup = selectedGroup === ALL || item.bloodGroup === selectedGroup;
      const matchesComponent =
        selectedComponent === ALL || item.componentType === selectedComponent;

      return matchesSearch && matchesGroup && matchesComponent;
    });
  }, [rows, searchQuery, selectedGroup, selectedComponent]);

  const summary = useMemo<SummaryCard[]>(
    () =>
      bloodGroups.map((group) => {
        const groupRows = filtered.filter((item) => item.bloodGroup === group);
        const totalUnits = groupRows.reduce((sum, item) => sum + item.unitsAvailable, 0);
        const status: StockStatus = groupRows.some((r) => r.status === 'critical')
          ? 'critical'
          : groupRows.some((r) => r.status === 'low')
            ? 'low'
            : 'available';

        return {
          group,
          label: BLOOD_GROUP_LABELS[group],
          totalUnits,
          status,
          count: groupRows.length,
        };
      }),
    [filtered]
  );

  const availableCount = rows.filter((r) => r.status === 'available').length;
  const lowCount = rows.filter((r) => r.status === 'low').length;
  const criticalCount = rows.filter((r) => r.status === 'critical').length;

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Header with Actions */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Live Blood Inventory</h2>
            <p className="text-gray-600">Source of truth: District Hospital Araria blood bank</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <span className="hidden text-sm text-gray-500 sm:block">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lowCount}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100 text-danger-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
                <p className="text-sm text-gray-500">Total Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search blood group or component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search blood inventory"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            aria-label="Filter by blood group"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={ALL}>All Blood Groups</option>
            {bloodGroups.map((g) => (
              <option key={g} value={g}>
                {BLOOD_GROUP_LABELS[g]}
              </option>
            ))}
          </select>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            aria-label="Filter by component"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={ALL}>All Components</option>
            {componentTypes.map((c) => (
              <option key={c} value={c}>
                {BLOOD_COMPONENT_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        {/* Summary by Blood Group */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Availability by Blood Group</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.group}
                className={cn('rounded-2xl border p-4 transition-all', statusStyles[item.status])}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-bold text-white',
                      groupChipClass(item.group)
                    )}
                  >
                    {item.label}
                  </span>
                  <Badge variant="outline" className={statusStyles[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.totalUnits} units</p>
                <p className="mt-1 text-sm text-gray-500">
                  Across {item.count} component{item.count === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          {loading ? (
            <div className="p-8 text-center" role="status" aria-live="polite">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" />
              <p className="text-gray-500">Loading blood inventory...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center" role="alert">
              <AlertCircle className="mx-auto mb-4 h-8 w-8 text-danger-600" />
              <p className="mb-4 text-gray-700">{error}</p>
              <button
                onClick={() => void load()}
                className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50"
              >
                Try again
              </button>
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'bloodGroup',
                  header: 'Blood Group',
                  className: 'font-medium',
                  render: (item) => (
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-sm font-bold text-white',
                        groupChipClass(item.bloodGroup)
                      )}
                    >
                      {item.groupLabel}
                    </span>
                  ),
                },
                {
                  key: 'componentType',
                  header: 'Component',
                  render: (item) => <span>{item.componentLabel}</span>,
                },
                {
                  key: 'unitsAvailable',
                  header: 'Units Available',
                  className: 'font-semibold text-right',
                  render: (item) => (
                    <span className="font-semibold text-gray-900">{item.unitsAvailable}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => (
                    <Badge variant="outline" className={statusStyles[item.status]}>
                      {statusLabels[item.status]}
                    </Badge>
                  ),
                },
                {
                  key: 'lastUpdated',
                  header: 'Last Updated',
                  render: (item) => (
                    <span className="text-sm text-gray-500">
                      {new Date(item.lastUpdated).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (item) =>
                    item.status === 'critical' || item.status === 'low' ? (
                      <Link
                        href="/blood-bank/request"
                        className="flex items-center gap-1 text-sm font-medium text-danger-600 hover:text-danger-700"
                      >
                        Request
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <Link
                        href="/blood-bank/donate"
                        className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Donate
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ),
                },
              ]}
              data={filtered}
              keyExtractor={(item) => item.id}
              striped
              hoverable
              emptyMessage="No blood stock data available"
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            href="/blood-bank/donate"
            className="hover:border-danger-200 group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100 text-danger-600 transition-transform group-hover:scale-110">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Donate Blood</h3>
            <p className="mb-4 text-gray-600">
              Register as a voluntary blood donor and help save lives.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-danger-600 transition-all group-hover:gap-2">
              Register Now
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href="/blood-bank/request"
            className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform group-hover:scale-110">
              <Droplet className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Request Blood</h3>
            <p className="mb-4 text-gray-600">
              Submit a blood request for patients. Track status in real-time.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-all group-hover:gap-2">
              Request Blood
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <div className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-secondary-200 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 transition-transform group-hover:scale-110">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Contact Blood Bank</h3>
            <p className="mb-4 text-gray-600">
              Direct contact for urgent blood requirements and queries.
            </p>
            <a
              href="tel:+91-6453-222102"
              className="flex items-center gap-1 text-sm font-medium text-secondary-600 transition-colors hover:text-secondary-700"
            >
              +91-6453-222102
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
