# Darwinex Stats Scraping - Technical Analysis & Solution

## Problem Summary

The Darwinex invest page (https://www.darwinex.com/invest/WLE) loads certain statistics **dynamically using JavaScript**:
- Return Since Inception
- Best Month  
- Worst Month

These values are set to `data-inc-value='0'` in the initial HTML and populated via JavaScript animation after page load.

## Why Cheerio Can't Get These Values

Cheerio is a server-side HTML parser that cannot execute JavaScript. When we fetch the Darwinex page:

```html
<!-- What we get in the HTML: -->
<span class='is-number-animated js-return-best-month'
      data-inc-duration='1300'
      data-inc-value='0'  <!-- Always 0 in initial HTML -->
```

The actual values (like 18.45%) are only injected after JavaScript executes in a browser.

## What DOES Work with Cheerio

These stats work fine because they're in the initial HTML:
- ✅ Annualized Return (data-inc-value present)
- ✅ Track Record Years
- ✅ Maximum Drawdown
- ✅ Number of Trades
- ✅ Winning Trades Ratio
- ✅ Average Trade Duration

## Solutions

### Option 1: Puppeteer-as-a-Service (RECOMMENDED for production)
Use a service like **Browserless.io** or **Playwright** on a separate server:
- Handles JavaScript execution
- Works with Vercel serverless
- Costs ~$20-40/month
- Most reliable

**Implementation:**
```typescript
const response = await fetch('https://chrome.browserless.io/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.BROWSERLESS_API_KEY}`
  },
  body: JSON.stringify({
    url: 'https://www.darwinex.com/invest/WLE',
    waitFor: 3000  // Wait for JS to load
  })
});
```

### Option 2: Darwinex API (if available)
Darwinex may have an API but it's not publicly documented. Would need to contact them.

### Option 3: Cached/Manual Values (CURRENT SOLUTION)
Update values manually every week/month:
- Quick to implement  
- Free
- Requires manual updates
- Values slightly outdated but acceptable for marketing

## Current Implementation

We're using **Option 3** with fallback values that you update periodically:

```typescript
const FALLBACK_STATS = {
  returnSinceInception: 31.17,  // Update from website
  bestMonth: 18.45,
  worstMonth: -12.33,
};
```

**To update:** Visit https://www.darwinex.com/invest/WLE and update these values in `src/lib/darwinex-scraper.ts`

## Recommendation

For now, use the fallback values and update them weekly. If you need real-time data, implement Option 1 with Browserless.io.
