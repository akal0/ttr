import { Button } from "./ui/button";

interface VideoPlayerControlsProps {
  progress: number;
  isPaused: boolean;
  onPlayPause: () => void;
  onFullscreen?: () => void;
  size?: number | undefined;
  width?: number | undefined;
}

import PlayIcon from "../../public/play.svg";
import PauseIcon from "../../public/pause.svg";
import { Maximize } from "lucide-react";

const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  progress,
  isPaused,
  onPlayPause,
  onFullscreen,
  size = 40,
  width = 3.5,
}) => {
  const center = size / 2;
  const radius = center - width;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray * (1 - progress);

  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex justify-center items-center">
        {" "}
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#2f2f2f"
            strokeWidth={width}
          />

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#009EEC"
            strokeWidth={width}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>{" "}
        <div className="absolute">
          <button
            className="group cursor-pointer flex justify-center items-center "
            onClick={onPlayPause}
          >
            <div className="fill-white group-hover:fill-[#009EEC] transition-colors duration-200 ease-in-out">
              {isPaused ? (
                <PlayIcon className="size-3" />
              ) : (
                <PauseIcon className="size-3" />
              )}
            </div>
          </button>
        </div>
      </div>

      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="group p-2 cursor-pointer rounded-lg transition-colors"
          aria-label="Toggle fullscreen"
        >
          <Maximize className="size-6 text-white group-hover:text-[#009EEC] transition-colors" />
        </button>
      )}
    </div>
  );
};

export default VideoPlayerControls;
