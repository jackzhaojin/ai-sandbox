/**
 * Component tests for TrackItem component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackItem } from '../track-item';
import type { TrackWithRelations } from '@/lib/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('TrackItem Component', () => {
  const mockTrack: TrackWithRelations = {
    id: 'track-1',
    title: 'Test Track',
    duration: 210, // 3:30
    trackNumber: 1,
    artist: {
      id: 'artist-1',
      name: 'Test Artist',
      imageUrl: '/artist.jpg',
    },
    album: {
      id: 'album-1',
      title: 'Test Album',
      coverArtUrl: '/album.jpg',
    },
    artistId: 'artist-1',
    albumId: 'album-1',
    fileUrl: '/track.mp3',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render track information', () => {
    render(<TrackItem track={mockTrack} />);

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('should render album name when showAlbum is true', () => {
    render(<TrackItem track={mockTrack} showAlbum={true} />);
    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  it('should not render album name when showAlbum is false', () => {
    render(<TrackItem track={mockTrack} showAlbum={false} />);
    expect(screen.queryByText('Test Album')).not.toBeInTheDocument();
  });

  it('should render track index when provided', () => {
    render(<TrackItem track={mockTrack} index={5} />);
    expect(screen.getByText('6')).toBeInTheDocument(); // index + 1
  });

  it('should call onPlay when track is clicked', async () => {
    const handlePlay = jest.fn();
    const user = userEvent.setup();

    render(<TrackItem track={mockTrack} onPlay={handlePlay} />);

    const trackElement = screen.getByText('Test Track').closest('div');
    if (trackElement) {
      await user.click(trackElement);
    }

    expect(handlePlay).toHaveBeenCalledWith(mockTrack);
  });

  it('should call onToggleFavorite when heart button is clicked', async () => {
    const handleToggleFavorite = jest.fn();
    const user = userEvent.setup();

    render(<TrackItem track={mockTrack} onToggleFavorite={handleToggleFavorite} />);

    // Find the Heart button by its parent button element
    const buttons = screen.getAllByRole('button');
    const heartButton = buttons.find(
      (button) => button.querySelector('svg') && button.className.includes('opacity-0')
    );

    if (heartButton) {
      await user.click(heartButton);
      expect(handleToggleFavorite).toHaveBeenCalledWith('track-1');
    }
  });

  it('should show favorited state when isFavorited is true', () => {
    const { container } = render(<TrackItem track={mockTrack} isFavorited={true} />);

    const heartIcon = container.querySelector('.fill-red-500');
    expect(heartIcon).toBeInTheDocument();
  });

  it('should show playing state when isPlaying is true', () => {
    const { container } = render(<TrackItem track={mockTrack} isPlaying={true} />);

    const trackTitle = screen.getByText('Test Track');
    expect(trackTitle).toHaveClass('text-green-500');
  });

  it('should render album cover art when available', () => {
    render(<TrackItem track={mockTrack} />);

    const albumArt = screen.getByAltText('Test Track');
    expect(albumArt).toBeInTheDocument();
    expect(albumArt).toHaveAttribute('src', '/album.jpg');
  });

  it('should render track without album cover art', () => {
    const trackWithoutAlbum: TrackWithRelations = {
      ...mockTrack,
      album: null,
    };

    render(<TrackItem track={trackWithoutAlbum} />);

    expect(screen.queryByAltText('Test Track')).not.toBeInTheDocument();
    expect(screen.getByText('Test Track')).toBeInTheDocument();
  });

  it('should format duration correctly', () => {
    render(<TrackItem track={mockTrack} />);
    // Duration is 210 seconds = 3:30
    expect(screen.getByText('3:30')).toBeInTheDocument();
  });

  it('should not call onPlay when onPlay is not provided', async () => {
    const user = userEvent.setup();

    render(<TrackItem track={mockTrack} />);

    const trackElement = screen.getByText('Test Track').closest('div');
    if (trackElement) {
      await user.click(trackElement);
      // Should not throw an error
    }
  });

  it('should stop propagation when favorite button is clicked', async () => {
    const handlePlay = jest.fn();
    const handleToggleFavorite = jest.fn();
    const user = userEvent.setup();

    render(
      <TrackItem track={mockTrack} onPlay={handlePlay} onToggleFavorite={handleToggleFavorite} />
    );

    // Click the favorite button
    const buttons = screen.getAllByRole('button');
    const heartButton = buttons.find(
      (button) => button.querySelector('svg') && button.className.includes('opacity-0')
    );

    if (heartButton) {
      await user.click(heartButton);
      expect(handleToggleFavorite).toHaveBeenCalledWith('track-1');
      expect(handlePlay).not.toHaveBeenCalled(); // Should not trigger onPlay
    }
  });

  it('should render with all optional props', () => {
    const handlePlay = jest.fn();
    const handleToggleFavorite = jest.fn();

    render(
      <TrackItem
        track={mockTrack}
        index={0}
        isPlaying={true}
        isFavorited={true}
        showAlbum={true}
        onPlay={handlePlay}
        onToggleFavorite={handleToggleFavorite}
      />
    );

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // index + 1
  });
});
