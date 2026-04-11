import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Plus, Film, Link } from 'lucide-react';
import { extractYouTubeId } from '../utils/helpers';
import type { VideoState } from '../types';

interface VideoPlayerProps {
  videoState: VideoState;
  onVideoSync: (state: VideoState) => void;
  isHost: boolean;
  onSetVideoUrl: () => void;
}

export default function VideoPlayer({ videoState, onVideoSync, isHost, onSetVideoUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const syncFromHost = useCallback((state: VideoState) => {
    if (!isHost && videoRef.current) {
      const diff = Math.abs(videoRef.current.currentTime - state.currentTime);
      if (diff > 1) {
        videoRef.current.currentTime = state.currentTime;
      }
      if (state.isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else if (!state.isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      setIsPlaying(state.isPlaying);
    }
  }, [isHost]);

  useEffect(() => {
    if (!isHost && videoState) {
      syncFromHost(videoState);
    }
  }, [videoState, isHost, syncFromHost]);

  useEffect(() => {
    if (isHost && videoRef.current && videoState.type !== 'youtube') {
      const interval = setInterval(() => {
        if (videoRef.current && !videoRef.current.paused) {
          onVideoSync({
            ...videoState,
            currentTime: videoRef.current.currentTime,
            isPlaying: true,
            hostTimestamp: Date.now(),
          });
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHost, videoState, onVideoSync]);

  const handleLocalPlay = () => {
    if (!videoRef.current || !isHost) return;
    videoRef.current.play().catch(console.error);
    setIsPlaying(true);
    onVideoSync({
      ...videoState,
      currentTime: videoRef.current.currentTime,
      isPlaying: true,
      hostTimestamp: Date.now(),
    });
  };

  const handleLocalPause = () => {
    if (!videoRef.current || !isHost) return;
    videoRef.current.pause();
    setIsPlaying(false);
    onVideoSync({
      ...videoState,
      currentTime: videoRef.current.currentTime,
      isPlaying: false,
      hostTimestamp: Date.now(),
    });
  };

  const handleLocalSeek = (time: number) => {
    if (!videoRef.current || !isHost) return;
    videoRef.current.currentTime = time;
    onVideoSync({
      ...videoState,
      currentTime: time,
      hostTimestamp: Date.now(),
    });
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  if (!videoState.url) {
    return (
      <div className="video-container flex items-center justify-center bg-dark-800 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-900 opacity-50" />
        <div className="text-center relative z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-dark-700 flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No video playing</h3>
          <p className="text-gray-400 mb-6 max-w-md">
            Paste a YouTube URL or video link below to start watching together
          </p>
          
          <div className="flex flex-col items-center gap-3">
            <input
              type="text"
              id="quick-video-input"
              placeholder="Paste YouTube or video URL..."
              className="input-field w-80 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  if (input.value.trim()) {
                    const url = input.value.trim();
                    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                    onVideoSync({
                      url,
                      type: isYouTube ? 'youtube' : 'local',
                      currentTime: 0,
                      isPlaying: false,
                      hostTimestamp: Date.now(),
                    });
                    input.value = '';
                  }
                }
              }}
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link className="w-3 h-3" />
              <span>YouTube URLs, .mp4, .webm links supported</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (videoState.type === 'youtube') {
    const videoId = extractYouTubeId(videoState.url);
    if (videoId) {
      return (
        <div className="video-container">
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&autoplay=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
          
          {!isHost && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 rounded-full text-xs text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Host controls playback
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div 
      className="video-container relative group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoState.url || undefined}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        muted={isMuted}
        playsInline
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleLocalSeek(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              disabled={!isHost}
            />
            <span className="text-sm font-mono text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isHost && (
                <>
                  {isPlaying ? (
                    <button onClick={handleLocalPause} className="btn-ghost text-white p-2 hover:bg-white/10 rounded-full">
                      <Pause className="w-6 h-6" />
                    </button>
                  ) : (
                    <button onClick={handleLocalPlay} className="btn-ghost text-white p-2 hover:bg-white/10 rounded-full">
                      <Play className="w-6 h-6" />
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="btn-ghost text-white p-2 hover:bg-white/10 rounded-full"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            <button onClick={onSetVideoUrl} className="btn-ghost text-white p-2 hover:bg-white/10 rounded-full">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!isHost && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 rounded-full text-xs text-white/80 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Host controls playback
        </div>
      )}
    </div>
  );
}
