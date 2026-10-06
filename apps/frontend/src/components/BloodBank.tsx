import { Droplet, Heart, AlertCircle, CheckCircle, Clock, MapPin, Phone, ArrowRight, Info } from 'lucide-react';
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
    <div className="py-20 bg-red-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Droplet className="w-8 h-8 text-red-600" />
              Blood Bank Inventory
            </h2>
            <p className="text-lg text-gray-600">
              Real-time blood availability integrated with e-RaktKosh
            </p>
          </div>
          <Link
            href="/blood-bank"
            className="inline-flex items-center gap-2 text-red-600 font-medium hover:text-red-700 transition-colors"
          >
            View Full Inventory
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Blood Stock Table */}
        <div className="overflow-x-auto rounded-2xl bg-white border border-gray-100 shadow-sm">
          <table className="w-full">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Units Available</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bloodStock.map((item, index) => {
                const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];

                return (
                <tr key={`${item.group}-${item.component}`} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                        item.group.includes('-') ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
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
                    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full px-2.5 py-1 text-sm border ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusLabels[item.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href="/blood-bank"
                      className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      Request
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <Link
            href="/blood-bank/donate"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Donate Blood</h3>
            <p className="text-gray-600 mb-4">Register as a blood donor and save lives. Quick and easy process.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 group-hover:gap-2 transition-all">
              Register Now
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/blood-bank/request"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Blood</h3>
            <p className="text-gray-600 mb-4">Submit a blood request for patients. Track status in real-time.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
              Request Blood
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Blood Bank</h3>
            <p className="text-gray-600 mb-4">Direct contact for urgent blood requirements and queries.</p>
            <a href="tel:+91-6453-222102" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
              +91-6453-222102
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Blood Compatibility Info */}
        <div className="mt-16 p-6 bg-white rounded-2xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Blood Group Compatibility Quick Reference
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Your Blood Group</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Can Receive From</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Can Donate To</th>
                </tr>
              </thead>
              <tbody>
                {bloodGroups.map((bg) => (
                  <tr key={bg.group} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full font-bold text-white text-sm ${
                        bg.group.includes('-') ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
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