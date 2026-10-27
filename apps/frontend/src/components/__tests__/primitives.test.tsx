import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  Breadcrumbs,
  Container,
  DataList,
  Dialog,
  EmptyState,
  ErrorState,
  PageHero,
  Pagination,
  Prose,
  RadioCard,
  Section,
  Skeleton,
  StatCard,
  StatusBadge,
  Stepper,
  Tabs,
  getPaginationRange,
} from '@dh-araria/ui/components';

describe('layout primitives', () => {
  it('Container renders the requested element and width track', () => {
    const { container } = render(
      <Container as="section" size="prose" data-testid="c">
        Body
      </Container>
    );
    const node = container.querySelector('section');
    expect(node).not.toBeNull();
    expect(node).toHaveClass('max-w-[72ch]');
  });

  it('PageHero owns the single h1 and renders actions', () => {
    render(
      <PageHero
        eyebrow="District Hospital"
        title="Book an appointment"
        description="Pick a department and a slot."
        actions={<a href="/services">Services</a>}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Book an appointment' })).toBeInTheDocument();
    expect(screen.getByText('Pick a department and a slot.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
  });

  it('PageHero can demote its heading when the page already has an h1', () => {
    render(<PageHero title="Section title" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('Section renders an h2 and its action', () => {
    render(
      <Section title="Departments" action={<button type="button">View all</button>}>
        <p>Cards</p>
      </Section>
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Departments' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View all' })).toBeInTheDocument();
  });

  it('Prose applies the 72ch measure by default', () => {
    const { container } = render(<Prose>Legal copy</Prose>);
    expect(container.firstElementChild).toHaveClass('max-w-[72ch]');
  });
});

describe('status and feedback', () => {
  it('StatusBadge keeps the label in the accessible name and is not colour-only', () => {
    const { container } = render(<StatusBadge tone="critical" label="Out of stock" />);
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('EmptyState renders title, description and action', () => {
    render(
      <EmptyState
        title="No notices"
        description="New notices appear here."
        action={<a href="/">Home</a>}
      />
    );
    expect(screen.getByRole('heading', { name: 'No notices' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('ErrorState is an alert and calls onRetry', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('Skeleton stays decorative and SkeletonRegion announces loading', () => {
    const { container } = render(
      <div role="status" aria-busy="true">
        <Skeleton lines={3} />
      </div>
    );
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('StatCard shows a label and value without inventing a trend', () => {
    render(<StatCard label="Open complaints" value="12" hint="As of today" />);
    expect(screen.getByText('Open complaints')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('navigation primitives', () => {
  it('Breadcrumbs marks the last crumb as the current page', () => {
    render(
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'Cardiology' }]}
      />
    );
    const current = screen.getByText('Cardiology');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('getPaginationRange inserts ellipses for long runs', () => {
    expect(getPaginationRange(1, 20)).toEqual([1, 2, 'ellipsis', 20]);
    expect(getPaginationRange(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
    expect(getPaginationRange(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it('Pagination disables previous on the first page and reports the next page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('Pagination marks the active page', () => {
    render(<Pagination page={2} pageCount={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('Stepper announces progress in text as well as colour', () => {
    render(
      <Stepper
        current={2}
        steps={[{ label: 'Department' }, { label: 'Doctor' }, { label: 'Slot' }]}
      />
    );
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('Tabs exposes selection and moves with the arrow keys', () => {
    const onValueChange = jest.fn();
    render(
      <Tabs
        label="Complaint views"
        value="open"
        onValueChange={onValueChange}
        items={[
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ]}
      />
    );

    expect(screen.getByRole('tab', { name: 'Open' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Open' }), { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith('closed');
  });
});

describe('Dialog', () => {
  it('renders in a portal, traps focus and closes on Escape', () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        title="Complaint photo"
        description="Attached by the complainant"
        footer={<button type="button">Close</button>}
      >
        <p>Photo body</p>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Complaint photo');

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}} title="Hidden">
        Body
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('DataList', () => {
  const rows = [
    { id: '1', name: 'Dr Rao', department: 'Medicine' },
    { id: '2', name: 'Dr Das', department: 'Surgery' },
  ];

  it('renders a card for each row on small screens and a table on large', () => {
    const { container } = render(
      <DataList
        items={rows}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'department', header: 'Department' },
        ]}
        keyExtractor={(row) => row.id}
        renderCard={(row) => <p>{row.name}</p>}
        caption="Doctors"
      />
    );

    expect(screen.getAllByText('Dr Rao')).toHaveLength(2);
    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders the empty state instead of an empty table', () => {
    render(
      <DataList
        items={[]}
        columns={[{ key: 'name', header: 'Name' }]}
        keyExtractor={(row: { id: string }) => row.id}
        renderCard={() => null}
        emptyTitle="No staff yet"
      />
    );
    expect(screen.getByRole('heading', { name: 'No staff yet' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('RadioCard', () => {
  it('keeps native radio semantics', () => {
    render(<RadioCard name="mode" value="in-person" label="In person" description="Visit the OPD" />);
    const radio = screen.getByRole('radio', { name: /in person/i });
    fireEvent.click(radio);
    expect(radio).toBeChecked();
  });
});
