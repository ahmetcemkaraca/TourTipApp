'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DeviceInfo,
  SafeAreaInsets,
  UseMobileResult,
  MobileViewport,
  PerformanceMetrics,
  ShareData,
  FeedbackType
} from '@/types/mobile';

export function useMobile(): UseMobileResult {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    platform: 'web',
    isTouch: false,
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    orientation: 'portrait',
    hasNotch: false,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    capabilities: {
      camera: false,
      geolocation: false,
      accelerometer: false,
      gyroscope: false,
      magnetometer: false,
      vibration: false,
      bluetooth: false,
      nfc: false,
      biometrics: false,
      storage: { quota: 0, usage: 0 },
      network: {
        type: 'unknown',
        effectiveType: '4g',
        downlink: 0,
        rtt: 0,
      },
    },
  });

  const [viewport, setViewport] = useState<MobileViewport>({
    width: 0,
    height: 0,
    availableWidth: 0,
    availableHeight: 0,
    scale: 1,
    isFullscreen: false,
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  // Detect device information
  const detectDevice = useCallback(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);
    const isTablet = /iPad/.test(userAgent) || (isAndroid && !/Mobile/.test(userAgent));
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect device type
    let deviceType: DeviceInfo['type'] = 'desktop';
    if (isTablet) {
      deviceType = 'tablet';
    } else if (isMobile) {
      deviceType = 'mobile';
    }

    // Detect platform
    let platform: DeviceInfo['platform'] = 'web';
    if (isIOS) {
      platform = 'ios';
    } else if (isAndroid) {
      platform = 'android';
    }

    // Get screen information
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;

    // Detect orientation
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

    // Detect notch (simplified - would need more sophisticated detection)
    const hasNotch = isIOS && screenHeight >= 812; // iPhone X and newer

    // Get safe area insets
    const safeAreaInsets = getSafeAreaInsets();

    // Detect capabilities
    const capabilities = {
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      accelerometer: 'DeviceMotionEvent' in window,
      gyroscope: 'DeviceOrientationEvent' in window,
      magnetometer: 'DeviceOrientationEvent' in window,
      vibration: 'vibrate' in navigator,
      bluetooth: 'bluetooth' in navigator,
      nfc: 'nfc' in navigator,
      biometrics: 'credentials' in navigator,
      storage: getStorageInfo(),
      network: getNetworkInfo(),
    };

    setDeviceInfo({
      type: deviceType,
      platform,
      isTouch,
      screenWidth,
      screenHeight,
      pixelRatio,
      orientation,
      hasNotch,
      safeAreaInsets,
      capabilities,
    });
  }, []);

  // Get safe area insets
  const getSafeAreaInsets = (): SafeAreaInsets => {
    if (typeof window === 'undefined') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const computedStyle = window.getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
    };
  };

  // Get storage information
  const getStorageInfo = () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
        };
      });
    }
    return { quota: 0, usage: 0 };
  };

  // Get network information
  const getNetworkInfo = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }
    
    return {
      type: 'unknown' as const,
      effectiveType: '4g' as const,
      downlink: 0,
      rtt: 0,
    };
  };

  // Update viewport information
  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
      availableWidth: window.screen.availWidth,
      availableHeight: window.screen.availHeight,
      scale: window.devicePixelRatio || 1,
      isFullscreen: window.fullScreen || document.fullscreenElement !== null,
      safeArea: getSafeAreaInsets(),
    });
  }, []);

  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    setTimeout(() => {
      detectDevice();
      updateViewport();
    }, 100); // Small delay to ensure dimensions are updated
  }, [detectDevice, updateViewport]);

  // Vibrate function
  const vibrate = useCallback((pattern?: number | number[]) => {
    if ('vibrate' in navigator) {
      if (typeof pattern === 'number') {
        navigator.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(200); // Default vibration
      }
    }
  }, []);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        updateViewport();
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    }
  }, [updateViewport]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    if (document.exitFullscreen) {
      try {
        await document.exitFullscreen();
        updateViewport();
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  }, [updateViewport]);

  // Share content
  const share = useCallback(async (data: ShareData) => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error('Failed to share:', error);
        // Fallback to copy URL
        if (data.url) {
          await copyToClipboard(data.url);
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      if (data.url) {
        await copyToClipboard(data.url);
      }
    }
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  }, []);

  // Initialize and set up event listeners
  useEffect(() => {
    detectDevice();
    updateViewport();

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', updateViewport);
    };
  }, [detectDevice, updateViewport, handleOrientationChange]);

  return {
    deviceInfo,
    isMobile: deviceInfo.type === 'mobile',
    isTablet: deviceInfo.type === 'tablet',
    isTouch: deviceInfo.isTouch,
    orientation: deviceInfo.orientation,
    safeAreaInsets: deviceInfo.safeAreaInsets,
    vibrate,
    requestFullscreen,
    exitFullscreen,
    share,
    copyToClipboard,
  };
}

// Hook for touch gestures
export function useTouchGestures() {
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const gestureHandlers = useRef<{
    swipe?: (gesture: any) => void;
    pinch?: (gesture: any) => void;
    doubleTap?: (event: any) => void;
    longPress?: (event: any) => void;
  }>({});

  const triggerHaptic = useCallback((type: FeedbackType) => {
    if ('vibrate' in navigator) {
      const patterns = {
        [FeedbackType.LIGHT]: 50,
        [FeedbackType.MEDIUM]: 100,
        [FeedbackType.HEAVY]: 200,
        [FeedbackType.SUCCESS]: [100, 50, 100],
        [FeedbackType.WARNING]: [200, 100, 200],
        [FeedbackType.ERROR]: [300, 100, 300, 100, 300],
        [FeedbackType.NONE]: 0,
      };
      
      const pattern = patterns[type];
      if (pattern) {
        navigator.vibrate(pattern);
      }
    }
  }, []);

  const onSwipe = useCallback((handler: (gesture: any) => void) => {
    gestureHandlers.current.swipe = handler;
  }, []);

  const onPinch = useCallback((handler: (gesture: any) => void) => {
    gestureHandlers.current.pinch = handler;
  }, []);

  const onDoubleTap = useCallback((handler: (event: any) => void) => {
    gestureHandlers.current.doubleTap = handler;
  }, []);

  const onLongPress = useCallback((handler: (event: any) => void) => {
    gestureHandlers.current.longPress = handler;
  }, []);

  const enableGestures = useCallback(() => {
    setGestureEnabled(true);
  }, []);

  const disableGestures = useCallback(() => {
    setGestureEnabled(false);
  }, []);

  return {
    isSwipeable: gestureEnabled,
    isPinchable: gestureEnabled,
    gestureEnabled,
    onSwipe,
    onPinch,
    onDoubleTap,
    onLongPress,
    setGestureConfig: () => {}, // Placeholder
    enableGestures,
    disableGestures,
    triggerHaptic,
  };
}

// Hook for PWA capabilities
export function usePWA() {
  const [capabilities, setCapabilities] = useState({
    installable: false,
    standalone: false,
    fullscreen: false,
    hasInstallPrompt: false,
    isInstalled: false,
    displayMode: 'browser' as const,
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const checkPWACapabilities = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Check if app is installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Check display mode
    const displayMode = window.matchMedia('(display-mode: standalone)').matches ? 'standalone' :
                       window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' :
                       window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser';

    setCapabilities({
      installable: !!installPrompt,
      standalone: isStandalone,
      fullscreen: displayMode === 'fullscreen',
      hasInstallPrompt: !!installPrompt,
      isInstalled: isStandalone,
      displayMode,
    });
  }, [installPrompt]);

  const promptInstall = useCallback(async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      } catch (error) {
        console.error('Failed to prompt install:', error);
      }
    }
  }, [installPrompt]);

  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return registration.waiting !== null;
      }
    }
    return false;
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        return registration;
      } catch (error) {
        console.error('Service worker registration failed:', error);
        throw error;
      }
    }
    throw new Error('Service workers not supported');
  }, []);

  useEffect(() => {
    checkPWACapabilities();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', checkPWACapabilities);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', checkPWACapabilities);
    };
  }, [checkPWACapabilities]);

  return {
    capabilities,
    installPrompt,
    canInstall: !!installPrompt,
    isStandalone: capabilities.standalone,
    promptInstall,
    checkForUpdates,
    registerServiceWorker,
  };
}

// Hook for performance monitoring
export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0,
    memoryUsage: 0,
    networkLatency: 0,
    renderTime: 0,
  });

  const [isSlowDevice, setIsSlowDevice] = useState(false);
  const [memoryPressure, setMemoryPressure] = useState<'low' | 'medium' | 'high'>('low');

  const measurePerformance = useCallback((label: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`${label}: ${duration.toFixed(2)}ms`);
      
      // Update render time
      setMetrics(prev => ({
        ...prev,
        renderTime: duration,
      }));
    };
  }, []);

  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Web Vitals
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      // Memory usage
      const memory = (performance as any).memory;
      const memoryUsage = memory ? memory.usedJSHeapSize : 0;
      
      // Network timing
      const networkLatency = navigation ? navigation.responseStart - navigation.requestStart : 0;
      
      setMetrics(prev => ({
        ...prev,
        firstContentfulPaint: fcp,
        memoryUsage,
        networkLatency,
        timeToInteractive: navigation?.loadEventEnd || 0,
      }));

      // Determine if device is slow
      const deviceMemory = (navigator as any).deviceMemory || 4;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      
      setIsSlowDevice(deviceMemory < 2 || hardwareConcurrency < 4);
      
      // Memory pressure
      if (memory) {
        const memoryRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (memoryRatio > 0.8) {
          setMemoryPressure('high');
        } else if (memoryRatio > 0.5) {
          setMemoryPressure('medium');
        } else {
          setMemoryPressure('low');
        }
      }
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }, []);

  const reportMetrics = useCallback(() => {
    // Report metrics to analytics service
    console.log('Performance Metrics:', metrics);
    
    // Could send to analytics service
    // AnalyticsService.trackEvent('performance_metrics', metrics);
  }, [metrics]);

  const optimizeForDevice = useCallback(() => {
    if (isSlowDevice) {
      // Reduce animations, disable heavy features
      document.documentElement.style.setProperty('--animation-duration', '0ms');
      document.documentElement.classList.add('reduced-motion');
    }
    
    if (memoryPressure === 'high') {
      // Clear caches, reduce memory usage
      console.warn('High memory pressure detected, optimizing...');
    }
  }, [isSlowDevice, memoryPressure]);

  useEffect(() => {
    // Initial metrics collection
    setTimeout(collectMetrics, 1000);
    
    // Periodic metrics collection
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [collectMetrics]);

  useEffect(() => {
    optimizeForDevice();
  }, [optimizeForDevice]);

  return {
    metrics,
    isSlowDevice,
    memoryPressure,
    measurePerformance,
    reportMetrics,
    optimizeForDevice,
  };
}

export default useMobile;
