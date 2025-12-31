"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { GlowEffect } from "../ui/glow-effect";
import { Button } from "../ui/button";
import { BorderTrail } from "../ui/border-trail";
import { useEffect, useRef, useState } from "react";
import VideoPlayerControls from "../video-player-controls";
import Image from "next/image";
import { TextEffect } from "../ui/text-effect";
import { motion } from "framer-motion";
import { BuyButton } from "../buy-button";
import { useLenis } from "@/lib/lenis-context";
import { CircleAlert } from "lucide-react";

const Hero = () => {
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>();
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [memberCount, setMemberCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useLenis();

  // Track video milestones
  const [videoMilestones, setVideoMilestones] = useState({
    started: false,
    watched25: false,
    watched50: false,
    watched75: false,
    completed: false,
  });

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      setVideoDuration(video.duration);

      // Set isPaused to true when video ends
      const handleVideoEnd = () => {
        setIsPaused(true);

        // Track video completion
        if (
          !videoMilestones.completed &&
          typeof window !== "undefined" &&
          (window as any).aureaSDK
        ) {
          (window as any).aureaSDK.trackEvent("video_completed", {
            duration: video.duration,
            watchTime: video.currentTime,
          });
          setVideoMilestones((m) => ({ ...m, completed: true }));
        }
      };

      // Track video start
      const handlePlay = () => {
        if (
          !videoMilestones.started &&
          typeof window !== "undefined" &&
          (window as any).aureaSDK
        ) {
          (window as any).aureaSDK.trackEvent("video_started", {
            videoTitle: "TTR Sales Video",
          });
          setVideoMilestones((m) => ({ ...m, started: true }));
        }
      };

      // Track video progress milestones
      const handleTimeUpdate = () => {
        if (!video.duration) return;

        const percent = (video.currentTime / video.duration) * 100;

        if (typeof window !== "undefined" && (window as any).aureaSDK) {
          if (percent >= 25 && !videoMilestones.watched25) {
            (window as any).aureaSDK.trackEvent("video_25_percent", {
              currentTime: video.currentTime,
              totalDuration: video.duration,
            });
            setVideoMilestones((m) => ({ ...m, watched25: true }));
          }
          if (percent >= 50 && !videoMilestones.watched50) {
            (window as any).aureaSDK.trackEvent("video_50_percent", {
              currentTime: video.currentTime,
              totalDuration: video.duration,
            });
            setVideoMilestones((m) => ({ ...m, watched50: true }));
          }
          if (percent >= 75 && !videoMilestones.watched75) {
            (window as any).aureaSDK.trackEvent("video_75_percent", {
              currentTime: video.currentTime,
              totalDuration: video.duration,
            });
            setVideoMilestones((m) => ({ ...m, watched75: true }));
          }
        }
      };

      video.addEventListener("ended", handleVideoEnd);
      video.addEventListener("play", handlePlay);
      video.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        video.removeEventListener("ended", handleVideoEnd);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [videoMilestones]);

  useEffect(() => {
    // Fetch member count
    const fetchMemberCount = async () => {
      try {
        const response = await fetch("/api/member-count");
        const data = await response.json();
        setMemberCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch member count:", error);
      }
    };

    fetchMemberCount();
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const currentTime = videoRef.current?.currentTime;

    if (videoDuration !== undefined && currentTime !== undefined) {
      let loadingTimeout = setTimeout(() => {
        if (videoProgress === currentTime / videoDuration) {
          setVideoProgress((prev) => prev + 0.000001);
        } else {
          setVideoProgress(currentTime / videoDuration);
        }
      }, 10);

      return () => clearTimeout(loadingTimeout);
    }
  }, [videoProgress, videoDuration, isPaused]);

  const togglePlayPause = () => {
    const video = videoRef.current;

    if (video) {
      setIsPaused(!video.paused);
      video.paused ? video.play() : video.pause();
    }
  };

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;

    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      id="home"
      className="flex flex-col h-full w-full relative bg-transparent min-h-screen "
    >
      <GlowEffect
        colors={["#1C6DF6", "#1557CC", "#2B7FFF", "#4A8FFF"]}
        mode="breathe"
        blur="strongest"
        duration={3}
        scale={1}
        className="h-[calc(100%-7%)] opacity-65!"
      />

      <Image
        src="/bg.png"
        fill
        className="object-cover absolute h-screen w-screen"
        alt="heroBackground"
      />

      <div className="relative w-full flex items-center justify-center py-8 md:py-5 z-10 text-center px-8">
        <GlowEffect
          colors={["#1C6DF6", "#1557CC", "#2B7FFF", "#4A8FFF"]}
          mode="breathe"
          blur="strongest"
          duration={3}
          scale={1}
          className="h-[calc(100%-7%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent backdrop-blur-2xl" />
        <h1 className="relative text-sm font-medium text-white/75">
          To celebrate the <span className="text-white">New Year</span>, we're
          giving back to you! Use code:
          <span className="text-white"> NEWYEAR </span> at checkout for{" "}
          <span className="text-white">50% off!</span> for the next{" "}
          <span className="text-white">48 hours</span> 🎉
        </h1>
      </div>

      <div className="flex justify-center md:justify-between items-center py-8 md:max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-[-0.15rem]"> TTR </h1>

        <nav className="gap-6 text-sm relative z-10 hidden md:flex">
          <Link
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#home", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Home
          </Link>
          <Link
            href="#testimonials"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#testimonials", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#about", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            About us
          </Link>
          <Link
            href="#payouts"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#payouts", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Darwinex
          </Link>
          <Link
            href="#faqs"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#faqs", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            FAQs
          </Link>
        </nav>
      </div>

      <div className="flex flex-col gap-8 items-center justify-center h-full mt-4 md:mt-20 px-4 md:px-0 md:max-w-7xl mx-auto relative z-10">
        {/* Hero content */}
        <div className="flex flex-col gap-8 items-center justify-center h-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center justify-center">
            <TextEffect
              preset="fade-in-blur"
              speedReveal={1.5}
              speedSegment={0.3}
              as="h1"
              className="text-4xl md:text-6xl font-medium md:tracking-[-0.12rem] text-center md:leading-17"
              segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
            >
              Master prop firm trading and build six-figure accounts in a couple
              months
            </TextEffect>

            <div className="flex flex-col gap-3">
              <TextEffect
                per="char"
                delay={1}
                speedReveal={2}
                speedSegment={1}
                className="max-w-2xl text-center tracking-tight font-medium text-lg"
                preset="fade-in-blur"
              >
                Tired of being stuck in the same cycle? Lose. Win. Lose. Lose
                Lose.
              </TextEffect>

              <TextEffect
                per="char"
                delay={1.5}
                speedReveal={3}
                speedSegment={1}
                className="max-w-2xl text-center tracking-tight text-white/85 font-medium"
                preset="fade-in-blur"
              >
                Join Tom's Trading Room and learn the secrets to success.
                Discover the exact frameworks hundreds of traders are using to
                pass prop firm challenges, secure six-figure funding and take
                their trading to the next level.
              </TextEffect>
            </div>
          </div>

          <BuyButton
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 3.5 }}
          >
            Take your first step to profitability
          </BuyButton>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 items-center relative z-20 h-full w-full mt-8">
          <motion.div
            className="rounded-3xl overflow-hidden relative z-10 h-103 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.5 }}
          >
            <Image
              src="/payouts/ftmo.jpeg"
              alt="lifetimeFTMO"
              fill
              className="object-cover object-center md:object-cover w-full h-full rounded-3xl"
            />
          </motion.div>

          <motion.div
            className="rounded-3xl overflow-hidden relative z-10 h-120 md:h-144 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 5.5 }}
          >
            <Image
              src="/payouts/fundingpips.jpeg"
              alt="lifetimeFundingPips"
              fill
              className="object-cover"
            />
          </motion.div>

          <motion.div
            className="rounded-3xl overflow-hidden relative z-10 w-full h-103"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 4.5 }}
          >
            <Image
              src="/payouts/e8.jpeg"
              alt="lifetimeE8"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
        {/* Hero video */}
        {/* <div
          ref={videoContainerRef}
          className="relative w-full aspect-video my-8 rounded-4xl overflow-hidden"
        >
          <div className="absolute top-4 right-4 z-10">
            <VideoPlayerControls
              progress={videoProgress}
              isPaused={isPaused}
              onPlayPause={togglePlayPause}
              onFullscreen={toggleFullscreen}
            />
          </div>

          <video
            className="w-full cursor-pointer"
            ref={videoRef}
            onClick={togglePlayPause}
            poster="/video-poster.png"
            preload="metadata"
            playsInline
          >
            <source src="/video.mp4" />
            <track kind="captions" />
          </video>
        </div> */}
      </div>
    </div>
  );
};

export default Hero;
