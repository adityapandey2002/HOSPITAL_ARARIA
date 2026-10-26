import { render, screen, waitFor } from '@testing-library/react';

import { AdminComplaintsPanel } from './AdminComplaintsPanel';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'ADMIN' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    api: {
      get: jest.fn(),
      patch: jest.fn(),
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { api } = require('@/lib/api') as { api: { get: jest.Mock; patch: jest.Mock } };

const complaint = {
  id: 'complaint-1',
  name: 'Test Complainant',
  email: '',
  phone: '',
  departmentId: 'department-1',
  departmentName: 'General Medicine',
  complaint: 'The pharmacy ran out of my medicine.',
  description: 'The pharmacy ran out of my medicine.',
  complaintStatus: 'SUBMITTED',
  imageUrl: null,
  resolution: null,
  assignedTo: null,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:00:00.000Z',
};

/**
 * Mirrors the payload the backend TransformInterceptor actually sends:
 * the service's `{ data, meta }` is flattened to `{ success, data, meta }`.
 * The regression is that the panel read `data.data` / `data.meta` after
 * `handleApiResponse` had already returned the `data` array.
 */
function backendResponse<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, meta };
}

beforeEach(() => {
  api.get.mockImplementation((url: string) => {
    if (url === '/departments') {
      return Promise.resolve(backendResponse([]));
    }
    if (url === '/complaints/stats') {
      return Promise.resolve(
        backendResponse({
          total: 1,
          byStatus: {
            SUBMITTED: 1,
            UNDER_REVIEW: 0,
            IN_PROGRESS: 0,
            RESOLVED: 0,
            CLOSED: 0,
            REJECTED: 0,
          },
        })
      );
    }
    if (url === '/complaints') {
      return Promise.resolve(
        backendResponse([complaint], {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        })
      );
    }
    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AdminComplaintsPanel', () => {
  it('renders complaints returned by the paginated list endpoint', async () => {
    render(<AdminComplaintsPanel />);

    expect(await screen.findByText('Test Complainant')).toBeInTheDocument();
    expect(screen.queryByText('No complaints found')).not.toBeInTheDocument();
  });

  it('shows the list total from the response meta', async () => {
    render(<AdminComplaintsPanel />);

    await waitFor(() => {
      expect(screen.getByText('1 complaint')).toBeInTheDocument();
    });
  });
});
