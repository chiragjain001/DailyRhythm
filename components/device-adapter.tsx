"use client";

import React, { ReactNode } from 'react';
import useViewport from '@/hooks/useViewport';

// Device Adapter Component
interface DeviceAdapterProps {
  mobileComponent?: ReactNode;
  tabletComponent?: ReactNode;
  desktopComponent?: ReactNode;
  children?: ReactNode;
}

export function DeviceAdapter({ 
  mobileComponent, 
  tabletComponent, 
  desktopComponent, 
  children 
}: DeviceAdapterProps) {
  const { deviceType } = useViewport();

  if (children) {
    return <>{children}</>;
  }

  switch (deviceType) {
    case 'mobile':
      return <>{mobileComponent}</>;
    case 'tablet':
      return <>{tabletComponent || mobileComponent}</>;
    case 'desktop':
      return <>{desktopComponent || tabletComponent || mobileComponent}</>;
    default:
      return <>{desktopComponent || tabletComponent || mobileComponent}</>;
  }
}

// Show/Hide Components by Device
interface ShowOnDeviceProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  children: ReactNode;
}

export function ShowOnDevice({ mobile, tablet, desktop, children }: ShowOnDeviceProps) {
  const { deviceType } = useViewport();

  const shouldShow = 
    (mobile && deviceType === 'mobile') ||
    (tablet && deviceType === 'tablet') ||
    (desktop && deviceType === 'desktop');

  return shouldShow ? <>{children}</> : null;
}

// Responsive Container with Smart Padding
interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  const { deviceType } = useViewport();

  const getPadding = () => {
    switch (deviceType) {
      case 'mobile':
        return 'px-4 py-2';
      case 'tablet':
        return 'px-6 py-4';
      case 'desktop':
        return 'px-8 py-6';
      default:
        return 'px-6 py-4';
    }
  };

  return (
    <div className={`responsive-container ${getPadding()} ${className}`}>
      {children}
    </div>
  );
}

// Orientation Adapter
interface OrientationAdapterProps {
  portraitComponent: ReactNode;
  landscapeComponent: ReactNode;
}

export function OrientationAdapter({ portraitComponent, landscapeComponent }: OrientationAdapterProps) {
  const { isPortrait } = useViewport();

  return <>{isPortrait ? portraitComponent : landscapeComponent}</>;
}

// Touch-Friendly Wrapper
interface TouchWrapperProps {
  children: ReactNode;
  className?: string;
}

export function TouchWrapper({ children, className = '' }: TouchWrapperProps) {
  const { isTouchDevice } = useViewport();

  if (!isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <div className={`touch-wrapper touch-target ${className}`}>
      {children}
    </div>
  );
}

// Dynamic Font Size Component
interface DynamicTextProps {
  children: ReactNode;
  mobileSize?: string;
  tabletSize?: string;
  desktopSize?: string;
  className?: string;
}

export function DynamicText({ 
  children, 
  mobileSize = 'text-sm', 
  tabletSize = 'text-base', 
  desktopSize = 'text-lg',
  className = '' 
}: DynamicTextProps) {
  const { deviceType } = useViewport();

  const getSize = () => {
    switch (deviceType) {
      case 'mobile':
        return mobileSize;
      case 'tablet':
        return tabletSize;
      case 'desktop':
        return desktopSize;
      default:
        return tabletSize;
    }
  };

  return (
    <div className={`dynamic-text ${getSize()} ${className}`}>
      {children}
    </div>
  );
}

// Platform-Specific Component
interface PlatformAdapterProps {
  iosComponent?: ReactNode;
  androidComponent?: ReactNode;
  webComponent?: ReactNode;
  children?: ReactNode;
}

export function PlatformAdapter({ 
  iosComponent, 
  androidComponent, 
  webComponent, 
  children 
}: PlatformAdapterProps) {
  const { isIOS, isAndroid } = useViewport();

  if (children) {
    return <>{children}</>;
  }

  if (isIOS && iosComponent) {
    return <>{iosComponent}</>;
  }

  if (isAndroid && androidComponent) {
    return <>{androidComponent}</>;
  }

  return <>{webComponent || iosComponent || androidComponent}</>;
}

// Browser-Specific Component
interface BrowserAdapterProps {
  safariComponent?: ReactNode;
  chromeComponent?: ReactNode;
  firefoxComponent?: ReactNode;
  defaultComponent?: ReactNode;
  children?: ReactNode;
}

export function BrowserAdapter({ 
  safariComponent, 
  chromeComponent, 
  firefoxComponent, 
  defaultComponent,
  children 
}: BrowserAdapterProps) {
  const { browser } = useViewport();

  if (children) {
    return <>{children}</>;
  }

  switch (browser) {
    case 'safari':
      return <>{safariComponent || defaultComponent}</>;
    case 'chrome':
      return <>{chromeComponent || defaultComponent}</>;
    case 'firefox':
      return <>{firefoxComponent || defaultComponent}</>;
    default:
      return <>{defaultComponent}</>;
  }
}
