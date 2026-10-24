import { fireEvent, render, screen } from '@testing-library/react';

import { RatingDisplay, StarRatingInput } from './RatingStars';

describe('StarRatingInput', () => {
  it('renders a labelled radio for each star', () => {
    render(<StarRatingInput name="rating" legend="Overall rating" value={null} onChange={jest.fn()} />);

    expect(screen.getByRole('group', { name: /overall rating/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /1 of 5 stars, very poor/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /5 of 5 stars, excellent/i })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('reports the chosen star to the caller', () => {
    const onChange = jest.fn();
    render(<StarRatingInput name="rating" legend="Overall rating" value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: /4 of 5 stars/i }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('reflects the selected value and announces it politely', () => {
    render(<StarRatingInput name="rating" legend="Overall rating" value={4} onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /4 of 5 stars/i })).toBeChecked();
    expect(screen.getByText('Good (4 of 5)')).toBeInTheDocument();
  });

  it('offers an explicit Skip option when the criterion is optional', () => {
    const onChange = jest.fn();
    render(
      <StarRatingInput
        name="cleanliness"
        legend="Cleanliness"
        value={null}
        onChange={onChange}
        allowSkip
      />
    );

    const skip = screen.getByRole('radio', { name: /skip cleanliness rating/i });
    expect(skip).toBeChecked();
    expect(screen.getByText('Skipped')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /2 of 5 stars/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('shows validation errors in an alert and links them to the group', () => {
    render(
      <StarRatingInput
        name="rating"
        legend="Overall rating"
        value={null}
        onChange={jest.fn()}
        required
        error="Please choose a rating"
      />
    );

    const group = screen.getByRole('group', { name: /overall rating/i });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Please choose a rating');
    expect(group).toHaveAccessibleDescription('Please choose a rating');
    expect(group).toHaveAccessibleName(/Overall rating/i);
  });
});

describe('RatingDisplay', () => {
  it('exposes the rating and its label to assistive technology', () => {
    render(<RatingDisplay value={5} />);

    expect(screen.getByRole('img', { name: /rated 5 out of 5, excellent/i })).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('rounds fractional averages for the star fill but keeps the exact number', () => {
    render(<RatingDisplay value={3.6} />);

    expect(screen.getByRole('img', { name: /rated 3.6 out of 5, good/i })).toBeInTheDocument();
    expect(screen.getByText('3.6/5')).toBeInTheDocument();
  });
});
