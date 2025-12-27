import SkillBalanceRadar from "../ui/animated-clipped-radar-chart";
import EquitySmoothnessChart from "../ui/animated-highlighted-chart";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AreaChartBento from "../ui/clipped-area-chart";
import { GlowEffect } from "../ui/glow-effect";
import { AccountSurvivalChart } from "../ui/glowing-line";
import RealityCheckRadialChart from "../ui/glowing-radial-chart";
import { TextEffect } from "../ui/text-effect";
import { Tilt } from "../ui/tilt";

const About = () => {
  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto py-16 gap-12">
      <div className="flex flex-col gap-2 items-center justify-center">
        <TextEffect
          preset="fade-in-blur"
          speedReveal={1.1}
          speedSegment={0.3}
          as="h1"
          className="text-5xl font-medium tracking-[-0.1rem] text-center leading-17"
          segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
        >
          So, what exactly is Tom's Trading Room?
        </TextEffect>

        <TextEffect
          per="char"
          speedReveal={3.5}
          speedSegment={0.3}
          className="text-center text-lg text-white/65 max-w-3xl mx-auto leading-7"
          preset="fade-in-blur"
        >
          Tom's Trading Room is a structured mentorship helping traders pass
          funded accounts through a proven strategy, within a disciplined
          community of both new and experienced traders.
        </TextEffect>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 h-full">
          <div className="w-full col-span-2 h-full">
            <AreaChartBento />
          </div>

          <div className="w-full h-max">
            <RealityCheckRadialChart />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 h-max">
          <div className="w-full h-full">
            <EquitySmoothnessChart />
          </div>

          <div className="w-full h-full">
            <SkillBalanceRadar />
          </div>

          <div className="w-full h-full">
            <AccountSurvivalChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
