/**
 * Darwinex Stats Scraper
 * Scrapes trading statistics from Darwinex invest pages using Cheerio
 * (Serverless-compatible - no Puppeteer needed)
 *
 * Note: Some stats require JavaScript execution and may not be available via simple HTML scraping.
 * Fallback values are used when scraping returns null.
 */

import * as cheerio from "cheerio";

/**
 * Fallback stats for values that may not be scrapable with static HTML
 * because Darwinex loads them dynamically with JavaScript.
 *
 * HOW TO UPDATE:
 * 1. Visit https://www.darwinex.com/invest/WLE in your browser
 * 2. Copy the displayed values for these metrics
 * 3. Update the values below
 *
 * Last updated: December 28, 2025
 */
const FALLBACK_STATS = {
  returnSinceInception: 31.17, // Return since inception %
  bestMonth: 8.21, // Best month %
  worstMonth: 0.0, // Worst month % (negative value)
};

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
 * Scrapes statistics from a Darwinex invest page using Cheerio
 * @param darwinCode - The DARWIN code (e.g., "WLE")
 * @returns Promise with the scraped statistics
 */
export async function scrapeDarwinexStats(
  darwinCode: string,
): Promise<DarwinexStats> {
  const url = `https://www.darwinex.com/invest/${darwinCode}`;

  try {
    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch page: ${response.status} ${response.statusText}`,
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Helper function to parse numbers
    const parseNumber = (value: string | null | undefined): number | null => {
      if (!value) return null;
      const cleaned = value.replace(/[,%\s]/g, "");
      const num = parseFloat(cleaned);
      return Number.isNaN(num) ? null : num;
    };

    // Helper to get data-inc-value attribute
    const getDataIncValue = (selector: string): number | null => {
      const el = $(selector);
      if (!el.length) return null;
      const value = el.attr("data-inc-value");
      return parseNumber(value);
    };

    // Helper to get text after a label
    const getTextAfterLabel = (labelText: string): string | null => {
      const paragraphs = $("p");
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs.eq(i);
        if (p.text().includes(labelText)) {
          const nextP = p.next("p");
          if (nextP.length) {
            return nextP.text().trim() || null;
          }
        }
      }
      return null;
    };

    // Extract track record years
    const getTrackRecordYears = (): number | null => {
      const spans = $("span[data-inc-value]");
      for (let i = 0; i < spans.length; i++) {
        const span = spans.eq(i);
        const parent = span.parent().parent();
        if (parent.text().includes("Track Record")) {
          return parseNumber(span.attr("data-inc-value"));
        }
      }
      return null;
    };

    // Extract maximum drawdown
    const getMaximumDrawdown = (): number | null => {
      const spans = $("span[data-inc-value]");
      for (let i = 0; i < spans.length; i++) {
        const span = spans.eq(i);
        const parent = span.parent().parent();
        if (parent.text().includes("Maximum Drawdown")) {
          return parseNumber(span.attr("data-inc-value"));
        }
      }
      return null;
    };

    // Get annualized return
    const getAnnualizedReturn = (): number | null => {
      const value = getDataIncValue(".js-return-annualized");
      if (value !== null) return value;

      // Fallback: try to get from text content
      const el = $(".js-return-annualized");
      if (el.length && el.text()) {
        return parseNumber(el.text());
      }
      return null;
    };

    const bodyText = $.text();

    // Enhanced getter with multiple fallback strategies
    const getReturnSinceInception = (): number | null => {
      // Try primary selector
      let value = getDataIncValue(".js-return-total");
      if (value !== null) return value;

      // Try finding by text context
      $("span[data-inc-value], div[data-inc-value]").each((_, el) => {
        const element = $(el);
        const parent = element.parent();
        const parentText = parent.text().toLowerCase();
        if (parentText.includes("return") && parentText.includes("inception")) {
          const val = parseNumber(element.attr("data-inc-value"));
          if (val !== null) {
            value = val;
            return false; // break the loop
          }
        }
      });

      return value;
    };

    const getBestMonth = (): number | null => {
      // Try primary selector
      let value = getDataIncValue(".js-return-best-month");
      // Darwinex sets data-inc-value='0' initially, which means no real value
      if (value !== null && value !== 0) return value;

      // Try finding by text context
      $("span[data-inc-value], div[data-inc-value]").each((_, el) => {
        const element = $(el);
        const parent = element.parent();
        const parentText = parent.text().toLowerCase();
        if (parentText.includes("best") && parentText.includes("month")) {
          const val = parseNumber(element.attr("data-inc-value"));
          if (val !== null && val !== 0) {
            value = val;
            return false; // break the loop
          }
        }
      });

      return value !== 0 ? value : null;
    };

    const getWorstMonth = (): number | null => {
      // Try primary selector
      let value = getDataIncValue(".js-return-worst-month");
      // Darwinex sets data-inc-value='0' initially, which means no real value
      if (value !== null && value !== 0) return value;

      // Try finding by text context
      $("span[data-inc-value], div[data-inc-value]").each((_, el) => {
        const element = $(el);
        const parent = element.parent();
        const parentText = parent.text().toLowerCase();
        if (parentText.includes("worst") && parentText.includes("month")) {
          const val = parseNumber(element.attr("data-inc-value"));
          if (val !== null && val !== 0) {
            value = val;
            return false; // break the loop
          }
        }
      });

      return value !== 0 ? value : null;
    };

    // Get scraped values
    const scrapedReturnSinceInception = getReturnSinceInception();
    const scrapedBestMonth = getBestMonth();
    const scrapedWorstMonth = getWorstMonth();

    const stats: DarwinexStats = {
      returnSinceInception:
        scrapedReturnSinceInception !== null
          ? scrapedReturnSinceInception
          : FALLBACK_STATS.returnSinceInception,
      annualizedReturn: getAnnualizedReturn(),
      trackRecordYears: getTrackRecordYears(),
      maximumDrawdown: getMaximumDrawdown(),
      bestMonth:
        scrapedBestMonth !== null ? scrapedBestMonth : FALLBACK_STATS.bestMonth,
      worstMonth:
        scrapedWorstMonth !== null
          ? scrapedWorstMonth
          : FALLBACK_STATS.worstMonth,
      numberOfTrades: parseNumber(getTextAfterLabel("Number of trades")),
      averageTradeDuration: getTextAfterLabel("Average trade duration"),
      winningTradesRatio: parseNumber(getTextAfterLabel("Winning trades")),
      currentInvestors: (() => {
        const match = bodyText.match(/(\d+)\s*portfolios/i);
        return match ? parseNumber(match[1]) : null;
      })(),
      aum: (() => {
        const match = bodyText.match(/\$\s*([\d,]+)\s*AUM/i);
        return match ? parseNumber(match[1]) : null;
      })(),
      lastUpdated: new Date().toISOString(),
    };

    console.log("[Darwinex Scraper] Stats extracted:", {
      returnSinceInception: stats.returnSinceInception,
      bestMonth: stats.bestMonth,
      worstMonth: stats.worstMonth,
      usedFallback:
        scrapedReturnSinceInception === null ||
        scrapedBestMonth === null ||
        scrapedWorstMonth === null,
    });

    return stats;
  } catch (error) {
    throw new Error(
      `Failed to scrape Darwinex stats: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Formats the stats for display
 */
export function formatDarwinexStats(stats: DarwinexStats): string {
  const formatValue = (value: number | string | null, suffix = ""): string => {
    if (value === null) return "N/A";
    return `${value}${suffix}`;
  };

  return `
DARWIN Trading Statistics (as of ${new Date(
    stats.lastUpdated,
  ).toLocaleString()})

Performance Metrics:
- Return Since Inception: ${formatValue(stats.returnSinceInception, "%")}
- Annualized Return: ${formatValue(stats.annualizedReturn, "%")}
- Track Record: ${formatValue(stats.trackRecordYears, " years")}
- Maximum Drawdown: ${formatValue(stats.maximumDrawdown, "%")}
- Best Month: ${formatValue(stats.bestMonth, "%")}
- Worst Month: ${formatValue(stats.worstMonth, "%")}

Trading Activity:
- Number of Trades: ${formatValue(stats.numberOfTrades)}
- Average Trade Duration: ${formatValue(stats.averageTradeDuration)}
- Winning Trades Ratio: ${formatValue(stats.winningTradesRatio, "%")}

Investment Info:
- Current Investors: ${formatValue(stats.currentInvestors)}
- Assets Under Management: $${formatValue(stats.aum)}
  `.trim();
}
