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

jest.mock('@/lib/complaint-image', () => {
  const actual = jest.requireActual('@/lib/complaint-image');
  return {
    ...actual,
    compressImageToDataUrl: jest.fn().mockResolvedValue('data:image/jpeg;base64,uploaded'),
  };
});

const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;

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
  resolution: null as string | null,
  assignedTo: null as string | null,
  createdAt: '2026-10-26T09:00:00.000Z',
  updatedAt: '2026-10-26T09:00:00.000Z',
};

const photoDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface HistoryFixture {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  resolution?: string | null;
  changedByName: string;
  changedByRole?: string | null;
  createdAt: string;
}

type ComplaintFixture = typeof complaint & {
  assignedToName?: string | null;
  history?: HistoryFixture[];
};

const statusHistory: HistoryFixture[] = [
  {
    id: 'history-1',
    fromStatus: null,
    toStatus: 'SUBMITTED',
    resolution: null,
    changedByName: 'Test Complainant',
    changedByRole: null,
    createdAt: '2026-10-26T09:00:00.000Z',
  },
  {
    id: 'history-2',
    fromStatus: 'SUBMITTED',
    toStatus: 'IN_PROGRESS',
    resolution: null,
    changedByName: 'Asha Kumari',
    changedByRole: 'STAFF',
    createdAt: '2026-10-26T10:30:00.000Z',
  },
];

/**
 * Mirrors the payload the backend TransformInterceptor actually sends:
 * the service's `{ data, meta }` is flattened to `{ success, data, meta }`.
 * The regression is that the panel read `data.data` / `data.meta` after
 * `handleApiResponse` had already returned the `data` array.
 */
function backendResponse<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, meta };
}

function mockApi(complaints: ComplaintFixture[] = [complaint]) {
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

  it('shows the full department name in a tag that truncates when space is tight', async () => {
    mockApi([{ ...complaint, departmentName: 'Obstetrics & Gynecology' }]);
    render(<AdminComplaintsPanel />);

    const tag = await screen.findByLabelText('Department: Obstetrics & Gynecology');
    expect(tag).toHaveTextContent('Obstetrics & Gynecology');
    expect(tag).toHaveAttribute('title', 'Obstetrics & Gynecology');

    // The header wraps so the chip gets a readable width instead of being
    // crushed by the status badge; the chip then truncates rather than
    // crossing into the badge or the card edge.
    expect(tag.parentElement).toHaveClass('flex-wrap');
    expect(tag).toHaveClass('min-w-0', 'basis-32');
    expect(within(tag).getByText('Obstetrics & Gynecology')).toHaveClass('truncate', 'min-w-0');

    const card = tag.closest('li');
    expect(card).toHaveClass('min-w-0', 'overflow-hidden');
    expect(within(card as HTMLElement).getByText('Submitted')).toHaveClass('shrink-0');
  });

  it('lays complaints out as a responsive card grid', async () => {
    render(<AdminComplaintsPanel />);

    const list = await screen.findByRole('list', { name: /complaints/i });
    expect(list).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    expect(list).toHaveClass('2xl:grid-cols-5');
  });

  it('shows who last moved a complaint and the full status trail', async () => {
    mockApi([
      {
        ...complaint,
        complaintStatus: 'IN_PROGRESS',
        assignedTo: 'staff-1',
        assignedToName: 'Asha Kumari',
        history: statusHistory,
      },
    ]);
    render(<AdminComplaintsPanel />);

    expect(await screen.findByText(/by Asha Kumari/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Status history (2)'));

    const trail = screen.getByText('Submitted → In Progress').closest('ol');
    expect(trail).not.toBeNull();

    // The initial citizen submission is part of the trail too.
    expect(within(trail as HTMLElement).getByText('Submitted')).toBeInTheDocument();
    expect(within(trail as HTMLElement).getByText(/Asha Kumari · STAFF/)).toBeInTheDocument();
  });

  it('shows no photo for a dead blob reference stored by the old form', async () => {
    mockApi([
      {
        ...complaint,
        imageUrl: 'blob:http://localhost:3000/4c2da3ca-ad2d-4ac6-8356-1ce73c12eb28',
      },
    ]);
    render(<AdminComplaintsPanel />);

    expect(await screen.findByText('Test Complainant')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view photo attached/i })).not.toBeInTheDocument();
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

  it('lets an admin attach a photo to an existing complaint', async () => {
    mockApi();
    mockPatch.mockResolvedValueOnce(
      backendResponse({ ...complaint, imageUrl: 'data:image/jpeg;base64,uploaded' })
    );
    render(<AdminComplaintsPanel />);

    const input = await screen.findByLabelText('Add photo');
    const file = new File(['x'.repeat(128)], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith('/complaints/complaint-1/photo', {
        imageUrl: 'data:image/jpeg;base64,uploaded',
      })
    );

    expect(
      await screen.findByRole('button', {
        name: /view photo attached to complaint by test complainant/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Replace photo')).toBeInTheDocument();
  });
});
