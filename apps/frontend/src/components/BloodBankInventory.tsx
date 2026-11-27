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
  Building2,
  X,
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
import {
  ALL_FILTER,
  buildUnifiedBloodData,
  eraktkoshFacilityId,
  filterUnifiedBloodRows,
  summarizeByBloodGroup,
  type EraktkoshDistrictData,
  type LocalBloodStockItem,
  type StockStatus,
} from '@/lib/blood-availability';

const bloodGroups = Object.values(BloodGroup);
const componentTypes = Object.values(BloodComponentType);

const statusStyles: Record<StockStatus, string> = {
  available: 'bg-success-100 text-success-700',
  low: 'bg-warning-100 text-warning-700',
  critical: 'bg-danger-100 text-danger-700',
};

const statusLabels: Record<StockStatus, string> = {
  available: 'Available',
  low: 'Low Stock',
  critical: 'Critical',
};

const istFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
});
const numberFormatter = new Intl.NumberFormat('en-IN');

/** O-negative is the universal donor group; highlight it so it stands out. */
function groupChipClass(group: BloodGroup): string {
  return group === BloodGroup.O_NEGATIVE ? 'bg-danger-600' : 'bg-primary-600';
}

export function BloodBankInventory() {
  const [localStock, setLocalStock] = useState<LocalBloodStockItem[]>([]);
  const [districtData, setDistrictData] = useState<EraktkoshDistrictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtError, setDistrictError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>(ALL_FILTER);
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_FILTER);
  const [selectedComponent, setSelectedComponent] = useState<string>(ALL_FILTER);
  const [selectedCenterGroups, setSelectedCenterGroups] = useState<Record<string, string>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setDistrictError(null);

    const districtEndpoint = forceRefresh
      ? '/api/blood/araria?refresh=1'
      : '/api/blood/araria';

    const [localResult, districtResult] = await Promise.allSettled([
      api.get<LocalBloodStockItem[]>('/blood-bank', { limit: 100 }),
      fetch(districtEndpoint, { cache: 'no-store' }).then(async (res) => {
        const json = (await res.json()) as {
          success?: boolean;
          data?: EraktkoshDistrictData;
          error?: { message?: string };
        };
        if (!res.ok || !json?.data) {
          throw new Error(
            json?.error?.message || 'District e-RaktKosh data is currently unavailable.'
          );
        }
        return json.data;
      }),
    ]);

    let localOk = false;
    let districtOk = false;

    if (localResult.status === 'fulfilled') {
      try {
        const items = handleApiResponse(localResult.value);
        setLocalStock(Array.isArray(items) ? items : []);
        localOk = true;
      } catch (err) {
        setLocalStock([]);
        setError(err instanceof Error ? err.message : 'Unable to load hospital blood inventory');
      }
    } else {
      setLocalStock([]);
      setError(
        localResult.reason instanceof Error
          ? localResult.reason.message
          : 'Unable to load hospital blood inventory'
      );
    }

    if (districtResult.status === 'fulfilled') {
      const payload = districtResult.value;
      if (payload && Array.isArray(payload.centers)) {
        setDistrictData(payload);
        districtOk = true;
      } else {
        setDistrictData(null);
        setDistrictError('District e-RaktKosh data is currently unavailable.');
      }
    } else {
      setDistrictData(null);
      setDistrictError(
        districtResult.reason instanceof Error
          ? districtResult.reason.message
          : 'District e-RaktKosh data is currently unavailable.'
      );
    }

    if (localOk || districtOk) {
      setError(null);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const { facilities, rows } = useMemo(
    () => buildUnifiedBloodData(localStock, districtData),
    [localStock, districtData]
  );

  // Reset facility filter if the chosen facility disappears after a refresh.
  useEffect(() => {
    if (
      selectedFacility !== ALL_FILTER &&
      !facilities.some((facility) => facility.id === selectedFacility)
    ) {
      setSelectedFacility(ALL_FILTER);
    }
  }, [facilities, selectedFacility]);

  const filtered = useMemo(
    () =>
      filterUnifiedBloodRows(rows, {
        facilityId: selectedFacility,
        bloodGroup: selectedGroup,
        componentType: selectedComponent,
        searchQuery,
      }).sort(
        (a, b) =>
          b.unitsAvailable - a.unitsAvailable ||
          a.facilityName.localeCompare(b.facilityName) ||
          a.groupLabel.localeCompare(b.groupLabel)
      ),
    [rows, selectedFacility, selectedGroup, selectedComponent, searchQuery]
  );

  const summary = useMemo(() => summarizeByBloodGroup(filtered), [filtered]);

  const availableCount = filtered.filter((r) => r.status === 'available').length;
  const lowCount = filtered.filter((r) => r.status === 'low').length;
  const criticalCount = filtered.filter((r) => r.status === 'critical').length;
  const totalUnitsFiltered = filtered.reduce((sum, r) => sum + r.unitsAvailable, 0);

  const hasActiveFilters =
    selectedFacility !== ALL_FILTER ||
    selectedGroup !== ALL_FILTER ||
    selectedComponent !== ALL_FILTER ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSelectedFacility(ALL_FILTER);
    setSelectedGroup(ALL_FILTER);
    setSelectedComponent(ALL_FILTER);
    setSearchQuery('');
  };

  const activeFacilityOption = facilities.find((f) => f.id === selectedFacility) ?? null;

  const visibleCenters = useMemo(() => {
    if (!districtData?.centers) return [];
    if (selectedFacility === ALL_FILTER) return districtData.centers;
    if (!selectedFacility.startsWith('ek:')) return [];
    return districtData.centers.filter((c) => eraktkoshFacilityId(c.id) === selectedFacility);
  }, [districtData, selectedFacility]);

  const reportingCenters = visibleCenters.filter((c) => c.reportStatus === 'reporting');
  const nonReportingCenters = visibleCenters.filter((c) => c.reportStatus === 'no_report');

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Header with Actions */}
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="mb-0.5 text-xl font-bold text-gray-900">
              Live Blood Bank &amp; District Availability
            </h2>
            <p className="text-sm text-gray-600">
              Combined inventory from District Hospital Araria blood bank and Araria district
              blood centres (e-RaktKosh).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {districtData?.freshness && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                e-RaktKosh: <span className="capitalize">{districtData.freshness}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
              <span>Refresh Live</span>
            </button>
            {lastRefresh && (
              <span className="hidden text-xs text-gray-500 sm:block">
                Checked: {lastRefresh.toLocaleTimeString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{facilities.length}</p>
                <p className="text-sm text-gray-500">Facilities Listed</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
                <CheckCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {numberFormatter.format(totalUnitsFiltered)}
                </p>
                <p className="text-sm text-gray-500">
                  Units Shown ({availableCount} in good stock)
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lowCount}</p>
                <p className="text-sm text-gray-500">Low Stock Entries</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100 text-danger-600">
                <Droplet className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                <p className="text-sm text-gray-500">Critical Stock Entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters: Search + Facility + Blood Group + Component */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search facility, group or component..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search blood inventory"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              aria-label="Filter by facility"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={ALL_FILTER}>All Facilities</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                  {facility.reportStatus === 'no_report' ? ' (No report)' : ''}
                </option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              aria-label="Filter by blood group"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={ALL_FILTER}>All Blood Groups</option>
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
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={ALL_FILTER}>All Components</option>
              {componentTypes.map((c) => (
                <option key={c} value={c}>
                  {BLOOD_COMPONENT_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/70 pt-3 text-xs text-gray-600">
              <span>
                Showing <strong>{filtered.length}</strong> stock record
                {filtered.length === 1 ? '' : 's'}
                {activeFacilityOption ? ` for ${activeFacilityOption.name}` : ' across all facilities'}
                .
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-primary-700 hover:bg-primary-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Summary by Blood Group */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Availability by Blood Group</h3>
            <p className="text-xs text-gray-500">
              {activeFacilityOption
                ? `Filtered by facility: ${activeFacilityOption.name}`
                : 'Combined across all reporting facilities — click a group to filter'}
            </p>
          </div>
          {loading && rows.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
              {bloodGroups.map((group) => (
                <div
                  key={group}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="h-7 w-12 rounded-full bg-gray-200" />
                    <span className="h-5 w-16 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-7 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-3.5 w-36 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : !loading && error && districtError && rows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center sm:p-8">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-primary-600" aria-hidden="true" />
              <h4 className="text-base font-semibold text-gray-900">
                Live blood stock is temporarily unreachable
              </h4>
              <p className="mx-auto mt-1 max-w-lg text-sm text-gray-600">
                We could not connect to the hospital blood bank or e-RaktKosh servers right now.
                Please retry or call the District Hospital Araria Blood Bank directly before
                travelling.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void load(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry now
                </button>
                <a
                  href="tel:+916453222102"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4 text-danger-600" aria-hidden="true" />
                  Blood Bank +91-6453-222102
                </a>
              </div>
            </div>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((item) => {
              const isSelected = selectedGroup === item.group;
              return (
                <button
                  key={item.group}
                  type="button"
                  onClick={() =>
                    setSelectedGroup((current) => (current === item.group ? ALL_FILTER : item.group))
                  }
                  aria-pressed={isSelected}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    statusStyles[item.status],
                    isSelected && 'ring-2 ring-primary-600 ring-offset-1'
                  )}
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
                  <p className="text-2xl font-bold text-gray-900">
                    {numberFormatter.format(item.totalUnits)}{' '}
                    {item.totalUnits === 1 ? 'unit' : 'units'}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {item.count > 0
                      ? `Across ${item.count} component${item.count === 1 ? '' : 's'} · ${item.facilityCount} facilit${item.facilityCount === 1 ? 'y' : 'ies'}`
                      : 'No matching stock reported'}
                  </p>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Detailed Unified Stock Table */}
        {!(!loading && error && districtError && rows.length === 0) && (
        <div className="mb-12 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          {loading ? (
            <div className="p-8 text-center" role="status" aria-live="polite">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" />
              <p className="text-gray-500">Loading blood inventory and district availability...</p>
            </div>
          ) : error && rows.length === 0 ? (
            <div className="p-8 text-center" role="alert">
              <AlertCircle className="mx-auto mb-3 h-7 w-7 text-primary-600" />
              <p className="mb-4 text-sm text-gray-700">{error}</p>
              <button
                type="button"
                onClick={() => void load(true)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Try again
              </button>
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'facilityName',
                  header: 'Facility',
                  render: (item) => (
                    <div className="min-w-[180px]">
                      <p className="font-medium text-gray-900">{item.facilityName}</p>
                      <p className="text-xs text-gray-500">
                        {item.source === 'hospital' ? 'Hospital Blood Bank' : 'e-RaktKosh'}
                        {item.facilityCategory ? ` · ${item.facilityCategory}` : ''}
                      </p>
                    </div>
                  ),
                },
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
                    <span className="font-semibold text-gray-900">
                      {numberFormatter.format(item.unitsAvailable)}
                    </span>
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
                      {item.lastUpdated ? istFormatter.format(new Date(item.lastUpdated)) : '—'}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (item) =>
                    item.source === 'eraktkosh' && item.facilityPhone ? (
                      <a
                        href={`tel:${item.facilityPhone}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-danger-600 hover:text-danger-700"
                      >
                        Call
                        <Phone className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : item.status === 'critical' || item.status === 'low' ? (
                      <Link
                        href="/blood-bank/request"
                        className="inline-flex items-center gap-1 text-sm font-medium text-danger-600 hover:text-danger-700"
                      >
                        Request
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    ) : (
                      <Link
                        href="/blood-bank/donate"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Donate
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    ),
                },
              ]}
              data={filtered}
              keyExtractor={(item) => item.id}
              striped
              hoverable
              emptyMessage="No blood stock data matches the selected filters"
            />
          )}
        </div>
        )}

        {/* Merged District e-RaktKosh Centres Breakdown */}
        <div className="mb-12 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Araria District Blood Centres (e-RaktKosh)
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {districtData
                  ? `Checked by us: ${districtData.asOf ? istFormatter.format(new Date(districtData.asOf)) : '—'} · Centre data as of: ${districtData.sourceAsOf ? istFormatter.format(new Date(districtData.sourceAsOf)) : '—'}`
                  : 'District-wide facility reports from e-RaktKosh, Ministry of Health & Family Welfare.'}
              </p>
            </div>
            {districtData && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-white px-3 py-1 border border-gray-200">
                  {districtData.counts.centersReporting} of {districtData.counts.centersListed}{' '}
                  reporting
                </span>
                <span className="rounded-full bg-white px-3 py-1 border border-gray-200">
                  {districtData.counts.totalUnits === null
                    ? '—'
                    : `${numberFormatter.format(districtData.counts.totalUnits)} district units`}
                </span>
              </div>
            )}
          </div>

          {!loading && !districtData ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600">
              {districtError ?? 'District e-RaktKosh availability is currently unavailable.'}{' '}
              <button
                type="button"
                onClick={() => void load(true)}
                className="font-medium text-primary-700 underline"
              >
                Retry
              </button>
            </p>
          ) : (
            <div className="space-y-6">
              {reportingCenters.map((center) => {
                const groups = center.groups;
                const sel =
                  selectedCenterGroups[center.id] ||
                  groups.find((g) => g.hasStock)?.code ||
                  groups[0]?.code;
                const activeGroup = groups.find((g) => g.code === sel) || groups[0];

                return (
                  <div
                    key={center.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-lg font-semibold text-gray-900">{center.name}</h4>
                      <span className="rounded-full bg-danger-50 px-3 py-1 text-sm font-medium text-danger-700">
                        {center.totalUnits === null
                          ? '—'
                          : `${numberFormatter.format(center.totalUnits)} units`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {[center.category, center.address].filter(Boolean).join(' · ')}
                    </p>
                    {center.phone && (
                      <p className="mt-1 text-sm">
                        <a
                          href={`tel:${center.phone}`}
                          className="font-medium text-danger-700 underline"
                        >
                          {center.phone}
                        </a>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Centre updated{' '}
                      {center.sourceEntryAt
                        ? istFormatter.format(new Date(center.sourceEntryAt))
                        : '—'}{' '}
                      · Checked{' '}
                      {center.fetchedAt ? istFormatter.format(new Date(center.fetchedAt)) : '—'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {groups.map((g) => (
                        <button
                          key={g.code}
                          type="button"
                          onClick={() =>
                            setSelectedCenterGroups((current) => ({
                              ...current,
                              [center.id]: g.code,
                            }))
                          }
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            g.code === sel
                              ? 'border-danger-700 bg-danger-700 text-white'
                              : g.hasStock
                                ? 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                                : 'border-gray-200 bg-gray-100 text-gray-500'
                          )}
                        >
                          {g.label} · {numberFormatter.format(g.totalUnits)}
                        </button>
                      ))}
                    </div>

                    {activeGroup && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                              <th className="py-2 pr-3">Component</th>
                              <th className="py-2 pr-3">Units</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeGroup.components.map((comp) => (
                              <tr
                                key={comp.code}
                                className={cn(
                                  'border-b border-gray-50',
                                  comp.status === 'in_stock' && 'bg-success-50/60'
                                )}
                              >
                                <td className="py-1.5 pr-3">
                                  {comp.name}{' '}
                                  <span className="text-gray-400">({comp.shortName})</span>
                                </td>
                                <td className="py-1.5 pr-3 font-medium">
                                  {comp.units === null ? '—' : numberFormatter.format(comp.units)}
                                </td>
                                <td className="py-1.5">
                                  {comp.status === 'in_stock'
                                    ? 'In stock'
                                    : comp.status === 'nil'
                                      ? 'Nil'
                                      : 'Not reported'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {nonReportingCenters.length > 0 && (
                <div>
                  <h4 className="mb-3 text-base font-semibold text-gray-800">
                    Centres without a current stock report
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {nonReportingCenters.map((center) => (
                      <div
                        key={center.id}
                        className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-gray-600"
                      >
                        <h5 className="font-medium text-gray-900">{center.name}</h5>
                        <p className="mt-1 text-sm">
                          Registered on e-RaktKosh without a recent stock update. Call directly to
                          confirm availability.
                        </p>
                        {center.phone && (
                          <p className="mt-1 text-sm">
                            <a
                              href={`tel:${center.phone}`}
                              className="font-medium text-danger-700 underline"
                            >
                              {center.phone}
                            </a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {districtData && visibleCenters.length === 0 && selectedFacility !== ALL_FILTER && (
                <p className="text-sm text-gray-600">
                  Showing District Hospital Araria blood bank above. Switch the facility filter to{' '}
                  <button
                    type="button"
                    onClick={() => setSelectedFacility(ALL_FILTER)}
                    className="font-medium text-primary-700 underline"
                  >
                    All Facilities
                  </button>{' '}
                  to view all Araria district e-RaktKosh blood centres.
                </p>
              )}

              <p className="border-t border-gray-200 pt-3 text-xs text-gray-500">
                Source: District Hospital Araria Blood Bank &amp; e-RaktKosh, Ministry of Health
                &amp; Family Welfare. Stock figures are self-reported — call before travelling.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
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
