import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const animationVideoSrc = '/img/web-images/animation/loading.mp4';

  useEffect(() => {
    // Hide the loading animation after video ends or after a short timeout.
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 2600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleVideoEnd = () => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
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
          <div className="loading-video-fallback">AUTOX</div>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation;
