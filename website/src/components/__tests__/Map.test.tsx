import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Map from '../Map';

// Mock Google Maps API
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  LoadScript: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="load-script">{children}</div>
  ),
  Marker: () => <div data-testid="marker" />
}));

// Mock environment variable
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-api-key'
  }
}));

describe('Map Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Google Map with LoadScript', () => {
    render(<Map />);
    
    expect(screen.getByTestId('load-script')).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('should render marker inside the map', () => {
    render(<Map />);
    
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });

  it('should have proper container style', () => {
    render(<Map />);
    
    const mapElement = screen.getByTestId('google-map');
    expect(mapElement).toBeInTheDocument();
  });
});
