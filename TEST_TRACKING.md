# Test Aurea Tracking - Troubleshooting Guide

## Current Issue
Events are not being sent to Aurea CRM (`http://localhost:3000/api/track/events`)

## What We See in Console
- ✅ Purchase polling works: `GET /api/check-purchase 200`
- ❌ No POST requests to tracking endpoint
- ❌ Inngest errors (harmless - TTR doesn't have Inngest)

## Possible Causes

### 1. Events Are Queued But Not Flushed
The SDK batches events and sends them:
- Every **2 seconds** (batchInterval)
- Or when **10 events** are queued (batchSize)
- Or on **page unload**

**Test:** Wait 2-3 seconds after page load to see if batch is sent.

### 2. Debug Mode Was Off
We just enabled debug mode. Now you should see:
```javascript
[Aurea SDK] Initialized { sessionId, anonymousId, userId }
[Aurea SDK] Event tracked: page_view { ... }
[Aurea SDK] Events sent successfully: 1
```

### 3. CORS Issue
The tracking endpoint might reject requests from TTR.

**Check Network Tab:**
1. Open Chrome DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. Look for POST to `localhost:3000/api/track/events`
4. Check response status and headers

### 4. Configuration Issue
Verify environment variables are loaded:

**Open browser console and run:**
```javascript
console.log({
  apiKey: process.env.NEXT_PUBLIC_AUREA_API_KEY,
  funnelId: process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID,
  apiUrl: process.env.NEXT_PUBLIC_AUREA_API_URL
});
```

Should show:
```javascript
{
  apiKey: "aurea_sk_live_...",
  funnelId: "27c30cbc-661f-450a-a227-9cdcc662c366",
  apiUrl: "http://localhost:3000/api"
}
```

## Manual Test

### Test 1: Check SDK Instance
Open browser console and run:
```javascript
window.aurea
```

Should show the SDK instance. If undefined, SDK isn't initialized.

### Test 2: Manually Track Event
```javascript
window.aurea.track('test_event', { test: true });
```

Watch Network tab for POST request within 2 seconds.

### Test 3: Manually Flush Events
```javascript
window.aurea.flushEvents?.();
```

This should immediately send any queued events.

### Test 4: Check Event Queue
```javascript
// The SDK doesn't expose this, but we can check localStorage
localStorage.getItem('aurea_failed_events');
```

If events are failing, they'll be stored here.

## Expected Network Request

When working correctly, you should see in Network tab:

**Request:**
```
POST http://localhost:3000/api/track/events
```

**Headers:**
```
Content-Type: application/json
X-Aurea-API-Key: aurea_sk_live_...
X-Aurea-Funnel-ID: 27c30cbc-661f-450a-a227-9cdcc662c366
```

**Payload:**
```json
{
  "events": [
    {
      "eventId": "evt_1234567890_abc123",
      "eventName": "page_view",
      "properties": { ... },
      "context": { ... },
      "timestamp": 1234567890123
    }
  ],
  "batch": true
}
```

**Response:**
```json
{
  "success": true,
  "eventsReceived": 1
}
```

## Troubleshooting Steps

### Step 1: Check Browser Console
After page load, you should see:
```
✅ [Aurea SDK] Initialized Object
✅ [Aurea SDK] Event tracked: page_view Object
```

Wait 2 seconds, then:
```
✅ [Aurea SDK] Events sent successfully: 1
```

### Step 2: Check Network Tab
Look for:
```
POST localhost:3000/api/track/events → 200 OK
```

### Step 3: If POST Request Fails
Check the error in console:
```
❌ [Aurea SDK] Failed to send events: Error: ...
```

Common errors:
- **CORS:** Check Aurea CRM CORS settings
- **401 Unauthorized:** Check API key
- **404 Not Found:** Aurea CRM server not running
- **Network error:** Aurea CRM server not accessible

### Step 4: Verify Aurea CRM Server
In Aurea CRM project, run:
```bash
# Check if server is running
curl http://localhost:3000/api/track/events

# Should return error (no auth headers)
# But proves endpoint exists
```

### Step 5: Test with cURL
```bash
curl -X POST http://localhost:3000/api/track/events \
  -H "Content-Type: application/json" \
  -H "X-Aurea-API-Key: aurea_sk_live_..." \
  -H "X-Aurea-Funnel-ID: 27c30cbc-661f-450a-a227-9cdcc662c366" \
  -d '{
    "events": [{
      "eventId": "test_123",
      "eventName": "test_event",
      "properties": {},
      "context": {
        "session": { "sessionId": "test" },
        "user": { "anonymousId": "test" }
      },
      "timestamp": 1234567890
    }],
    "batch": true
  }'
```

Should return:
```json
{"success":true,"eventsReceived":1}
```

## Quick Fix: Force Event Send

If events are queued but not sending, add this to your browser console:

```javascript
// Check if SDK is loaded
if (window.aurea) {
  // Manually track an event
  window.aurea.track('manual_test', { source: 'console' });
  
  // Wait 3 seconds for batch to send
  setTimeout(() => {
    console.log('Check Network tab for POST request');
  }, 3000);
}
```

## Solution Checklist

- [ ] Debug mode enabled (see console messages)
- [ ] Aurea CRM server running on `localhost:3000`
- [ ] Environment variables loaded correctly
- [ ] No CORS errors in Network tab
- [ ] Events tracked in console
- [ ] POST request sent within 2 seconds
- [ ] Response 200 OK
- [ ] Events appear in Aurea CRM database

## Next Steps

1. **Enable debug mode** ✅ (already done)
2. **Refresh browser** and check console
3. **Wait 2-3 seconds** for batch to send
4. **Check Network tab** for POST request
5. **Report back** what you see in:
   - Browser console
   - Network tab
   - Any error messages

---

**Current Status:**
- ✅ Purchase polling fixed (no more 404s)
- ✅ Debug mode enabled
- ⏳ Waiting to see if events are sent
