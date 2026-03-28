import { render, screen } from '@testing-library/react';
import { RecipeCard } from '@/components/recipe-card';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('RecipeCard', () => {
  const mockRecipe = {
    id: '1',
    title: 'Delicious Pasta',
    description: 'A wonderful pasta dish with tomato sauce',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'medium' as const,
    cuisineType: 'Italian',
    imageUrl: 'https://example.com/pasta.jpg',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    authorName: 'Chef John',
  };

  it('renders recipe card with all information', () => {
    render(<RecipeCard {...mockRecipe} />);

    expect(screen.getByText('Delicious Pasta')).toBeInTheDocument();
    expect(screen.getByText('A wonderful pasta dish with tomato sauce')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('by Chef John')).toBeInTheDocument();
  });

  it('calculates and displays total time correctly', () => {
    render(<RecipeCard {...mockRecipe} />);

    // Total time should be prepTime + cookTime = 15 + 25 = 40
    expect(screen.getByText('40m')).toBeInTheDocument();
  });

  it('displays servings information', () => {
    render(<RecipeCard {...mockRecipe} />);

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays dietary tags', () => {
    render(<RecipeCard {...mockRecipe} />);

    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
  });

  it('limits dietary tags to 3 and shows overflow count', () => {
    const manyTags = {
      ...mockRecipe,
      dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Low-Carb', 'Keto'],
    };

    render(<RecipeCard {...manyTags} />);

    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('applies correct difficulty color classes', () => {
    const { rerender } = render(<RecipeCard {...mockRecipe} difficulty="easy" />);
    expect(screen.getByText('easy')).toHaveClass('bg-green-100');

    rerender(<RecipeCard {...mockRecipe} difficulty="medium" />);
    expect(screen.getByText('medium')).toHaveClass('bg-yellow-100');

    rerender(<RecipeCard {...mockRecipe} difficulty="hard" />);
    expect(screen.getByText('hard')).toHaveClass('bg-red-100');
  });

  it('renders without optional fields', () => {
    const minimalRecipe = {
      id: '2',
      title: 'Simple Recipe',
      description: 'Basic description',
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      difficulty: 'easy' as const,
    };

    render(<RecipeCard {...minimalRecipe} />);

    expect(screen.getByText('Simple Recipe')).toBeInTheDocument();
    expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
  });

  it('renders placeholder image when no imageUrl is provided', () => {
    const noImageRecipe = {
      ...mockRecipe,
      imageUrl: null,
    };

    const { container } = render(<RecipeCard {...noImageRecipe} />);

    // ChefHat icon should be present as placeholder
    expect(container.querySelector('.lucide-chef-hat')).toBeInTheDocument();
  });

  it('creates correct link to recipe detail page', () => {
    const { container } = render(<RecipeCard {...mockRecipe} />);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/recipes/1');
  });
});
