"use client";

import { useEffect, useState } from "react";

interface TrackedEvent {
  id: string;
  message: string;
}

export function SDKDebug() {
  const [status, setStatus] = useState<string>("Checking...");
  const [events, setEvents] = useState<TrackedEvent[]>([]);

  useEffect(() => {
    const checkSDK = () => {
      // Check if SDK is loaded
      if (typeof window !== 'undefined' && (window as any).aurea) {
        setStatus("✅ SDK Loaded");
        
        // Get SDK instance
        const sdk = (window as any).aurea;
        
        // Add event listener to track when events are sent
        const originalTrack = sdk.track.bind(sdk);
        sdk.track = function(...args: any[]) {
          const eventMessage = `Event: ${args[0]} at ${new Date().toLocaleTimeString()}`;
          setEvents(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            message: eventMessage
          }]);
          return originalTrack(...args);
        };
        
        console.log("[Debug] SDK Instance:", sdk);
        console.log("[Debug] Current Stage:", sdk.getCurrentStage?.());
        console.log("[Debug] Category Stats:", sdk.getCategoryStats?.());
      } else {
        setStatus("❌ SDK Not Loaded");
      }
    };

    // Check immediately and after a delay
    checkSDK();
    const timer = setTimeout(checkSDK, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const testEvent = () => {
    if (typeof window !== 'undefined' && (window as any).aurea) {
      const sdk = (window as any).aurea;
      console.log("[Debug] Sending test event...");
      sdk.trackEvent('debug_test_event', {
        test: true,
        timestamp: new Date().toISOString()
      });
      console.log("[Debug] Test event sent!");
    } else {
      alert("SDK not loaded!");
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999,
        border: '1px solid rgba(255,255,255,0.2)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
        Aurea SDK Debug
      </div>
      <div style={{ marginBottom: '10px' }}>
        Status: {status}
      </div>
      <button
        type="button"
        onClick={testEvent}
        style={{
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          marginBottom: '10px'
        }}
      >
        Send Test Event
      </button>
      
      {events.length > 0 && (
        <div style={{ marginTop: '10px', maxHeight: '150px', overflow: 'auto' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Events Tracked:
          </div>
          {events.slice(-5).map((event) => (
            <div key={event.id} style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px' }}>
              {event.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
