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
    [stock],
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

        return { group, label: BLOOD_GROUP_LABELS[group], totalUnits, status, count: groupRows.length };
      }),
    [filtered],
  );

  const availableCount = rows.filter((r) => r.status === 'available').length;
  const lowCount = rows.filter((r) => r.status === 'low').length;
  const criticalCount = rows.filter((r) => r.status === 'critical').length;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Blood Inventory</h2>
            <p className="text-gray-600">Source of truth: District Hospital Araria blood bank</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <span className="text-sm text-gray-500 hidden sm:block">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success-100 text-success-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning-100 text-warning-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lowCount}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-danger-100 text-danger-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
                <p className="text-sm text-gray-500">Total Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search blood group or component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search blood inventory"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            aria-label="Filter by blood group"
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability by Blood Group</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.map((item) => (
              <div
                key={item.group}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  statusStyles[item.status],
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full font-bold text-white text-sm',
                      groupChipClass(item.group),
                    )}
                  >
                    {item.label}
                  </span>
                  <Badge variant="outline" className={statusStyles[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.totalUnits} units</p>
                <p className="text-sm text-gray-500 mt-1">
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
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading blood inventory...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center" role="alert">
              <AlertCircle className="w-8 h-8 text-danger-600 mx-auto mb-4" />
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={() => void load()}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                        'px-3 py-1 rounded-full font-bold text-white text-sm',
                        groupChipClass(item.bloodGroup),
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
                        className="text-sm font-medium text-danger-600 hover:text-danger-700 flex items-center gap-1"
                      >
                        Request
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link
                        href="/blood-bank/donate"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        Donate
                        <ArrowRight className="w-3 h-3" />
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
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <Link
            href="/blood-bank/donate"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-danger-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-danger-100 text-danger-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Donate Blood</h3>
            <p className="text-gray-600 mb-4">Register as a voluntary blood donor and help save lives.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-danger-600 group-hover:gap-2 transition-all">
              Register Now
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/blood-bank/request"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Blood</h3>
            <p className="text-gray-600 mb-4">Submit a blood request for patients. Track status in real-time.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
              Request Blood
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-secondary-200 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-secondary-100 text-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Blood Bank</h3>
            <p className="text-gray-600 mb-4">Direct contact for urgent blood requirements and queries.</p>
            <a
              href="tel:+91-6453-222102"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-700 flex items-center gap-1 transition-colors"
            >
              +91-6453-222102
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}