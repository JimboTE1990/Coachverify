import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ViewMode = 'mobile' | 'desktop';

interface DeviceDetection {
  deviceType: DeviceType;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

/**
 * Hook to detect device type and provide manual view mode switching
 *
 * Device Types (auto-detected):
 * - mobile: < 768px
 * - tablet: 768px - 1024px
 * - desktop: > 1024px
 *
 * View Modes (user-controllable):
 * - mobile: Optimized single-column layout
 * - desktop: Full multi-column layout
 */
export const useDeviceDetection = (): DeviceDetection => {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  // Determine device type based on screen width
  const getDeviceType = (width: number): DeviceType => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const deviceType = getDeviceType(screenWidth);

  // Auto-set view mode based on device type (can be overridden by user)
  useEffect(() => {
    // Default view mode based on device
    if (deviceType === 'mobile') {
      setViewMode('mobile');
    } else {
      setViewMode('desktop');
    }
  }, [deviceType]);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    deviceType,
    viewMode,
    setViewMode,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    screenWidth,
  };
};
