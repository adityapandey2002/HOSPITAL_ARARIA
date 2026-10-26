import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { api } from '@/lib/api';

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

const mockGet = api.get as jest.Mock;

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
  imageUrl: null as string | null,
  resolution: null,
  assignedTo: null,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:00:00.000Z',
};

const photoDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * Mirrors the payload the backend TransformInterceptor actually sends:
 * the service's `{ data, meta }` is flattened to `{ success, data, meta }`.
 * The regression is that the panel read `data.data` / `data.meta` after
 * `handleApiResponse` had already returned the `data` array.
 */
function backendResponse<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, meta };
}

function mockApi(complaints: (typeof complaint)[] = [complaint]) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/departments') {
      return Promise.resolve(backendResponse([]));
    }
    if (url === '/complaints/stats') {
      return Promise.resolve(
        backendResponse({
          total: complaints.length,
          byStatus: {
            SUBMITTED: complaints.length,
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
        backendResponse(complaints, {
          page: 1,
          limit: 10,
          total: complaints.length,
          totalPages: 1,
        })
      );
    }
    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });
}

beforeEach(() => {
  mockApi();
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

  it('shows the department as a short tag with the full name on hover', async () => {
    render(<AdminComplaintsPanel />);

    const tag = await screen.findByLabelText('Department: General Medicine');
    expect(tag).toHaveTextContent('GM');
    expect(tag).toHaveAttribute('title', 'General Medicine');
  });

  it('lays complaints out as a responsive card grid', async () => {
    render(<AdminComplaintsPanel />);

    const list = await screen.findByRole('list', { name: /complaints/i });
    expect(list).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    expect(list).toHaveClass('2xl:grid-cols-5');
  });

  it('shows the attached photo and opens it in a full-screen viewer', async () => {
    mockApi([{ ...complaint, imageUrl: photoDataUrl }]);
    render(<AdminComplaintsPanel />);

    const thumbnail = await screen.findByRole('img', {
      name: /photo attached to complaint by test complainant/i,
    });
    expect(thumbnail).toHaveAttribute('src', photoDataUrl);

    fireEvent.click(
      screen.getByRole('button', { name: /view photo attached to complaint by test complainant/i })
    );

    const dialog = await screen.findByRole('dialog', { name: /complaint photo/i });
    expect(
      within(dialog).getByRole('img', {
        name: /photo attached to complaint by test complainant/i,
      })
    ).toHaveAttribute('src', photoDataUrl);

    fireEvent.click(within(dialog).getByRole('button', { name: /close photo/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /complaint photo/i })).not.toBeInTheDocument();
    });
  });
});
