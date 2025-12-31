# All TTR Events - Complete Documentation

## Overview

Every event in TTR now has:
- ✅ **Category** - What type of event it is
- ✅ **Description** - What the event means
- ✅ **Value** - Impact score (0-100)
- ✅ **Color** (optional) - Custom display color in Aurea CRM

---

## Events by Category

### 1. VIEWING (Blue) - 7 events

Events when users view content on the page.

| Event | Value | Description |
|-------|-------|-------------|
| `page_view` | 5 | User viewed a page |
| `hero_viewed` | 10 | User scrolled to hero section |
| `testimonials_viewed` | 15 | User scrolled to testimonials section |
| `stats_viewed` | 20 | User scrolled to Darwinex stats section |
| `about_section_viewed` | 40 | User scrolled to about section |
| `benefits_section_viewed` | 55 | User read benefits section |
| `thank_you_page_viewed` | 5 | User viewed thank you page after purchase |

---

### 2. ENGAGEMENT (Purple) - 9 events

Events when users actively interact with content.

| Event | Value | Description |
|-------|-------|-------------|
| `video_started` | 30 | User started watching sales video |
| `video_25_percent` | 40 | User watched 25% of video |
| `video_50_percent` | 55 | User watched 50% of video |
| `video_75_percent` | 75 | User watched 75% of video - high intent! |
| `video_completed` | 85 | User watched entire video |
| `video_replayed` | 80 | User replayed video - very high intent |
| `check_email_clicked` | 10 | User clicked to check email on thank you page |
| `back_to_home_clicked` | 5 | User clicked back to home from thank you page |
| `support_email_clicked` | 10 | User clicked support email link |
| `discord_clicked` | 30 | User clicked Discord link |

---

### 3. HIGH_ENGAGEMENT (Fuchsia) - 1 event

Special engagement pattern detection.

| Event | Value | Color | Description |
|-------|-------|-------|-------------|
| `high_engagement_detected` | 85 | fuchsia | High engagement detected - rapid user interactions |

---

### 4. INTENT (Orange) - 7 events

Events showing purchase consideration signals.

| Event | Value | Description |
|-------|-------|-------------|
| `faq_opened` | 50 | User opened FAQ to research |
| `faq_multiple_opened` | 65 | User opened 3+ FAQs - researching heavily |
| `pricing_section_viewed` | 60 | User scrolled to pricing/CTA section |
| `cta_section_viewed` | 60 | User viewed CTA section |
| `cta_hovered` | 70 | User hovered over buy button |
| `contact_clicked` | 40 | User clicked contact link |
| `checkout_exit` | 0 | User exited checkout without completing |

---

### 5. CONVERSION (Green) - 5 events

Direct purchase actions.

| Event | Value | Description |
|-------|-------|-------------|
| `buy_button_clicked` | 90 | User clicked buy button - checkout initiated |
| `checkout_initiated` | 85 | User initiated checkout process |
| `whop_checkout_opened` | 92 | Whop checkout modal opened |
| `payment_info_entered` | 95 | User entered payment information |
| `checkout_completed` | 100 | User completed checkout - sale confirmed |

---

### 6. SESSION (Cyan) - 3 events

Session lifecycle and funnel tracking.

| Event | Value | Color | Description |
|-------|-------|-------|-------------|
| `session_start` | 0 | cyan | User session started |
| `session_end` | 0 | cyan | User session ended |
| `funnel_stage_entered` | 0 | cyan | User entered new funnel stage |

---

### 7. PERFORMANCE (Yellow) - 1 event

Web performance metrics.

| Event | Value | Color | Description |
|-------|-------|-------|-------------|
| `web_vital` | 0 | yellow | Core Web Vitals measurement |

---

### 8. CUSTOM (Gray) - 9 events

Custom tracking milestones.

| Event | Value | Description |
|-------|-------|-------------|
| `scroll_depth` | 10 | User scrolled to specific depth on page |
| `scroll_depth_25` | 15 | User scrolled 25% of page |
| `scroll_depth_50` | 25 | User scrolled 50% of page |
| `scroll_depth_75` | 45 | User scrolled 75% of page |
| `scroll_depth_90` | 50 | User scrolled 90% of page |
| `scroll_depth_100` | 55 | User scrolled to bottom of page |
| `time_on_page_30s` | 30 | User spent 30+ seconds on page |
| `time_on_page_60s` | 50 | User spent 60+ seconds on page |
| `time_on_page_120s` | 70 | User spent 2+ minutes on page - very engaged! |
| `time_on_page_180s` | 80 | User spent 3+ minutes on page |
| `time_on_page_300s` | 90 | User spent 5+ minutes on page |
| `debug_test_event` | 0 | Debug test event for SDK testing |

---

## Total Events: 42

| Category | Count | Color |
|----------|-------|-------|
| Viewing | 7 | Blue |
| Engagement | 10 | Purple |
| High Engagement | 1 | Fuchsia |
| Intent | 7 | Orange |
| Conversion | 5 | Green |
| Session | 3 | Cyan |
| Performance | 1 | Yellow |
| Custom | 12 | Gray |

---

## Event Flow Example

Typical user journey through TTR funnel:

```
1. [page_view]                  VIEWING      → User lands on page
2. [session_start]              SESSION      → Session begins
3. [hero_viewed]                VIEWING      → Hero section visible
4. [scroll_depth_25]            CUSTOM       → Scrolling down
5. [video_started]              ENGAGEMENT   → Video engagement begins
6. [video_50_percent]           ENGAGEMENT   → Watching video
7. [high_engagement_detected]   HIGH_ENG     → Rapid interactions!
8. [testimonials_viewed]        VIEWING      → Social proof check
9. [funnel_stage_entered]       SESSION      → Advanced to 'desire' stage
10. [faq_opened]                INTENT       → Research mode
11. [cta_section_viewed]        INTENT       → Ready to buy?
12. [buy_button_clicked]        CONVERSION   → Checkout initiated
13. [checkout_completed]        CONVERSION   → Sale! 🎉
14. [thank_you_page_viewed]     VIEWING      → Post-purchase
15. [session_end]               SESSION      → Session ends
```

---

## Auto-Tracked vs Manual Events

### Auto-Tracked by SDK
These events are automatically sent by the SDK:

- `page_view` - On every page load
- `scroll_depth` - At various scroll milestones
- `scroll_depth_25/50/75/90/100` - Specific milestones
- `time_on_page_*` - Time spent milestones
- `session_start` - When session begins
- `session_end` - When session ends
- `funnel_stage_entered` - When stage advances
- `web_vital` - Performance measurements

### Manually Tracked
These events are explicitly tracked in components:

**Video Events** (`src/components/sections/hero.tsx`):
- `video_started`
- `video_25_percent`
- `video_50_percent`
- `video_75_percent`
- `video_completed`

**CTA Events** (`src/components/sections/cta.tsx`):
- `cta_section_viewed`
- `discord_clicked`

**FAQ Events** (`src/components/sections/faq.tsx`):
- `faq_opened`
- `faq_multiple_opened`
- `contact_clicked`

**Checkout Events** (`src/components/buy-button.tsx`):
- `buy_button_clicked`
- `checkout_initiated`
- `checkout_exit`

**Thank You Events** (`src/app/thank-you/page.tsx`):
- `checkout_completed`
- `thank_you_page_viewed`
- `check_email_clicked`
- `back_to_home_clicked`
- `support_email_clicked`

**Section Tracking** (`src/lib/hooks/use-section-tracking.ts`):
- `hero_viewed`
- `testimonials_viewed`
- `stats_viewed`
- `about_section_viewed`
- `benefits_section_viewed`
- `pricing_section_viewed`
- `cta_hovered`
- `high_engagement_detected`

---

## Value Scoring System

Events are scored 0-100 based on conversion likelihood:

| Score Range | Meaning | Examples |
|-------------|---------|----------|
| 0-10 | Low value | page_view, session tracking |
| 11-30 | Moderate value | scroll_depth, time_on_page_30s |
| 31-60 | Medium value | video_started, faq_opened |
| 61-85 | High value | video_75_percent, high_engagement |
| 86-99 | Very high value | buy_button_clicked, checkout_initiated |
| 100 | Conversion | checkout_completed |

---

## Color Customization

Events with custom colors override category defaults:

| Event | Default Category | Custom Color | Result |
|-------|-----------------|--------------|--------|
| `high_engagement_detected` | engagement (purple) | fuchsia | Fuchsia badge |
| `session_start/end` | session | cyan | Cyan badge |
| `funnel_stage_entered` | session | cyan | Cyan badge |
| `web_vital` | performance | yellow | Yellow badge |

All other events use category default colors.

---

## trackOnce Behavior

Some events should only fire once per session:

**trackOnce: true** (only first occurrence counts):
- All viewing events (hero, testimonials, stats, etc.)
- Milestone events (faq_multiple_opened, high_engagement)
- Conversion events (buy_button_clicked, checkout_completed)
- Scroll/time milestones

**trackOnce: false** (can fire multiple times):
- Video events (can replay)
- faq_opened (can open different FAQs)
- Session/system events
- Support/contact clicks

---

## What Changed

### Before
```typescript
// Many events had no category or description
'scroll_depth': undefined
'funnel_stage_entered': undefined
'page_view': undefined
// ... etc
```

### After
```typescript
// ALL 42 events now have category + description
'scroll_depth': {
  category: 'custom',
  value: 10,
  description: 'User scrolled to specific depth on page'
}
'funnel_stage_entered': {
  category: 'session',
  color: 'cyan',
  value: 0,
  description: 'User entered new funnel stage'
}
'page_view': {
  category: 'viewing',
  value: 5,
  description: 'User viewed a page'
}
// ... all documented!
```

---

## Benefits

✅ **Complete Documentation** - Every event has context  
✅ **Better Insights** - Know what each event represents  
✅ **Easier Debugging** - Clear descriptions in CRM  
✅ **Consistent Categorization** - All events properly categorized  
✅ **Visual Clarity** - Color-coded by importance/type  

---

## File Location

All event registrations are in:
```
/ttr/src/components/aurea-tracking.tsx
Lines 47-345
```

---

**All 42 events documented!** ✅
