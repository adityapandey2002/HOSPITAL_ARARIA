'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Shield, Trash2, Users } from 'lucide-react';
import type { FeedbackAccessGrant, FeedbackScope, User } from '@dh-araria/shared/types';
import { Button, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/feedback';

type ScopeDepartment = FeedbackScope['departments'][number];

interface FeedbackAccessPanelProps {
  departments: ScopeDepartment[];
}

interface GrantGroup {
  userId: string;
  userName: string;
  userEmail: string;
  grants: FeedbackAccessGrant[];
}

/**
 * ADMIN-only grant management. The parent hides this panel for every other
 * role, and the API enforces the same rule server-side.
 */
export function FeedbackAccessPanel({ departments }: FeedbackAccessPanelProps) {
  const [grants, setGrants] = useState<FeedbackAccessGrant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [userId, setUserId] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [grantsResponse, usersResponse] = await Promise.all([
        api.get<FeedbackAccessGrant[]>('/feedback/access'),
        api.get<User[]>('/users', { limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      ]);

      setGrants(handleApiResponse(grantsResponse) ?? []);
      setUsers(handleApiResponse(usersResponse) ?? []);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'We could not load feedback access grants.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPanel();
  }, [loadPanel]);

  const groupedGrants = useMemo<GrantGroup[]>(() => {
    const map = new Map<string, GrantGroup>();

    for (const grant of grants) {
      const existing = map.get(grant.userId);

      if (existing) {
        existing.grants.push(grant);
      } else {
        map.set(grant.userId, {
          userId: grant.userId,
          userName: grant.userName ?? '',
          userEmail: grant.userEmail ?? '',
          grants: [grant],
        });
      }
    }

    const groups = Array.from(map.values());
    for (const group of groups) {
      group.grants.sort((a, b) => (a.departmentName ?? '').localeCompare(b.departmentName ?? ''));
    }

    return groups.sort((a, b) =>
      (a.userName || a.userEmail).localeCompare(b.userName || b.userEmail)
    );
  }, [grants]);

  const toggleDepartment = (id: string) => {
    setSelectedDepartments((current) =>
      current.includes(id)
        ? current.filter((departmentId) => departmentId !== id)
        : [...current, id]
    );
  };

  const handleGrant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setMessage('');

    if (!userId || selectedDepartments.length === 0) {
      setActionError('Select a user and at least one department.');
      return;
    }

    setSaving(true);
    try {
      await api.post<FeedbackAccessGrant[]>('/feedback/access', {
        userId,
        departmentIds: selectedDepartments,
      });

      const count = selectedDepartments.length;
      setMessage(
        `Access granted for ${count} department${count === 1 ? '' : 's'}. The user can now see that feedback.`
      );
      setUserId('');
      setSelectedDepartments([]);

      const refreshed = await api.get<FeedbackAccessGrant[]>('/feedback/access');
      setGrants(handleApiResponse(refreshed) ?? []);
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          'We could not grant access. Please check the selection and try again.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (grant: FeedbackAccessGrant) => {
    const departmentName = grant.departmentName ?? 'this department';
    const personName = grant.userName || grant.userEmail || 'this user';

    if (
      !window.confirm(
        `Revoke feedback access to ${departmentName} for ${personName}? They will no longer see those responses.`
      )
    ) {
      return;
    }

    setRevokingId(grant.id);
    setActionError(null);
    setMessage('');

    try {
      await api.delete<{ deleted: true }>(`/feedback/access/${grant.id}`);
      setGrants((current) => current.filter((item) => item.id !== grant.id));
      setMessage(`Revoked access to ${departmentName} for ${personName}.`);
    } catch (error) {
      setActionError(getErrorMessage(error, 'We could not revoke access. Please try again.'));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <section
      aria-labelledby="feedback-access-heading"
      className="mt-12 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <Shield className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="feedback-access-heading" className="text-xl font-semibold text-gray-900">
            Manage feedback access
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Grant department heads and nodal officers read access to specific departments. Only
            Hospital Managers can manage these grants.
          </p>
        </div>
      </div>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="border-success-200 text-success-800 mt-5 flex items-start gap-2 rounded-xl border bg-success-50 p-3 text-sm"
        >
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="border-danger-200 text-danger-800 mt-5 flex items-start gap-2 rounded-xl border bg-danger-50 p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{actionError}</span>
        </p>
      )}

      {loading ? (
        <div className="mt-6 space-y-4" role="status" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin text-primary-600" aria-hidden="true" />
            Loading access grants…
          </p>
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : loadError ? (
        <div className="border-danger-200 mt-6 rounded-xl border bg-danger-50 p-5" role="alert">
          <p className="text-danger-800 flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{loadError}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-danger-300 mt-4 text-danger-700 hover:bg-danger-100"
            onClick={() => void loadPanel()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <form onSubmit={handleGrant} className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Grant access</h3>

            <Select
              id="feedback-access-user"
              label="User"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setActionError(null);
              }}
              options={users.map((user) => ({
                value: user.id,
                label: `${user.name} (${user.email})`,
              }))}
              placeholder={users.length === 0 ? 'No users available' : 'Select a user'}
              disabled={users.length === 0}
              hint="Only hospital staff accounts need feedback access."
            />

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700">Departments</legend>
              {departments.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  No departments are available to grant.
                </p>
              ) : (
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2">
                  {departments.map((department) => (
                    <label
                      key={department.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(department.id)}
                        onChange={() => toggleDepartment(department.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{department.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <Button
              type="submit"
              loading={saving}
              disabled={!userId || selectedDepartments.length === 0}
              className="w-full sm:w-auto"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Grant access
            </Button>
          </form>

          <div>
            <h3 className="text-base font-semibold text-gray-900">Current grants</h3>

            {groupedGrants.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No department access has been granted yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-4" aria-label="Current feedback access grants">
                {groupedGrants.map((group) => (
                  <li
                    key={group.userId}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="font-medium text-gray-900">
                      {group.userName || group.userEmail || 'Unknown user'}
                    </p>
                    {group.userName && group.userEmail && (
                      <p className="text-sm text-gray-500">{group.userEmail}</p>
                    )}

                    <ul className="mt-3 space-y-2">
                      {group.grants.map((grant) => (
                        <li
                          key={grant.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                        >
                          <span className="text-sm text-gray-700">
                            {grant.departmentName ?? 'Department'}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-danger-300 text-danger-700 hover:bg-danger-50"
                            loading={revokingId === grant.id}
                            disabled={revokingId !== null && revokingId !== grant.id}
                            onClick={() => void handleRevoke(grant)}
                            aria-label={`Revoke ${grant.departmentName ?? 'department'} access for ${
                              group.userName || group.userEmail || 'this user'
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Revoke
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
