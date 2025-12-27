"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useRef, useState, useEffect } from "react";
import { useSpring, useMotionValueEvent, useInView } from "motion/react";

const chartData = [
  { week: "", consistency: 0 },
  { week: "W1", consistency: 9 },
  { week: "W2", consistency: 24 },
  { week: "W3", consistency: 18 },
  { week: "W4", consistency: 32 },
  { week: "W5", consistency: 43 },
  { week: "W6", consistency: 38 },
  { week: "W7", consistency: 55 },
  { week: "W8", consistency: 62 },
  { week: "W9", consistency: 68 },
  { week: "W10", consistency: 71 },
  { week: "W11", consistency: 73 },
  { week: "W12", consistency: 75 },
  { week: "", consistency: 75 },
];

const chartConfig = {
  consistency: {
    label: "Consistency",
    color: "#3B82F6",
  },
} satisfies ChartConfig;

const AreaChartBento = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [axis, setAxis] = useState(0);
  const inViewRef = useRef(null);
  const isInView = useInView(inViewRef, { once: true, amount: 0.3 });

  const springX = useSpring(0, { damping: 25, stiffness: 120 });
  const springY = useSpring(0, { damping: 25, stiffness: 120 });

  useMotionValueEvent(springX, "change", (latest) => {
    setAxis(latest);
  });

  useEffect(() => {
    if (isInView && chartRef.current) {
      const timer = setTimeout(() => {
        const width = chartRef.current?.getBoundingClientRect().width ?? 0;
        springX.set(width);
        springY.set(chartData.at(-1)?.consistency ?? 0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInView, springX, springY]);

  return (
    <Card ref={inViewRef} className="bg-[#020513] border-white/5 text-white h-full">
      <CardHeader className="">
        <CardTitle>Consistency over time</CardTitle>
        <CardDescription className="text-white/50">
          Performance stabilisation when you stop guessing.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <ChartContainer
          ref={chartRef}
          className="h-56 w-full"
          config={chartConfig}
        >
          <AreaChart
            data={chartData}
            onMouseMove={(state) => {
              const x = state.activeCoordinate?.x;
              const value = state.activePayload?.[0]?.value;
              if (x && value !== undefined) {
                springX.set(x);
                springY.set(value);
              }
            }}
            onMouseLeave={() => {
              springX.set(chartRef.current?.getBoundingClientRect().width ?? 0);
              springY.set(chartData.at(-1)?.consistency ?? 0);
            }}
            margin={{ left: 0, right: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              strokeOpacity={0.15}
            />

            <XAxis
              dataKey="week"
              tickLine={true}
              axisLine={false}
              tickMargin={12}
              width={100}
            />

            {/* Main animated area */}
            <Area
              dataKey="consistency"
              type="monotone"
              fill="url(#consistency-gradient)"
              stroke="var(--color-consistency)"
              fillOpacity={0.35}
              clipPath={`inset(0 ${
                (chartRef.current?.getBoundingClientRect().width ?? 0) - axis
              } 0 0)`}
            />

            {/* Cursor line */}
            <line
              x1={axis}
              y1={0}
              x2={axis}
              y2="90%"
              stroke="var(--color-consistency)"
              strokeDasharray="3 3"
              strokeOpacity={0.25}
            />

            {/* Value label */}
            <rect
              x={axis - 42}
              y={4}
              width={42}
              height={18}
              rx={4}
              fill="var(--color-consistency)"
            />
            <text
              x={axis - 21}
              y={17}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              fill="white"
            >
              {springY.get().toFixed(0)}%
            </text>

            {/* Ghost line */}
            <Area
              dataKey="consistency"
              type="monotone"
              fill="none"
              stroke="var(--color-consistency)"
              strokeOpacity={0.15}
            />

            <defs>
              <linearGradient
                id="consistency-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-consistency)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-consistency)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AreaChartBento;
