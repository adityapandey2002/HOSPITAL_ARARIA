'use client';

import { useState, useEffect } from 'react';
import { 
  Droplet, Heart, AlertCircle, CheckCircle, Clock, 
  MapPin, Phone, ArrowRight, Search, Filter,
  Download, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Table } from '@dh-araria/ui/components';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const componentTypes = ['Whole Blood', 'Packed Red Cells', 'Platelets', 'Plasma', 'Cryoprecipitate'];

const statusStyles = {
  available: 'bg-success-100 text-success-700',
  low: 'bg-warning-100 text-warning-700',
  critical: 'bg-danger-100 text-danger-700',
};

const statusLabels = {
  available: 'Available',
  low: 'Low Stock',
  critical: 'Critical',
};

function generateMockData() {
  const data = [];
  bloodGroups.forEach(group => {
    componentTypes.forEach(component => {
      const units = Math.floor(Math.random() * 50) + 5;
      let status: 'available' | 'low' | 'critical' = 'available';
      if (units <= 10) status = 'critical';
      else if (units <= 20) status = 'low';
      
      data.push({
        id: `${group}-${component}`,
        bloodGroup: group,
        componentType: component,
        unitsAvailable: units,
        status,
        lastUpdated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      });
    });
  });
  return data;
}

export function BloodBankInventory() {
  const [bloodStock, setBloodStock] = useState<BloodStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBloodStock(generateMockData());
      setLoading(false);
      setLastRefresh(new Date());
    }, 500);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setBloodStock(generateMockData());
      setLoading(false);
      setLastRefresh(new Date());
    }, 500);
  };

  const filteredStock = bloodStock.filter(item => {
    const matchesSearch = item.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.componentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || item.bloodGroup === selectedGroup;
    const matchesComponent = selectedComponent === 'All' || item.componentType === selectedComponent;
    return matchesSearch && matchesGroup && matchesComponent;
  });

  const summary = bloodGroups.map(group => {
    const groupData = filteredStock.filter(item => item.bloodGroup === group);
    const totalUnits = groupData.reduce((sum, item) => sum + item.unitsAvailable, 0);
    const hasCritical = groupData.some(item => item.status === 'critical');
    const hasLow = groupData.some(item => item.status === 'low');
    
    let overallStatus: 'available' | 'low' | 'critical' = 'available';
    if (hasCritical) overallStatus = 'critical';
    else if (hasLow) overallStatus = 'low';
    
    return {
      group,
      totalUnits,
      status: overallStatus,
      components: groupData,
    };
  });

  const availableCount = bloodStock.filter(item => item.status === 'available').length;
  const lowCount = bloodStock.filter(item => item.status === 'low').length;
  const criticalCount = bloodStock.filter(item => item.status === 'critical').length;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Blood Inventory</h2>
            <p className="text-gray-600">Data updated via e-RaktKosh integration</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
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
                <p className="text-2xl font-bold text-gray-900">{bloodStock.length}</p>
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
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Blood Groups</option>
            {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Components</option>
            {componentTypes.map(c => <option key={c} value={c}>{c}</option>)}
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
                  statusStyles[item.status as keyof typeof statusStyles]
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'px-3 py-1 rounded-full font-bold text-white text-sm',
                    item.group.includes('-') ? 'bg-danger-600' : 'bg-primary-600'
                  )}>
                    {item.group}
                  </span>
                  <Badge variant="outline" className={statusStyles[item.status as keyof typeof statusStyles]}>
                    {statusLabels[item.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.totalUnits} units</p>
                <p className="text-sm text-gray-500 mt-1">Total across components</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading blood inventory...</p>
            </div>
          ) : (
            <Table
              columns={[
                { key: 'bloodGroup', header: 'Blood Group', className: 'font-medium' },
                { key: 'componentType', header: 'Component' },
                { key: 'unitsAvailable', header: 'Units Available', className: 'font-semibold text-right' },
                { key: 'status', header: 'Status' },
                { key: 'lastUpdated', header: 'Last Updated' },
                { key: 'actions', header: 'Action' },
              ]}
              data={filteredStock}
              keyExtractor={(item) => item.id}
              striped
              hoverable
              emptyMessage="No blood stock data available"
              renderCell={(item, columnKey) => {
                switch (columnKey) {
                  case 'bloodGroup':
                    return (
                      <span className={cn(
                        'px-3 py-1 rounded-full font-bold text-white text-sm',
                        item.bloodGroup.includes('-') ? 'bg-danger-600' : 'bg-primary-600'
                      )}>
                        {item.bloodGroup}
                      </span>
                    );
                  case 'unitsAvailable':
                    return (
                      <span className="font-semibold text-gray-900">{item.unitsAvailable}</span>
                    );
                  case 'status':
                    return (
                      <Badge variant="outline" className={statusStyles[item.status as keyof typeof statusStyles]}>
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </Badge>
                    );
                  case 'lastUpdated':
                    return (
                      <span className="text-sm text-gray-500">
                        {new Date(item.lastUpdated).toLocaleString()}
                      </span>
                    );
                  case 'actions':
                    return (
                      <div className="flex items-center gap-2">
                        {item.status === 'critical' || item.status === 'low' ? (
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
                        )}
                      </div>
                    );
                  default:
                    return item[columnKey as keyof BloodStockItem] as string;
                }
              }}
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
            <a href="tel:+91-6453-222102" className="text-sm font-medium text-secondary-600 hover:text-secondary-700 flex items-center gap-1 transition-colors">
              +91-6453-222102
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

interface BloodStockItem {
  id: string;
  bloodGroup: string;
  componentType: string;
  unitsAvailable: number;
  status: 'available' | 'low' | 'critical';
  lastUpdated: string;
}