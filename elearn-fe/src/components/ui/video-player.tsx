"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Slider } from "./slider";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

interface VideoPlayerProps {
  src: string;
  lessonId: string;
  subtitles?: {
    src: string;
    label: string;
    language: string;
    default?: boolean;
  }[];
}

export function VideoPlayer({ src, lessonId, subtitles }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const watchTimeRef = useRef(0);

  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!videoRef.current) return;

      // Get actual video time in seconds
      const currentTime = Math.floor(videoRef.current.currentTime);
      watchTimeRef.current = currentTime;

      // Update progress every 30 seconds of video time
      if (currentTime % 30 === 0) {
        markLessonProgress();
      }
    };

    const markLessonProgress = async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchTime: watchTimeRef.current }),
        });

        const data = await response.json();

        if (data.success && watchTimeRef.current >= 60 && !isCompleted) {
          // 1 minute
          toast.success("Lesson marked as completed!");
          setIsCompleted(true);
        }
      } catch (error) {
        console.error("Failed to update lesson progress:", error);
      }
    };

    // Add timeupdate event listener
    video.addEventListener("timeupdate", handleTimeUpdate);

    // Cleanup
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);

      // Final progress update when component unmounts
      if (watchTimeRef.current > 0) {
        markLessonProgress();
      }
    };
  }, [lessonId, isCompleted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case "ArrowRight":
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;
        case "ArrowUp":
          const newVolumeUp = Math.min(1, video.volume + 0.05);
          video.volume = newVolumeUp;
          setVolume(newVolumeUp);
          break;
        case "ArrowDown":
          const newVolumeDown = Math.max(0, video.volume - 0.05);
          video.volume = newVolumeDown;
          setVolume(newVolumeDown);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSpeedChange = (value: string) => {
    if (videoRef.current) {
      const speed = parseFloat(value);
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const toggleSubtitles = () => {
    if (videoRef.current && videoRef.current.textTracks.length > 0) {
      const track = videoRef.current.textTracks[0];
      if (showSubtitles) {
        track.mode = "hidden";
      } else {
        track.mode = "showing";
      }
      setShowSubtitles(!showSubtitles);
    }
  };

  return (
    <div
      className="relative group bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video"
        onClick={togglePlay}
        style={
          {
            "--cue-position": "10%",
          } as React.CSSProperties
        }
      >
        {subtitles?.map((track, index) => (
          <track
            key={index}
            kind="subtitles"
            src={track.src}
            srcLang={track.language}
            label={track.label}
            default={track.default}
          />
        ))}
      </video>

      <style jsx>{`
        video::cue {
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 1em;
          line-height: 2;
          padding: 4px 8px;
        }
      `}</style>

      {/* Add global styles for subtitle positioning */}
      <style jsx global>{`
        ::cue {
          margin-bottom: 30px !important;
        }
        video::-webkit-media-text-track-container {
          transform: translateY(-80px);
        }
        video::-webkit-media-text-track-background {
          background-color: rgba(0, 0, 0, 0.7) !important;
        }
        video::-webkit-media-text-track-display {
          margin-bottom: 30px !important;
        }
      `}</style>

      {/* Video Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress Bar */}
        <div
          className="relative mb-4"
          onMouseEnter={() => setIsHoveringProgress(true)}
          onMouseLeave={() => setIsHoveringProgress(false)}
        >
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className={cn(
              "transition-all duration-200",
              isHoveringProgress ? "h-[10px]" : "h-[3px]"
            )}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Left side controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </Button>

            {/* Time Display */}
            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => handleVolumeChange([volume === 0 ? 1 : 0])}
              >
                {volume === 0 ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Subtitle Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={toggleSubtitles}
            >
              {showSubtitles ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"
                    opacity="0.5"
                  />
                </svg>
              )}
            </Button>

            {/* Speed Control - Updated styling */}
            <Select
              value={playbackSpeed.toString()}
              onValueChange={handleSpeedChange}
            >
              <SelectTrigger className="w-[70px] h-8 bg-transparent border-white/20 text-white hover:bg-white/20 focus:ring-0 focus:ring-offset-0">
                <span className="text-sm">{playbackSpeed}x</span>
              </SelectTrigger>
              <SelectContent className="min-w-[100px] bg-black/90 border-white/20">
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                  <SelectItem
                    key={speed}
                    value={speed.toString()}
                    className="text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                  >
                    {speed}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Fullscreen Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
