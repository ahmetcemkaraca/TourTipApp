// Mobile Optimization Types for TourTrip.app
export interface MobileConfig {
  touchOptimization: boolean;
  swipeGestures: boolean;
  hapticFeedback: boolean;
  adaptiveLayout: boolean;
  offlineFirst: boolean;
  pushNotifications: boolean;
  locationServices: boolean;
  cameraIntegration: boolean;
  biometricAuth: boolean;
  deviceOrientation: boolean;
}

export interface TouchConfig {
  minTouchTargetSize: number; // pixels
  touchDelay: number; // ms
  scrollBehavior: 'smooth' | 'auto';
  pullToRefresh: boolean;
  infiniteScroll: boolean;
  swipeThreshold: number; // pixels
  tapHighlight: boolean;
  preventZoom: boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'web';
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  hasNotch: boolean;
  safeAreaInsets: SafeAreaInsets;
  capabilities: DeviceCapabilities;
}

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DeviceCapabilities {
  camera: boolean;
  geolocation: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  vibration: boolean;
  bluetooth: boolean;
  nfc: boolean;
  biometrics: boolean;
  storage: {
    quota: number;
    usage: number;
  };
  network: {
    type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number;
    rtt: number;
  };
}

export interface GestureConfig {
  enabled: boolean;
  swipeLeft?: GestureAction;
  swipeRight?: GestureAction;
  swipeUp?: GestureAction;
  swipeDown?: GestureAction;
  pinch?: GestureAction;
  doubleTap?: GestureAction;
  longPress?: GestureAction;
}

export interface GestureAction {
  action: string;
  parameters?: any;
  condition?: (context: any) => boolean;
  feedback?: FeedbackType;
}

export enum FeedbackType {
  NONE = 'none',
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkLatency: number;
  renderTime: number;
}

export interface MobileViewport {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  scale: number;
  isFullscreen: boolean;
  safeArea: SafeAreaInsets;
}

export interface TouchEvent {
  type: 'start' | 'move' | 'end' | 'cancel';
  touches: TouchPoint[];
  timestamp: number;
  target: HTMLElement;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface TouchPoint {
  identifier: number;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

export interface PinchGesture {
  scale: number;
  velocity: number;
  center: { x: number; y: number };
  distance: number;
}

// PWA specific types
export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
  installable: boolean;
  standalone: boolean;
  fullscreen: boolean;
  hasInstallPrompt: boolean;
  isInstalled: boolean;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
}

export interface OfflineCapabilities {
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  syncInBackground: boolean;
  offlinePages: string[];
  offlineData: OfflineDataConfig[];
  queuedOperations: OfflineOperation[];
}

export interface OfflineDataConfig {
  key: string;
  collection: string;
  syncStrategy: 'immediate' | 'background' | 'manual';
  conflictResolution: 'server-wins' | 'client-wins' | 'merge';
  maxAge: number; // milliseconds
}

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// Location services
export interface LocationConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  watchPosition: boolean;
  backgroundLocation: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeofenceConfig {
  id: string;
  center: { latitude: number; longitude: number };
  radius: number; // meters
  action: 'enter' | 'exit' | 'both';
  callback: (event: GeofenceEvent) => void;
}

export interface GeofenceEvent {
  id: string;
  type: 'enter' | 'exit';
  location: LocationData;
  timestamp: number;
}

// Camera integration
export interface CameraConfig {
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  allowEdit: boolean;
  source: 'camera' | 'gallery' | 'both';
  multiple: boolean;
  mediaType: 'photo' | 'video' | 'both';
}

export interface CameraResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  fileSize: number;
  timestamp: number;
}

// Push notifications
export interface PushNotificationConfig {
  enabled: boolean;
  badge: boolean;
  sound: boolean;
  alert: boolean;
  vibration: boolean;
  categories: NotificationCategory[];
}

export interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  actions: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  input?: boolean;
  destructive?: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  data?: any;
  actions?: NotificationAction[];
  category?: string;
  sound?: string;
  vibration?: number[];
  timestamp: number;
}

// Biometric authentication
export interface BiometricConfig {
  types: BiometricType[];
  fallbackToPassword: boolean;
  title: string;
  subtitle: string;
  description: string;
  cancelButtonText: string;
  deviceCredentialAllowed: boolean;
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE_ID = 'face-id',
  TOUCH_ID = 'touch-id',
  IRIS = 'iris',
  VOICE = 'voice'
}

export interface BiometricResult {
  success: boolean;
  biometricType?: BiometricType;
  error?: string;
  userCancel?: boolean;
  systemCancel?: boolean;
}

// Responsive design
export interface ResponsiveBreakpoints {
  xs: number;   // 0px
  sm: number;   // 640px
  md: number;   // 768px
  lg: number;   // 1024px
  xl: number;   // 1280px
  '2xl': number; // 1536px
}

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export interface AdaptiveLayout {
  columns: ResponsiveValue<number>;
  spacing: ResponsiveValue<number>;
  fontSize: ResponsiveValue<string>;
  padding: ResponsiveValue<string>;
  margin: ResponsiveValue<string>;
}

// Hook interfaces
export interface UseMobileResult {
  deviceInfo: DeviceInfo;
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: SafeAreaInsets;
  
  // Actions
  vibrate: (pattern?: number | number[]) => void;
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  share: (data: ShareData) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
}

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface UseTouchGesturesResult {
  // Gesture states
  isSwipeable: boolean;
  isPinchable: boolean;
  gestureEnabled: boolean;
  
  // Gesture handlers
  onSwipe: (handler: (gesture: SwipeGesture) => void) => void;
  onPinch: (handler: (gesture: PinchGesture) => void) => void;
  onDoubleTap: (handler: (event: TouchEvent) => void) => void;
  onLongPress: (handler: (event: TouchEvent) => void) => void;
  
  // Configuration
  setGestureConfig: (config: GestureConfig) => void;
  enableGestures: () => void;
  disableGestures: () => void;
  
  // Feedback
  triggerHaptic: (type: FeedbackType) => void;
}

export interface UseLocationResult {
  // Location state
  location: LocationData | null;
  accuracy: number | null;
  watching: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt';
  
  // Actions
  getCurrentLocation: () => Promise<LocationData>;
  startWatching: () => void;
  stopWatching: () => void;
  requestPermission: () => Promise<'granted' | 'denied'>;
  
  // Geofencing
  addGeofence: (config: GeofenceConfig) => void;
  removeGeofence: (id: string) => void;
  getGeofences: () => GeofenceConfig[];
}

export interface UseCameraResult {
  // Camera state
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  
  // Actions
  takePicture: (config?: CameraConfig) => Promise<CameraResult>;
  pickImage: (config?: CameraConfig) => Promise<CameraResult[]>;
  requestPermission: () => Promise<'granted' | 'denied'>;
}

export interface UsePWAResult {
  // PWA state
  capabilities: PWACapabilities;
  installPrompt: PWAInstallPrompt | null;
  canInstall: boolean;
  isStandalone: boolean;
  
  // Actions
  promptInstall: () => Promise<void>;
  checkForUpdates: () => Promise<boolean>;
  registerServiceWorker: () => Promise<ServiceWorkerRegistration>;
}

export interface UseOfflineResult {
  // Offline state
  isOnline: boolean;
  isOffline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  queuedOperations: OfflineOperation[];
  
  // Actions
  sync: () => Promise<void>;
  queueOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp'>) => void;
  clearQueue: () => void;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
}

export interface UsePushNotificationsResult {
  // Notification state
  permission: 'granted' | 'denied' | 'default';
  token: string | null;
  supported: boolean;
  
  // Actions
  requestPermission: () => Promise<'granted' | 'denied' | 'default'>;
  subscribe: () => Promise<string | null>;
  unsubscribe: () => Promise<void>;
  showNotification: (notification: PushNotification) => Promise<void>;
  
  // Event handlers
  onMessage: (handler: (notification: PushNotification) => void) => void;
  onClick: (handler: (notification: PushNotification) => void) => void;
}

export interface UseBiometricResult {
  // Biometric state
  available: boolean;
  types: BiometricType[];
  enrolled: boolean;
  
  // Actions
  authenticate: (config?: BiometricConfig) => Promise<BiometricResult>;
  checkAvailability: () => Promise<BiometricType[]>;
}

export interface UsePerformanceResult {
  // Performance metrics
  metrics: PerformanceMetrics;
  isSlowDevice: boolean;
  memoryPressure: 'low' | 'medium' | 'high';
  
  // Actions
  measurePerformance: (label: string) => () => void;
  reportMetrics: () => void;
  optimizeForDevice: () => void;
}

// Component props
export interface MobileContainerProps {
  children: React.ReactNode;
  safeArea?: boolean;
  fullHeight?: boolean;
  className?: string;
}

export interface TouchableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipe?: (direction: SwipeGesture['direction']) => void;
  hapticFeedback?: FeedbackType;
  disabled?: boolean;
  className?: string;
}

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  threshold?: number;
  className?: string;
}

export interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  className?: string;
}

// Error types
export interface MobileError {
  type: 'permission' | 'hardware' | 'network' | 'compatibility';
  code: string;
  message: string;
  details?: any;
}
