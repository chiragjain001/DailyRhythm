"use client";

import { DeviceAdapter, ShowOnDevice, ResponsiveContainer, OrientationAdapter, TouchWrapper, DynamicText, PlatformAdapter, BrowserAdapter } from './device-adapter';
import useViewport from '@/hooks/useViewport';

export default function DeviceAdapterExample() {
  const { 
    deviceType, 
    isMobile, 
    isTablet, 
    isDesktop, 
    isIOS, 
    isAndroid, 
    isSafari, 
    isChrome,
    breakpoint,
    width,
    height 
  } = useViewport();

  return (
    <ResponsiveContainer className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Device Adapter Examples</h2>
        
        {/* Device Type Display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Current Device Info:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Device Type: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{deviceType}</span></div>
            <div>Breakpoint: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{breakpoint}</span></div>
            <div>Resolution: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{width}x{height}</span></div>
            <div>Platform: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web'}</span></div>
          </div>
        </div>

        {/* Device-Specific Components */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Device-Specific UI:</h3>
          <DeviceAdapter
            mobileComponent={
              <div className="bg-blue-100 p-4 rounded-lg">
                <h4 className="font-semibold">Mobile Navigation</h4>
                <p className="text-sm">Hamburger menu, touch-optimized buttons</p>
              </div>
            }
            tabletComponent={
              <div className="bg-green-100 p-4 rounded-lg">
                <h4 className="font-semibold">Tablet Navigation</h4>
                <p className="text-sm">Sidebar with larger touch targets</p>
              </div>
            }
            desktopComponent={
              <div className="bg-purple-100 p-4 rounded-lg">
                <h4 className="font-semibold">Desktop Navigation</h4>
                <p className="text-sm">Full horizontal menu with hover effects</p>
              </div>
            }
          />
        </div>

        {/* Show/Hide by Device */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Show/Hide by Device:</h3>
          <div className="space-y-2">
            <ShowOnDevice mobile>
              <div className="bg-yellow-100 p-3 rounded text-sm">📱 This only shows on mobile devices</div>
            </ShowOnDevice>
            <ShowOnDevice tablet>
              <div className="bg-orange-100 p-3 rounded text-sm">📱 This only shows on tablets</div>
            </ShowOnDevice>
            <ShowOnDevice desktop>
              <div className="bg-red-100 p-3 rounded text-sm">🖥️ This only shows on desktop</div>
            </ShowOnDevice>
          </div>
        </div>

        {/* Platform-Specific Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Platform-Specific Features:</h3>
          <PlatformAdapter
            iosComponent={
              <div className="bg-blue-50 p-3 rounded text-sm">
                🍎 iOS-specific: Share sheet, haptic feedback, Face ID
              </div>
            }
            androidComponent={
              <div className="bg-green-50 p-3 rounded text-sm">
                🤖 Android-specific: Material Design, fingerprint auth
              </div>
            }
            webComponent={
              <div className="bg-gray-50 p-3 rounded text-sm">
                🌐 Web-specific: Keyboard shortcuts, right-click menu
              </div>
            }
          />
        </div>

        {/* Browser-Specific Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Browser-Specific Features:</h3>
          <BrowserAdapter
            safariComponent={
              <div className="bg-blue-50 p-3 rounded text-sm">
                🦁 Safari: WebKit optimizations, iOS integration
              </div>
            }
            chromeComponent={
              <div className="bg-yellow-50 p-3 rounded text-sm">
                🟡 Chrome: V8 optimizations, DevTools integration
              </div>
            }
            firefoxComponent={
              <div className="bg-orange-50 p-3 rounded text-sm">
                🦊 Firefox: Gecko engine, privacy features
              </div>
            }
            defaultComponent={
              <div className="bg-gray-50 p-3 rounded text-sm">
                🌐 Other browser: Standard web features
              </div>
            }
          />
        </div>

        {/* Dynamic Text Sizing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Dynamic Text Sizing:</h3>
          <DynamicText
            mobileSize="text-sm"
            tabletSize="text-base"
            desktopSize="text-lg"
            className="font-semibold"
          >
            This text automatically adjusts size based on device type
          </DynamicText>
        </div>

        {/* Touch-Friendly Wrapper */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Touch-Friendly Elements:</h3>
          <div className="flex gap-4">
            <TouchWrapper>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                Touch Button
              </button>
            </TouchWrapper>
            <TouchWrapper>
              <div className="bg-gray-200 px-4 py-2 rounded cursor-pointer hover:bg-gray-300 transition-colors">
                Touch Area
              </div>
            </TouchWrapper>
          </div>
        </div>

        {/* Orientation Adapter */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Orientation-Aware Layout:</h3>
          <OrientationAdapter
            portraitComponent={
              <div className="bg-green-100 p-4 rounded-lg">
                <h4 className="font-semibold">Portrait Mode</h4>
                <p className="text-sm">Vertical layout optimized for mobile viewing</p>
              </div>
            }
            landscapeComponent={
              <div className="bg-purple-100 p-4 rounded-lg">
                <h4 className="font-semibold">Landscape Mode</h4>
                <p className="text-sm">Horizontal layout with side-by-side content</p>
              </div>
            }
          />
        </div>

        {/* CSS Classes Demo */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">CSS Utility Classes:</h3>
          <div className="space-y-2">
            <div className="mobile-only bg-blue-100 p-2 rounded text-sm">📱 Mobile Only (CSS class)</div>
            <div className="tablet-only bg-green-100 p-2 rounded text-sm">📱 Tablet Only (CSS class)</div>
            <div className="desktop-only bg-purple-100 p-2 rounded text-sm">🖥️ Desktop Only (CSS class)</div>
            <div className="touch-target bg-yellow-100 p-2 rounded text-sm">👆 Touch Target (44px min)</div>
            <div className="safe-top safe-bottom bg-gray-100 p-2 rounded text-sm">📱 Safe Area (iOS notch)</div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
