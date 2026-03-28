import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteButton } from '@/components/favorite-button';

// Mock the favorite actions
const mockToggleFavorite = jest.fn();
const mockIsFavorited = jest.fn();

jest.mock('@/actions/favorite-actions', () => ({
  toggleFavorite: (recipeId: string) => mockToggleFavorite(recipeId),
  isFavorited: (recipeId: string) => mockIsFavorited(recipeId),
}));

describe('FavoriteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks favorite status on mount', async () => {
    mockIsFavorited.mockResolvedValue({
      success: true,
      data: { isFavorited: false },
    });

    render(<FavoriteButton recipeId="recipe-1" />);

    await waitFor(() => {
      expect(mockIsFavorited).toHaveBeenCalledWith('recipe-1');
    });
  });

  it('renders unfavorited state correctly', async () => {
    mockIsFavorited.mockResolvedValue({
      success: true,
      data: { isFavorited: false },
    });

    const { container } = render(<FavoriteButton recipeId="recipe-1" />);

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    const heart = container.querySelector('.lucide-heart');
    expect(heart).not.toHaveClass('fill-current');
  });

  it('renders favorited state correctly', async () => {
    mockIsFavorited.mockResolvedValue({
      success: true,
      data: { isFavorited: true },
    });

    const { container } = render(<FavoriteButton recipeId="recipe-1" />);

    await waitFor(() => {
      const heart = container.querySelector('.lucide-heart');
      expect(heart).toHaveClass('fill-current');
    });
  });

  it('toggles favorite status when clicked', async () => {
    mockIsFavorited.mockResolvedValue({
      success: true,
      data: { isFavorited: false },
    });

    mockToggleFavorite.mockResolvedValue({
      success: true,
      data: { isFavorited: true },
    });

    const { container } = render(<FavoriteButton recipeId="recipe-1" />);

    await waitFor(() => {
      expect(mockIsFavorited).toHaveBeenCalled();
    });

    const button = container.querySelector('button');
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith('recipe-1');
    });

    // After toggle, heart should be filled
    await waitFor(() => {
      const heart = container.querySelector('.lucide-heart');
      expect(heart).toHaveClass('fill-current');
    });
  });

  it('disables button while loading', async () => {
    mockIsFavorited.mockResolvedValue({
      success: true,
      data: { isFavorited: false },
    });

    mockToggleFavorite.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: { isFavorited: true } });
        }, 100);
      });
    });

    const { container } = render(<FavoriteButton recipeId="recipe-1" />);

    await waitFor(() => {
      expect(mockIsFavorited).toHaveBeenCalled();
    });

    const button = container.querySelector('button');
    if (button) {
      fireEvent.click(button);
      expect(button).toBeDisabled();
    }
  });

  it('handles toggle failure gracefully', async () => {
    mockIsFavorited.mockResolvedValue({
      success: true,
      data: { isFavorited: false },
    });

    mockToggleFavorite.mockResolvedValue({
      success: false,
      error: 'Failed to toggle',
    });

    const { container } = render(<FavoriteButton recipeId="recipe-1" />);

    await waitFor(() => {
      expect(mockIsFavorited).toHaveBeenCalled();
    });

    const button = container.querySelector('button');
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalled();
    });

    // State should remain unchanged
    const heart = container.querySelector('.lucide-heart');
    expect(heart).not.toHaveClass('fill-current');
  });
});
