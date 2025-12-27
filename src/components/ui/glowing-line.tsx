"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { useRef, useState, useEffect } from "react";
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
import { Button } from "./button";
import { GlowEffect } from "./glow-effect";
import { BuyButton } from "../buy-button";

const chartData = [
  { week: "Week 1", structured: 0, unstructured: 0 },
  { week: "Week 2", structured: 25, unstructured: 20 },
  { week: "Week 3", structured: 30, unstructured: 40 },
  { week: "Week 4", structured: 60, unstructured: 32 },
  { week: "Week 5", structured: 85, unstructured: 40 },
  { week: "Week 6", structured: 100, unstructured: 48 },
];

const chartConfig = {
  structured: {
    label: "With structure",
    color: "#3B82F6",
  },
  unstructured: {
    label: "Without structure",
    color: "rgba(255,255,255,0.25)",
  },
} satisfies ChartConfig;

export function AccountSurvivalChart() {
  const [animatedData, setAnimatedData] = useState(chartData.map(d => ({ ...d, structured: 0, unstructured: 0 })));
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
    <Card ref={cardRef} className="bg-[#020513] border-white/5 text-white h-full justify-between">
      <CardHeader>
        <CardTitle className="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300">
          Looking to take the next step?
        </CardTitle>
        <CardDescription className="text-white/75">
          Don't wait to make a change. Take action now.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <LineChart data={animatedData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />

            {/* <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
            /> */}

            <ChartTooltip
              cursor={false}
              content={({ payload, label }) => {
                if (!payload?.length) return null;

                const structured = payload.find(
                  (p) => p.dataKey === "structured"
                )?.value;

                const unstructured = payload.find(
                  (p) => p.dataKey === "unstructured"
                )?.value;

                return (
                  <div className="rounded-md bg-[#050922] border border-white/10 px-3 py-2 text-sm text-white shadow-lg max-w-[220px]">
                    {/* <div className="font-medium mb-1">{label}</div> */}

                    <div className="text-sky-300 font-medium">
                      With structure
                    </div>
                    <div className="text-white/70 leading-snug">
                      Operating with rules, risk control, and consistency.
                    </div>

                    <div className="mt-2 text-rose-400 font-medium">
                      Without structure
                    </div>
                    <div className="text-white/60 leading-snug">
                      Inconsistent execution, emotional decisions, slow
                      progress.
                    </div>
                  </div>
                );
              }}
            />

            {/* Without structure (underlay) */}
            <Line
              dataKey="unstructured"
              type="monotone"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.5}
              dot={false}
            />

            {/* With structure (highlight) */}
            <Line
              dataKey="structured"
              type="monotone"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={false}
              filter="url(#line-glow)"
            />

            <defs>
              <filter
                id="line-glow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        </ChartContainer>

        <div className="relative h-max px-4">
          <GlowEffect
            colors={["#1C6DF6", "#1557CC", "#2B7FFF", "#4A8FFF"]}
            mode="pulse"
            blur="medium"
            duration={3}
            scale={1}
          />

          <BuyButton className="relative text-[14px] rounded-[12px] w-full py-2!">
            Join the community
          </BuyButton>
        </div>
      </CardContent>
    </Card>
  );
}
