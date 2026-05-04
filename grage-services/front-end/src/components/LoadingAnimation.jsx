import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ onComplete, autoHideMs = 750, fadeOutMs = 300, svgOnly = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const animationVideoSrc = '/img/web-images/animation/loading.mp4';

  useEffect(() => {
    if (autoHideMs === null) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, fadeOutMs);
      }
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [onComplete, autoHideMs, fadeOutMs]);

  const handleVideoEnd = () => {
    setIsVisible(false);
    if (onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  if (!isVisible) return null;

  const useSvgLoader = svgOnly || videoFailed;

  return (
    <div className="loading-animation-overlay">
      <div className="loading-video-container">
        {!useSvgLoader ? (
          <video
            autoPlay
            playsInline
            muted
            onEnded={handleVideoEnd}
            onError={() => setVideoFailed(true)}
            className="loading-video"
            preload="auto"
          >
            <source src={animationVideoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          // Lightweight SVG fallback for ultra-fast loading
          <svg
            className="neon-loader"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Rotating outer ring */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#ffff00"
              strokeWidth="2"
              opacity="0.3"
              className="loader-circle outer"
            />

            {/* Rotating inner ring */}
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="#ffff00"
              strokeWidth="2"
              className="loader-circle inner"
              strokeLinecap="round"
              strokeDasharray="94 188"
            />

            {/* Center text */}
            <text
              x="100"
              y="110"
              textAnchor="middle"
              fontSize="28"
              fontWeight="bold"
              fill="#ffff00"
              className="loader-text"
              style={{ letterSpacing: '3px' }}
            >
              AUTOX
            </text>
          </svg>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation;
