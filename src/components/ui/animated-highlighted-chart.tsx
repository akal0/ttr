"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import React, { useRef, useState, useEffect } from "react";
import { useInView } from "motion/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

// Keep the same animation mechanic
const animationConfig = { glowWidth: 300 };

// Equity “smoothness” comparison (not profit)
const chartData = [
  { step: "Week 0", before: 24, after: 24 },
  { step: "Week 1", before: 42, after: 32 },
  { step: "Week 2", before: 78, after: 44 },
  { step: "Week 3", before: 20, after: 48 },
  { step: "Week 4", before: 72, after: 52 },
  { step: "Week 5", before: 16, after: 54 },
  { step: "Week 6", before: 64, after: 58 },
  { step: "Week 7", before: 39, after: 62 },
  { step: "Week 8", before: 82, after: 66 },
  { step: "Week 9", before: 32, after: 72 },
  { step: "Week 10", before: 72, after: 78 },
  { step: "Week 11", before: 33, after: 82 },
  { step: "Week 12", before: 62, after: 86 },
];

const chartConfig = {
  before: {
    label: "Volatile equity",
    color: "rgba(255,255,255,0.40)",
  },
  after: {
    label: "Smooth equity",
    color: "#3B82F6",
  },
} satisfies ChartConfig;

const EquitySmoothnessChart = () => {
  const [xAxis, setXAxis] = React.useState<number | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <Card ref={cardRef} className="bg-[#020513] border-white/5 text-white h-full">
      <CardHeader>
        <CardTitle className="font-medium">Equity smoothness</CardTitle>
        <CardDescription className="text-white/60">
          When was the last time your equity was smooth?
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="h-64 w-full mt-8">
          <AreaChart
            accessibilityLayer
            data={chartData}
            onMouseMove={(e) => setXAxis(e?.chartX ?? null)}
            onMouseLeave={() => setXAxis(null)}
            margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
            />

            {/* <XAxis
              dataKey="step"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
            /> */}

            <ChartTooltip
              cursor={false}
              content={({ payload }) => {
                if (!payload?.length) return null;

                const weekLabel = payload[0]?.payload?.step || "";

                return (
                  <div className="rounded-md bg-[#050922] border border-white/10 px-3 py-2 text-sm text-white shadow-lg">
                    <div className="font-medium">{weekLabel}</div>
                  </div>
                );
              }}
            />

            <defs>
              {/* moving highlight mask gradient */}
              <linearGradient
                id="animated-highlighted-mask-grad"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              {/* BEFORE gradient */}
              <linearGradient
                id="animated-highlighted-grad-before"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="rgba(255,255,255,0.35)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="rgba(255,255,255,0.35)"
                  stopOpacity={0}
                />
              </linearGradient>

              {/* AFTER gradient */}
              <linearGradient
                id="animated-highlighted-grad-after"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>

              {xAxis !== null && (
                <mask id="animated-highlighted-mask">
                  <rect
                    x={xAxis - animationConfig.glowWidth / 2}
                    y={0}
                    width={animationConfig.glowWidth}
                    height="100%"
                    fill="url(#animated-highlighted-mask-grad)"
                  />
                </mask>
              )}
            </defs>

            {/* BEFORE (underlay) — no stackId */}
            {/* <Area
              dataKey="before"
              type="natural"
              fill="url(#animated-highlighted-grad-before)"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={1}
              mask="url(#animated-highlighted-mask)"
            /> */}

            {/* AFTER (overlay) — no stackId */}
            <Area
              dataKey="after"
              type="natural"
              fill="url(#animated-highlighted-grad-after)"
              stroke="#3B82F6"
              strokeWidth={2}
              mask="url(#animated-highlighted-mask)"
              style={{
                opacity: isAnimated ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default EquitySmoothnessChart;
