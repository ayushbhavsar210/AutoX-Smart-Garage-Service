import React, { memo } from 'react';
import './Gallery.css';

/**
 * Skeleton Loader - Shows placeholder while image loads
 * Prevents layout shift with fixed dimensions
 */
const SkeletonLoader = memo(() => (
  <div className="skeleton-loader">
    <div className="skeleton-pulse" />
  </div>
));

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
