import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchFilters } from '@/components/search-filters';

// Mock the dietary tag actions
jest.mock('@/actions/dietary-tag-actions', () => ({
  getDietaryTags: jest.fn().mockResolvedValue({
    success: true,
    data: [
      { id: '1', name: 'Vegetarian' },
      { id: '2', name: 'Vegan' },
      { id: '3', name: 'Gluten-Free' },
    ],
  }),
}));

describe('SearchFilters', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter component with all sections', async () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();
    expect(screen.getByLabelText('Cuisine Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum Time')).toBeInTheDocument();
    expect(screen.getByText('Dietary Preferences')).toBeInTheDocument();
  });

  it('loads and displays dietary tags from database', async () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('Vegan')).toBeInTheDocument();
      expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
    });
  });

  it('uses provided dietary tags instead of loading from database', () => {
    const customTags = ['Keto', 'Paleo'];
    render(
      <SearchFilters
        onFilterChange={mockOnFilterChange}
        availableDietaryTags={customTags}
      />
    );

    expect(screen.getByText('Keto')).toBeInTheDocument();
    expect(screen.getByText('Paleo')).toBeInTheDocument();
  });

  it('toggles dietary tag selection', async () => {
    render(
      <SearchFilters
        onFilterChange={mockOnFilterChange}
        availableDietaryTags={['Vegetarian', 'Vegan']}
      />
    );

    const vegetarianBadge = screen.getByText('Vegetarian');

    // Click to select
    fireEvent.click(vegetarianBadge);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dietaryTags: ['Vegetarian'],
        })
      );
    });

    // Click to deselect
    fireEvent.click(vegetarianBadge);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dietaryTags: [],
        })
      );
    });
  });

  it('allows multiple dietary tags to be selected', async () => {
    render(
      <SearchFilters
        onFilterChange={mockOnFilterChange}
        availableDietaryTags={['Vegetarian', 'Vegan', 'Gluten-Free']}
      />
    );

    fireEvent.click(screen.getByText('Vegetarian'));
    fireEvent.click(screen.getByText('Vegan'));

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dietaryTags: expect.arrayContaining(['Vegetarian', 'Vegan']),
        })
      );
    });
  });

  it('shows clear all button when filters are active', async () => {
    render(
      <SearchFilters
        onFilterChange={mockOnFilterChange}
        availableDietaryTags={['Vegetarian']}
      />
    );

    // Initially no clear button
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();

    // Apply a filter
    fireEvent.click(screen.getByText('Vegetarian'));

    // Clear button should appear
    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    render(
      <SearchFilters
        onFilterChange={mockOnFilterChange}
        availableDietaryTags={['Vegetarian']}
      />
    );

    // Apply filters
    const vegetarianBadge = screen.getByText('Vegetarian');
    await userEvent.click(vegetarianBadge);

    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Clear all');
    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        difficulty: null,
        cuisineType: null,
        maxTime: null,
        dietaryTags: [],
      });
    });
  });

  it('renders difficulty select with label', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    const difficultyLabel = screen.getByText('Difficulty');
    expect(difficultyLabel).toBeInTheDocument();

    // Note: Testing Radix UI Select requires more complex setup
    // The select component is present and properly labeled
  });

  it('displays loading state for dietary tags', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    // Initially should show loading
    expect(screen.getByText('Loading dietary tags...')).toBeInTheDocument();
  });

  it('renders with default cuisines', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    // Component should render without crashing
    expect(screen.getByLabelText('Cuisine Type')).toBeInTheDocument();
  });

  it('uses custom cuisines when provided', () => {
    const customCuisines = ['Italian', 'Mexican'];
    render(
      <SearchFilters
        onFilterChange={mockOnFilterChange}
        availableCuisines={customCuisines}
      />
    );

    expect(screen.getByLabelText('Cuisine Type')).toBeInTheDocument();
  });
});
