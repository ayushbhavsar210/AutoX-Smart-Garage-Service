import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import './LazyImage.css';

// Image cache to prevent duplicate requests
const imageCache = new Map();
const loadingRequests = new Map();

// Preload image
const preloadImage = (src) => {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }

  if (loadingRequests.has(src)) {
    return loadingRequests.get(src);
  }

  const loadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, true);
      loadingRequests.delete(src);
      resolve(true);
    };
    img.onerror = () => {
      loadingRequests.delete(src);
      reject(new Error(`Failed to load image: ${src}`));
    };
    // Add cache busting and compression hints
    img.src = src;
  });

  loadingRequests.set(src, loadPromise);
  return loadPromise;
};

const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = '16/9',
  priority = false,
  onLoad,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(imageCache.has(src));
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const normalizedSrc = typeof src === 'string' ? encodeURI(src) : src;

  // Optimized intersection observer
  useEffect(() => {
    if (priority || isInView) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '150px',
      threshold: 0
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, options);
    
    const currentImg = imgRef.current;
    if (currentImg) {
      observerRef.current.observe(currentImg);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, isInView]);

  // Preload image when visible
  useEffect(() => {
    if (!isInView || hasError) return;

    preloadImage(normalizedSrc)
      .then(() => {
        setIsLoaded(true);
        if (onLoad) onLoad();
      })
      .catch(() => {
        setHasError(true);
        setIsLoaded(true);
      });
  }, [isInView, normalizedSrc, onLoad, hasError]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    imageCache.set(normalizedSrc, true);
    if (onLoad) onLoad();
  }, [normalizedSrc, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-wrapper ${className}`}
      style={{ 
        aspectRatio,
        backgroundColor: '#f0f0f0'
      }}
      data-loaded={isLoaded}
    >
      {!isLoaded && isInView && (
        <div className="lazy-image-loading">
          <div className="spinner"></div>
        </div>
      )}
      {!isLoaded && !isInView && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-skeleton"></div>
        </div>
      )}
      {(isInView || priority) && !hasError && (
        <img
          src={normalizedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'low'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
          style={{
            willChange: isLoaded ? 'unset' : 'opacity',
          }}
          {...props}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.src === nextProps.src && 
         prevProps.priority === nextProps.priority &&
         prevProps.aspectRatio === nextProps.aspectRatio;
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
