import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const animationVideoSrc = '/img/web-images/animation/loading.mp4';

  useEffect(() => {
    // Hide the loading animation after 750ms for fast page load
    // Callback happens after 300ms fade-out animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        // Delay callback to allow fade-out animation to complete
        setTimeout(onComplete, 300);
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleVideoEnd = () => {
    setIsVisible(false);
    if (onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="loading-animation-overlay">
      <div className="loading-video-container">
        {!videoFailed ? (
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
