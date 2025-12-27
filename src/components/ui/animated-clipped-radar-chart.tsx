"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from "recharts";
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

const chartData = [
  { skill: "Risk management", value: 82 },
  { skill: "Execution", value: 79 },
  { skill: "Consistency", value: 74 },
  { skill: "Trade management", value: 76 },
  { skill: "Process", value: 85 },
  { skill: "Market insight", value: 71 },
];

const chartConfig = {
  value: {
    label: "Skill level",
    color: "#3B82F6",
  },
} satisfies ChartConfig;

const SkillBalanceRadar = () => {
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
          A funded trader is balanced, not lucky
        </CardTitle>
        <CardDescription className="text-white/60">
          Performance comes from strength across every core skill
        </CardDescription>
      </CardHeader>

      <CardContent className="-mt-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[350px]"
        >
          <RadarChart
            data={animatedData}
            margin={{ top: 0, right: 40, bottom: 0, left: 40 }}
          >
            <PolarGrid stroke="rgba(255,255,255,0.08)" radialLines={true} />

            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 11 }}
            />

            <defs>
              <linearGradient id="skill-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <Radar
              dataKey="value"
              stroke="#3B82F6"
              fill="url(#skill-gradient)"
              fillOpacity={1}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SkillBalanceRadar;
