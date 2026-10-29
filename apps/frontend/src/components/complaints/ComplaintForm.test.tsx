import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { api } from '@/lib/api';

import { ComplaintForm } from './ComplaintForm';

/**
 * A signed-out visitor is the primary user of this form. Nothing here should
 * require an account, so the mock explicitly has no user.
 */
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
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
    },
  };
});

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

const department = { id: 'dept-1', name: 'General Medicine', isActive: true };

describe('ComplaintForm (signed out)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ success: true, data: [department] });
    mockPost.mockResolvedValue({ success: true, data: { id: 'complaint-123' } });
  });

  it('lets a guest submit a complaint without logging in', async () => {
    render(<ComplaintForm />);

    const name = await screen.findByLabelText(/Name/);

    // The form states the rule to the visitor: no login is involved.
    expect(screen.getByText('no login or account is required')).toBeInTheDocument();

    const departmentSelect = screen.getByLabelText(/Department/);
    const complaint = screen.getByLabelText(/Your complaint/);

    // A guest's name is editable — it is not locked to an account profile.
    expect(name).not.toHaveAttribute('readonly');

    await waitFor(() => expect(departmentSelect).toHaveTextContent('General Medicine'));

    fireEvent.change(name, { target: { value: 'Asha Devi' } });
    fireEvent.change(departmentSelect, { target: { value: department.id } });
    fireEvent.change(complaint, {
      target: { value: 'The pharmacy did not have my prescription in stock.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit complaint/i }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/complaints', {
        name: 'Asha Devi',
        departmentId: department.id,
        complaint: 'The pharmacy did not have my prescription in stock.',
      })
    );

    expect(
      await screen.findByRole('heading', { name: /complaint submitted/i })
    ).toBeInTheDocument();
    expect(screen.getByText('complaint-123')).toBeInTheDocument();
  });
});
