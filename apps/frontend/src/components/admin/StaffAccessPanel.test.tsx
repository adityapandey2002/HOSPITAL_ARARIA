import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { api } from '@/lib/api';

import { StaffAccessPanel } from './StaffAccessPanel';

let mockUser: { id: string; role: string } | null = { id: 'admin-1', role: 'ADMIN' };

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
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
      post: jest.fn(),
      patch: jest.fn(),
    },
  };
});

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;

const departments = [
  { id: 'dept-1', name: 'General Medicine', isActive: true },
  { id: 'dept-2', name: 'Emergency Medicine', isActive: true },
];

const staff = [
  {
    id: 'staff-1',
    name: 'Asha Kumari',
    email: 'asha@dhararia.gov.in',
    phone: null,
    role: 'STAFF',
    isActive: true,
    departments: [{ id: 'dept-1', name: 'General Medicine' }],
    createdAt: '2026-10-26T09:00:00.000Z',
  },
];

function backendResponse<T>(data: T) {
  return { success: true, data };
}

function mockApi(staffRows = staff) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/admin/staff') return Promise.resolve(backendResponse(staffRows));
    if (url === '/departments') return Promise.resolve(backendResponse(departments));
    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });
  mockPost.mockResolvedValue(backendResponse({}));
  mockPatch.mockResolvedValue(backendResponse({}));
}

beforeEach(() => {
  mockUser = { id: 'admin-1', role: 'ADMIN' };
  mockApi();
});

afterEach(() => {
  jest.clearAllMocks();
});

async function openCreateForm() {
  render(<StaffAccessPanel />);
  fireEvent.click(await screen.findByRole('button', { name: /add staff member/i }));
  return screen.findByRole('dialog', { name: /add staff member/i });
}

function fillCreateForm({
  name = 'Asha Kumari',
  email = 'asha@dhararia.gov.in',
  password = 'Asha@2026',
} = {}) {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/initial password/i), { target: { value: password } });
}

describe('StaffAccessPanel', () => {
  it('lists staff accounts with the departments they can handle', async () => {
    render(<StaffAccessPanel />);

    expect(await screen.findByText('Asha Kumari')).toBeInTheDocument();
    expect(screen.getByText('asha@dhararia.gov.in')).toBeInTheDocument();
    expect(screen.getByText('General Medicine')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('blocks submission until at least one department is selected', async () => {
    await openCreateForm();
    fillCreateForm();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Select at least one department')).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('posts the new account with its department grants', async () => {
    await openCreateForm();
    fillCreateForm();

    fireEvent.click(screen.getByLabelText('General Medicine'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/admin/staff',
        expect.objectContaining({
          name: 'Asha Kumari',
          email: 'asha@dhararia.gov.in',
          password: 'Asha@2026',
          departmentIds: ['dept-1'],
        })
      );
    });

    // The list is re-fetched so the new row appears without a manual refresh.
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/staff');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deactivates an account without deleting it', async () => {
    render(<StaffAccessPanel />);

    fireEvent.click(await screen.findByRole('button', { name: /^deactivate$/i }));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/admin/staff/staff-1', { isActive: false });
    });
  });

  it('pre-selects the current departments when editing', async () => {
    render(<StaffAccessPanel />);

    fireEvent.click(await screen.findByRole('button', { name: /manage/i }));

    const dialog = await screen.findByRole('dialog', { name: /manage asha kumari/i });
    expect(screen.getByLabelText('General Medicine')).toBeChecked();
    expect(screen.getByLabelText('Emergency Medicine')).not.toBeChecked();
    expect(dialog).toHaveTextContent('Reset password (optional)');
  });

  it('hides the screen from non-admin staff', async () => {
    mockUser = { id: 'staff-1', role: 'STAFF' };
    render(<StaffAccessPanel />);

    expect(await screen.findByText('Administrator access required')).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
