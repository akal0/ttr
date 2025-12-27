"use client";

import { RadialBar, RadialBarChart, Cell } from "recharts";
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
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { issue: "No clear rules", value: 22, fill: "rgba(59,130,246,0.65)" },
  { issue: "Overtrading", value: 24, fill: "rgba(59,130,246,0.5)" },
  { issue: "Emotional trading", value: 28, fill: "#AD46FF" },
  { issue: "Risk management", value: 28, fill: "#FF2157 " },
  { issue: "Strategy hopping", value: 36, fill: "#FE9900" },
];

const chartConfig = {
  value: {
    label: "Traders affected",
  },
} satisfies ChartConfig;

type ActiveIssue = string | null;

const RealityCheckRadialChart = () => {
  const [activeIssue, setActiveIssue] = useState<ActiveIssue>(null);
  const [animatedData, setAnimatedData] = useState(chartData.map(d => ({ ...d, value: 0 })));
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setAnimatedData(chartData);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <Card ref={cardRef} className="bg-[#020513] border-white/5 text-white">
      <CardHeader className="">
        <CardTitle className=" font-medium">
          Why most traders don’t pass
        </CardTitle>
        <CardDescription className="text-white/60">
          The real reasons traders fail funded challenges
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[240px]"
        >
          <RadialBarChart
            data={animatedData}
            innerRadius={30}
            outerRadius={110}
            onMouseMove={(state) => {
              const payload = state?.activePayload?.[0]?.payload;
              if (payload) setActiveIssue(payload.issue);
            }}
            onMouseLeave={() => setActiveIssue(null)}
          >
            <ChartTooltip
              cursor={false}
              content={({ payload }) => {
                if (!payload || !payload.length) return null;

                const { issue, value } = payload[0].payload;

                return (
                  <div className="rounded-md bg-[#050922] border border-white/10 px-3 py-2 text-sm text-white shadow-lg">
                    <div className="font-medium">{issue}</div>
                    <div className="text-white/70">{value}% of traders</div>
                  </div>
                );
              }}
            />

            <RadialBar dataKey="value" cornerRadius={10} className="shadow-lg">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="none"
                  opacity={
                    activeIssue === null || activeIssue === entry.issue
                      ? 1
                      : 0.125
                  }
                  filter={
                    activeIssue === entry.issue
                      ? `url(#radial-glow)`
                      : undefined
                  }
                />
              ))}
            </RadialBar>

            <defs>
              <filter
                id="radial-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feColorMatrix
                  type="matrix"
                  values="
                    0 0 0 0 0.23
                    0 0 0 0 0.51
                    0 0 0 0 0.96
                    0 0 0 1 0
                  "
                />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default RealityCheckRadialChart;
