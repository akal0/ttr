/**
 * Darwinex Stats Scraper
 * Scrapes trading statistics from Darwinex invest pages using Puppeteer
 */

import puppeteer from 'puppeteer';

export interface DarwinexStats {
  returnSinceInception: number | null;
  annualizedReturn: number | null;
  trackRecordYears: number | null;
  maximumDrawdown: number | null;
  bestMonth: number | null;
  worstMonth: number | null;
  numberOfTrades: number | null;
  averageTradeDuration: string | null;
  winningTradesRatio: number | null;
  currentInvestors: number | null;
  aum: number | null;
  lastUpdated: string;
}

/**
 * Scrapes statistics from a Darwinex invest page using Puppeteer
 * @param darwinCode - The DARWIN code (e.g., "WLE")
 * @returns Promise with the scraped statistics
 */
export async function scrapeDarwinexStats(
  darwinCode: string
): Promise<DarwinexStats> {
  const url = `https://www.darwinex.com/invest/${darwinCode}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for specific elements to ensure page is loaded
    try {
      await page.waitForSelector('.js-return-total, .js-return-annualized', {
        timeout: 10000,
      });
    } catch (e) {
      console.log('Stats elements not found, trying anyway...');
    }

    // Wait a bit for any animations/dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract stats using page.evaluate
    const stats = await page.evaluate(() => {
      const parseNumber = (value: string | null | undefined): number | null => {
        if (!value) return null;
        const cleaned = value.replace(/[,%\s]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      const getDataIncValue = (selector: string): number | null => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const value = el.getAttribute('data-inc-value');
        return parseNumber(value);
      };

      const getTextAfterLabel = (labelText: string): string | null => {
        const elements = Array.from(document.querySelectorAll('p'));
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].textContent?.includes(labelText)) {
            const nextP = elements[i].nextElementSibling;
            if (nextP && nextP.tagName === 'P') {
              return nextP.textContent?.trim() || null;
            }
          }
        }
        return null;
      };

      return {
        returnSinceInception: getDataIncValue('.js-return-total'),
        annualizedReturn: getDataIncValue('.js-return-annualized') ?? (() => {
          // Fallback: try to get from text content
          const el = document.querySelector('.js-return-annualized');
          if (el && el.textContent) {
            return parseNumber(el.textContent);
          }
          return null;
        })(),
        trackRecordYears: (() => {
          const spans = Array.from(document.querySelectorAll('span[data-inc-value]'));
          for (const span of spans) {
            const parent = span.parentElement?.parentElement;
            if (parent?.textContent?.includes('Track Record')) {
              return parseNumber(span.getAttribute('data-inc-value'));
            }
          }
          return null;
        })(),
        maximumDrawdown: (() => {
          const spans = Array.from(document.querySelectorAll('span[data-inc-value]'));
          for (const span of spans) {
            const parent = span.parentElement?.parentElement;
            if (parent?.textContent?.includes('Maximum Drawdown')) {
              return parseNumber(span.getAttribute('data-inc-value'));
            }
          }
          return null;
        })(),
        bestMonth: getDataIncValue('.js-return-best-month'),
        worstMonth: getDataIncValue('.js-return-worst-month'),
        numberOfTrades: parseNumber(getTextAfterLabel('Number of trades')),
        averageTradeDuration: getTextAfterLabel('Average trade duration'),
        winningTradesRatio: parseNumber(getTextAfterLabel('Winning trades')),
        currentInvestors: (() => {
          const bodyText = document.body.textContent || '';
          const match = bodyText.match(/(\d+)\s*portfolios/i);
          return match ? parseNumber(match[1]) : null;
        })(),
        aum: (() => {
          const bodyText = document.body.textContent || '';
          const match = bodyText.match(/\$\s*([\d,]+)\s*AUM/i);
          return match ? parseNumber(match[1]) : null;
        })(),
        lastUpdated: new Date().toISOString(),
      };
    });

    await browser.close();
    return stats;
  } catch (error) {
    await browser.close();
    throw new Error(
      `Failed to scrape Darwinex stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Formats the stats for display
 */
export function formatDarwinexStats(stats: DarwinexStats): string {
  const formatValue = (value: number | string | null, suffix = ''): string => {
    if (value === null) return 'N/A';
    return `${value}${suffix}`;
  };

  return `
DARWIN Trading Statistics (as of ${new Date(stats.lastUpdated).toLocaleString()})

Performance Metrics:
- Return Since Inception: ${formatValue(stats.returnSinceInception, '%')}
- Annualized Return: ${formatValue(stats.annualizedReturn, '%')}
- Track Record: ${formatValue(stats.trackRecordYears, ' years')}
- Maximum Drawdown: ${formatValue(stats.maximumDrawdown, '%')}
- Best Month: ${formatValue(stats.bestMonth, '%')}
- Worst Month: ${formatValue(stats.worstMonth, '%')}

Trading Activity:
- Number of Trades: ${formatValue(stats.numberOfTrades)}
- Average Trade Duration: ${formatValue(stats.averageTradeDuration)}
- Winning Trades Ratio: ${formatValue(stats.winningTradesRatio, '%')}

Investment Info:
- Current Investors: ${formatValue(stats.currentInvestors)}
- Assets Under Management: $${formatValue(stats.aum)}
  `.trim();
}
