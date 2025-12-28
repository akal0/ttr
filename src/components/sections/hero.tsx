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
import Lenis from "lenis";

const Hero = () => {
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>();
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [memberCount, setMemberCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Get the Lenis instance from window or create a new one
    lenisRef.current = (window as any).lenis || null;
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      setVideoDuration(video.duration);

      // Set isPaused to true when video ends
      const handleVideoEnd = () => {
        setIsPaused(true);
      };

      video.addEventListener("ended", handleVideoEnd);

      return () => {
        video.removeEventListener("ended", handleVideoEnd);
      };
    }
  }, []);

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
      className="flex flex-col h-full w-full relative bg-transparent"
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

      <div className="flex justify-center md:justify-between items-center py-8 md:max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-[-0.15rem]"> TTR </h1>

        <nav className="gap-6 text-sm tracking-tight relative z-10 hidden md:flex">
          <Link
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              lenisRef.current?.scrollTo("#home", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Home
          </Link>
          <Link
            href="#testimonials"
            onClick={(e) => {
              e.preventDefault();
              lenisRef.current?.scrollTo("#testimonials", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              lenisRef.current?.scrollTo("#about", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            About us
          </Link>
          <Link
            href="#payouts"
            onClick={(e) => {
              e.preventDefault();
              lenisRef.current?.scrollTo("#payouts", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Payouts
          </Link>
          <Link
            href="#faqs"
            onClick={(e) => {
              e.preventDefault();
              lenisRef.current?.scrollTo("#faqs", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            FAQs
          </Link>
        </nav>
      </div>

      <div className="flex flex-col gap-8 items-center justify-center h-full mt-4 md:mt-20 px-8 md:px-0 md:max-w-7xl mx-auto ">
        {/* Hero content */}
        <div className="flex flex-col gap-8 items-center justify-center h-full">
          <div className="flex flex-col gap-4 md:gap-8 items-center justify-center">
            <TextEffect
              preset="fade-in-blur"
              speedReveal={1.1}
              speedSegment={0.3}
              as="h1"
              className="text-4xl md:text-6xl font-medium md:tracking-[-0.12rem] text-center md:leading-17"
              segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
            >
              Master prop firm trading and build six-figure accounts in 6 months
            </TextEffect>

            <div className="flex flex-col gap-3">
              <TextEffect
                per="char"
                delay={1.5}
                speedReveal={1.5}
                speedSegment={0.3}
                className="max-w-2xl text-center tracking-tight font-medium text-lg"
                preset="fade-in-blur"
              >
                Tired of being stuck in the same cycle? Lose. Win. Lose. Lose
                Lose.
              </TextEffect>

              <TextEffect
                per="char"
                delay={3.25}
                speedReveal={3.5}
                speedSegment={0.3}
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
            transition={{ duration: 1.5, delay: 5.5 }}
          >
            Take your first step to profitability
          </BuyButton>
        </div>

        {/* Hero video */}

        <div
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
        </div>
      </div>
    </div>
  );
};

export default Hero;
