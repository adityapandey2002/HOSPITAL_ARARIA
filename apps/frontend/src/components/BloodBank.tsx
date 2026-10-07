import {
  Droplet,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  Info,
} from 'lucide-react';
import Link from 'next/link';

const bloodStock = [
  { group: 'A+', component: 'Whole Blood', units: 45, status: 'available' },
  { group: 'A-', component: 'Whole Blood', units: 12, status: 'low' },
  { group: 'B+', component: 'Whole Blood', units: 38, status: 'available' },
  { group: 'B-', component: 'Whole Blood', units: 8, status: 'critical' },
  { group: 'AB+', component: 'Whole Blood', units: 22, status: 'available' },
  { group: 'AB-', component: 'Whole Blood', units: 5, status: 'critical' },
  { group: 'O+', component: 'Whole Blood', units: 52, status: 'available' },
  { group: 'O-', component: 'Whole Blood', units: 15, status: 'low' },
];

const bloodGroups = [
  { group: 'A+', rh: 'Positive', compatible: ['A+', 'AB+'] },
  { group: 'A-', rh: 'Negative', compatible: ['A+', 'A-', 'AB+', 'AB-'] },
  { group: 'B+', rh: 'Positive', compatible: ['B+', 'AB+'] },
  { group: 'B-', rh: 'Negative', compatible: ['B+', 'B-', 'AB+', 'AB-'] },
  { group: 'AB+', rh: 'Positive', compatible: ['AB+'] },
  { group: 'AB-', rh: 'Negative', compatible: ['AB+', 'AB-'] },
  { group: 'O+', rh: 'Positive', compatible: ['A+', 'B+', 'AB+', 'O+'] },
  { group: 'O-', rh: 'Negative', compatible: ['All Blood Groups'] },
];

const statusStyles = {
  available: 'bg-green-100 text-green-700 border-green-300',
  low: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  critical: 'bg-red-100 text-red-700 border-red-300',
};

const statusLabels = {
  available: 'Available',
  low: 'Low Stock',
  critical: 'Critical',
};

const statusIcons = {
  available: CheckCircle,
  low: AlertCircle,
  critical: AlertCircle,
};

export function BloodBank() {
  return (
    <div className="bg-red-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              <Droplet className="h-8 w-8 text-red-600" />
              Blood Bank Inventory
            </h2>
            <p className="text-lg text-gray-600">
              Real-time blood availability integrated with e-RaktKosh
            </p>
          </div>
          <Link
            href="/blood-bank"
            className="inline-flex items-center gap-2 font-medium text-red-600 transition-colors hover:text-red-700"
          >
            View Full Inventory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Blood Stock Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Blood Group
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Component
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Units Available
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bloodStock.map((item, index) => {
                const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];

                return (
                  <tr
                    key={`${item.group}-${item.component}`}
                    className={index % 2 === 0 ? 'bg-gray-50' : ''}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white ${
                            item.group.includes('-') ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                        >
                          {item.group}
                        </div>
                        <span className="font-medium text-gray-900">{item.group}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.component}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{item.units} units</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${statusStyles[item.status as keyof typeof statusStyles]}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href="/blood-bank"
                        className="flex items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                      >
                        Request
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            href="/blood-bank/donate"
            className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-red-200 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-transform group-hover:scale-110">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Donate Blood</h3>
            <p className="mb-4 text-gray-600">
              Register as a blood donor and save lives. Quick and easy process.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 transition-all group-hover:gap-2">
              Register Now
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href="/blood-bank/request"
            className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-red-200 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
              <Droplet className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Request Blood</h3>
            <p className="mb-4 text-gray-600">
              Submit a blood request for patients. Track status in real-time.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-all group-hover:gap-2">
              Request Blood
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <div className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-transform group-hover:scale-110">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Contact Blood Bank</h3>
            <p className="mb-4 text-gray-600">
              Direct contact for urgent blood requirements and queries.
            </p>
            <a
              href="tel:+91-6453-222102"
              className="flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
            >
              +91-6453-222102
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Blood Compatibility Info */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Info className="h-5 w-5 text-blue-600" />
            Blood Group Compatibility Quick Reference
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Your Blood Group
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Can Receive From
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Can Donate To</th>
                </tr>
              </thead>
              <tbody>
                {bloodGroups.map((bg) => (
                  <tr key={bg.group} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold text-white ${
                          bg.group.includes('-') ? 'bg-red-600' : 'bg-blue-600'
                        }`}
                      >
                        {bg.group}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{bg.compatible.join(', ')}</td>
                    <td className="px-4 py-3 text-gray-600">{bg.compatible.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
