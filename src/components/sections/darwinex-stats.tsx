"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { TextEffect } from "../ui/text-effect";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";

/**
 * Darwinex Stats Display Component
 * Client Component that fetches live stats from the API route
 */

interface DarwinexStatsData {
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

const DarwinexStats = () => {
  const [stats, setStats] = useState<DarwinexStatsData | null>(null);
  const [displayStats, setDisplayStats] = useState<DarwinexStatsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [avgDurationHours, setAvgDurationHours] = useState(0);
  const [avgDurationMinutes, setAvgDurationMinutes] = useState(0);
  const [displayDurationHours, setDisplayDurationHours] = useState(0);
  const [displayDurationMinutes, setDisplayDurationMinutes] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/darwinex-stats?code=WLE");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);

        // Parse average trade duration (e.g., "9H26M")
        if (data.averageTradeDuration) {
          const match = data.averageTradeDuration.match(/(\d+)H(\d+)M/);
          if (match) {
            setAvgDurationHours(parseInt(match[1], 10));
            setAvgDurationMinutes(parseInt(match[2], 10));
          }
        }

        // Initialize displayStats with 0 values for animated numbers
        setDisplayStats({
          ...data,
          returnSinceInception: 0,
          annualizedReturn: 0,
          trackRecordYears: 0,
          maximumDrawdown: 0,
          bestMonth: 0,
          worstMonth: 0,
          numberOfTrades: 0,
          winningTradesRatio: 0,
          currentInvestors: 0,
          aum: 0,
        });

        // Initialize duration display values to 0
        setDisplayDurationHours(0);
        setDisplayDurationMinutes(0);
      } catch (err) {
        console.error("Failed to fetch Darwinex stats:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Intersection Observer to detect when component is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView && stats) {
            setIsInView(true);
            // Trigger animation when in view
            setTimeout(() => {
              setDisplayStats(stats);
              setDisplayDurationHours(avgDurationHours);
              setDisplayDurationMinutes(avgDurationMinutes);
            }, 300);
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the component is visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [stats, isInView, avgDurationHours, avgDurationMinutes]);

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full p-8 rounded-xl bg-linear-to-br from-white/5 to-white/3 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-white font-medium">
            Loading stats...
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats || !displayStats) {
    return (
      <div className="w-full p-8 rounded-3xl border border-sky-200/5 bg-sky-100/1 border border-white/10">
        <p className="text-white font-medium text-center">
          Unable to load Darwinex statistics. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-sky-200/5 backdrop-blur-sm"
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-8 pb-1">
          <TextEffect
            preset="fade-in-blur"
            speedReveal={1.1}
            speedSegment={0.3}
            as="h1"
            className="text-3xl font-medium tracking-[-0.1rem]"
            segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
          >
            Darwinex trading performance
          </TextEffect>

          <Link
            href="https://www.darwinex.com/invest/WLE"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "gradient" }))}
          >
            View on Darwinex →
          </Link>
        </div>

        {/* Main Stats Grid */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 px-8">
          {/* Return Since Inception */}
          <div className="flex flex-col gap-1 p-4 rounded-xl border border-sky-200/5 bg-sky-100/1">
            <span className="text-sm text-white font-medium">
              Return since inception
            </span>
            <span className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-emerald-300 tracking-tighter">
              {displayStats.returnSinceInception !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.returnSinceInception}
                    decimals={2}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-emerald-300 tracking-tighter"
                  />
                  %
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* Annualized Return */}
          <div className="flex flex-col gap-1 p-4 rounded-xl border border-sky-200/5 bg-sky-100/1">
            <span className="text-sm text-white font-medium">
              Annualized return
            </span>
            <span className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300">
              {displayStats.annualizedReturn !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.annualizedReturn}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
                  />
                  %
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* Track Record */}
          <div className="flex flex-col gap-1 p-4 rounded-xl border border-sky-200/5 bg-sky-100/1">
            <span className="text-sm text-white font-medium">Track record</span>
            <span className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300">
              {displayStats.trackRecordYears !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.trackRecordYears}
                    decimals={1}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="text-3xl font-medium tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
                  />{" "}
                  years
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* Maximum Drawdown */}
          <div className="flex flex-col gap-1 p-4 rounded-xl border border-sky-200/5 bg-sky-100/1">
            <span className="text-sm text-white font-medium">
              Maximum drawdown
            </span>
            <span className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-red-300">
              {displayStats.maximumDrawdown !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.maximumDrawdown}
                    decimals={2}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-red-300 tracking-tighter"
                  />
                  %
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* Best Month */}
          <div className="flex flex-col gap-1 p-4 rounded-xl border border-sky-200/5 bg-sky-100/1">
            <span className="text-sm text-white font-medium">Best month</span>
            <span className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-emerald-300">
              {displayStats.bestMonth !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.bestMonth}
                    decimals={2}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-emerald-300 tracking-tighter"
                  />
                  %
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* Worst Month */}
          <div className="flex flex-col gap-1 p-4 rounded-xl border border-sky-200/5 bg-sky-100/1">
            <span className="text-sm text-white font-medium">Worst month</span>
            <span className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-red-300">
              {displayStats.worstMonth !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.worstMonth}
                    decimals={2}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="text-3xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-red-300 tracking-tighter"
                  />
                  %
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>
        </div>

        <Separator className="bg-sky-200/5" />

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 px-8 h-full justify-items-stretch pb-6">
          <div className="flex flex-col gap-1 h-full justify-between">
            <span className="text-xs text-white font-medium">
              Number of trades
            </span>
            <span className="md:text-xl font-semibold text-white">
              {displayStats.numberOfTrades !== null ? (
                <AnimatedNumber
                  value={displayStats.numberOfTrades}
                  springOptions={{ stiffness: 50, damping: 20 }}
                  className="text-lg md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter"
                />
              ) : (
                "N/A"
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1 h-full justify-between">
            <span className="text-xs text-white font-medium">
              Average trade duration
            </span>
            <span className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tight">
              {avgDurationHours > 0 || avgDurationMinutes > 0 ? (
                <>
                  <AnimatedNumber
                    value={displayDurationHours}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter"
                  />{" "}
                  hours{" "}
                  <AnimatedNumber
                    value={displayDurationMinutes}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter"
                  />{" "}
                  minutes
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1 h-full justify-between">
            <span className="text-xs text-white font-medium">
              Assets under management
            </span>
            <span className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter">
              {displayStats.aum !== null ? (
                <>
                  $
                  <AnimatedNumber
                    value={displayStats.aum}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter"
                  />
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1 h-full justify-between">
            <span className="text-xs text-white font-medium">Win rate</span>
            <span className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter">
              {displayStats.winningTradesRatio !== null ? (
                <>
                  <AnimatedNumber
                    value={displayStats.winningTradesRatio}
                    springOptions={{ stiffness: 50, damping: 20 }}
                    className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter"
                  />
                  %
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1 h-full justify-between">
            <span className="text-xs text-white font-medium">Investors</span>
            <span className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300">
              {displayStats.currentInvestors !== null ? (
                <AnimatedNumber
                  value={displayStats.currentInvestors}
                  springOptions={{ stiffness: 50, damping: 20 }}
                  className="md:text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300 tracking-tighter"
                />
              ) : (
                "N/A"
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarwinexStats;
