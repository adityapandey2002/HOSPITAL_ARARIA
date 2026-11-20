'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle, Phone } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { Button, Card, Input, Select, Textarea } from '@dh-araria/ui/components';
import { toast } from 'sonner';

interface Submitted {
  reference: string;
  patientName: string;
}

const UNITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => ({ value: String(value), label: String(value) }));

const TODAY = new Date().toISOString().slice(0, 10);

const PHONE_PATTERN = /^(\+91|0)?[6-9]\d{9}$/;

export default function BloodRequestPage() {
  const [bloodGroups, setBloodGroups] = useState<Array<{ value: string; label: string }>>([]);
  const [componentTypes, setComponentTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const [form, setForm] = useState({
    patientName: '',
    requesterName: '',
    phone: '',
    email: '',
    bloodGroup: '',
    componentType: '',
    units: '2',
    neededBy: TODAY,
    hospital: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get<string[]>('/blood-bank/blood-groups'), api.get<string[]>('/blood-bank/component-types')])
      .then(([groups, types]) => {
        const groupValues = handleApiResponse(groups) ?? [];
        const componentValues = handleApiResponse(types) ?? [];
        setBloodGroups(groupValues.map((value) => ({ value, label: value })));
        setComponentTypes(componentValues.map((value) => ({ value, label: value })));
      })
      .catch(() => {
        toast.error('Could not load blood options');
      });
  }, []);

  const validate = (): string | null => {
    if (!form.patientName.trim()) return 'Patient name is required.';
    if (!form.requesterName.trim()) return 'Requester name is required.';
    if (!PHONE_PATTERN.test(form.phone.trim())) {
      return 'Please provide a valid Indian phone number.';
    }
    if (!form.bloodGroup) return 'Select the blood group.';
    if (!form.componentType) return 'Select the component type.';
    if (Number(form.units) < 1) return 'At least one unit is required.';
    if (new Date(form.neededBy).toDateString() === 'Invalid Date') return 'Set a valid date.';
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      const response = await api.post<any>('/blood-bank/requests', {
        patientName: form.patientName.trim(),
        requesterName: form.requesterName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        bloodGroup: form.bloodGroup,
        componentType: form.componentType,
        units: Number(form.units),
        neededBy: form.neededBy,
        hospital: form.hospital.trim() || undefined,
        reason: form.reason.trim() || undefined,
      });
      const created = handleApiResponse(response);
      setSubmitted({ reference: created?.reference, patientName: created?.patientName });
      toast.success('Blood request submitted');
    } catch (error: any) {
      toast.error('Could not submit the request', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-primary-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-on-surface">Request submitted</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Thank you, {submitted.patientName}. Our blood bank team will reach out to check the
            stock.
          </p>
          <p className="mt-3 text-lg font-semibold text-primary-700">{submitted.reference}</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Quote this reference. A confirmation email has been requested; share it with relatives.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/blood-bank" className="text-sm text-primary-600 hover:underline">
              Check current stock
            </Link>
            <Link href="/blood-bank/request" className="text-sm text-primary-600 hover:underline">
              New request
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <section className="bg-danger-600 py-16 text-white sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Phone className="h-8 w-8 text-danger-600 bg-white p-1 rounded-full" aria-hidden="true" />
          </div>
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Request Blood</h1>
          <p className="mx-auto max-w-3xl text-xl text-danger-100">
            Need blood for a patient? Submit the request below and the hospital blood bank team
            will follow up with compatibility and collection instructions.
          </p>
        </div>
      </section>

      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <form onSubmit={(event) => void submit(event)} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Request details</h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Patient name *"
                    value={form.patientName}
                    onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))}
                    hint="Who the blood is needed for."
                    required
                  />
                  <Input
                    label="Requester name *"
                    value={form.requesterName}
                    onChange={(event) => setForm((current) => ({ ...current, requesterName: event.target.value }))}
                    hint="Family member or a relative submitting this request."
                    required
                  />
                  <Input
                    label="Phone *"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+919876543210"
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    hint="Used only for the confirmation."
                  />
                  <Select
                    label="Blood group *"
                    value={form.bloodGroup}
                    onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))}
                    options={bloodGroups.map((group) => ({ value: group.value, label: group.label || group.value }))}
                    placeholder="Select blood group"
                    required
                  />
                  <Select
                    label="Component *"
                    value={form.componentType}
                    onChange={(event) => setForm((current) => ({ ...current, componentType: event.target.value }))}
                    options={componentTypes.map((type) => ({ value: type.value, label: type.label || type.value }))}
                    placeholder="Select component"
                    required
                  />
                  <Select
                    label="Units needed *"
                    value={form.units}
                    onChange={(event) => setForm((current) => ({ ...current, units: event.target.value }))}
                    options={UNITS}
                    required
                  />
                  <Input
                    label="Needed by *"
                    type="date"
                    value={form.neededBy}
                    onChange={(event) => setForm((current) => ({ ...current, neededBy: event.target.value }))}
                    min={TODAY}
                    required
                  />
                </div>

                <Input
                  label="Hospital or ward (optional)"
                  value={form.hospital}
                  onChange={(event) => setForm((current) => ({ ...current, hospital: event.target.value }))}
                  placeholder="Ward B, ICCU"
                  hint="Helps the blood bank prepare the collection."
                />
                <Textarea
                  label="Reason (optional)"
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  rows={3}
                  hint="E.g. &ldquo;Post-transfusion altitude retrieval.&rdquo;"
                />

                <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
                  <p className="mb-1 text-sm font-medium text-danger-700">For emergencies</p>
                  <p className="text-lg font-bold text-danger-800">
                    Call 102 or 108 and the hospital emergency number immediately. Do not wait for
                    a web form.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" loading={saving} disabled={saving}>
                    Submit request
                  </Button>
                  <Link
                    href="/blood-bank"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Check blood availability
                  </Link>
                </div>
              </form>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Blood bank hours: Monday to Saturday, 9:00 AM to 4:00 PM. Emergency services are
              available 24/7.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
