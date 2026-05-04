/**
 * OPTIMIZED GALLERY COMPONENT - Complete Replacement
 * 
 * Copy this entire code and replace your current Gallery.jsx
 * 
 * Features:
 * - Infinite scroll with Intersection Observer
 * - Initial load of 8 images
 * - Skeleton loaders while loading more
 * - Proper image dimensions (no layout shift)
 * - Memoized components for performance
 * - Smooth loading animations
 */

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import './Gallery.css';
import LazyImage from './LazyImage';
import SkeletonLoader from './SkeletonLoader';

// Memoized gallery item with optimized rendering
const GalleryItem = memo(({ image, index, onClick, isLoading }) => (
  <div 
    key={image?.id || `skeleton-${index}`}
    className="gallery-item"
    onClick={() => !isLoading && onClick(image)}
    role="button"
    tabIndex={isLoading ? -1 : 0}
    onKeyPress={(e) => !isLoading && e.key === 'Enter' && onClick(image)}
    style={{ cursor: isLoading ? 'default' : 'pointer' }}
  >
    <div className="gallery-image-wrapper">
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          <LazyImage 
            src={image.image} 
            alt={image.title}
            aspectRatio="4/3"
            priority={index < 8}
            className="gallery-img"
            width={400}
            height={300}
          />
          <div className="gallery-overlay">
            <h3>{image.title}</h3>
            <p>{image.description}</p>
            <span className="view-btn">View Details</span>
          </div>
        </>
      )}
    </div>
  </div>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.image?.id !== nextProps.image?.id) return false;
  return true;
});

GalleryItem.displayName = 'GalleryItem';

const INITIAL_LOAD = 8;   // Load 8 images initially
const LOAD_MORE_COUNT = 8; // Load 8 more on each scroll

function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(INITIAL_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  
  const assetPath = useCallback((path) => encodeURI(path), []);

  // Gallery images data
  const galleryImages = useMemo(() => ({
    regularService: [
      {
        id: 1,
        title: 'Professional Service Center',
        category: 'regular',
        image: assetPath('/img/web-images/regular-services/pexels-19x14-8478233.jpg'),
        description: 'State-of-the-art service facility'
      },
      {
        id: 2,
        title: 'Expert Technicians',
        category: 'regular',
        image: assetPath('/img/web-images/regular-services/pexels-lynxexotics-15489246.jpg'),
        description: 'Certified technicians at work'
      },
      {
        id: 3,
        title: 'Quality Service',
        category: 'regular',
        image: assetPath('/img/web-images/regular-services/pexels-tami-19499386.jpg'),
        description: 'Premium vehicle maintenance'
      },
      {
        id: 4,
        title: 'Advanced Diagnostics',
        category: 'regular',
        image: assetPath('/img/web-images/regular-services/pexels-artempodrez-8985922.jpg'),
        description: 'Modern diagnostic equipment'
      },
      {
        id: 5,
        title: 'Complete Inspection',
        category: 'regular',
        image: assetPath('/img/web-images/regular-services/pexels-artempodrez-8986139.jpg'),
        description: 'Thorough vehicle inspection'
      },
      {
        id: 6,
        title: 'Professional Care',
        category: 'regular',
        image: assetPath('/img/web-images/regular-services/pexels-fatih-erden-141946798-10490623.jpg'),
        description: 'Expert vehicle care services'
      }
    ],
    breakdown: [
      {
        id: 7,
        title: 'Emergency Response',
        category: 'breakdown',
        image: assetPath('/img/web-images/breakdown/pexels-a-q-91521018-18863497.jpg'),
        description: '24/7 emergency assistance'
      },
      {
        id: 8,
        title: 'Roadside Help',
        category: 'breakdown',
        image: assetPath('/img/web-images/breakdown/pexels-edurawpro-21831855.jpg'),
        description: 'Quick roadside repairs'
      },
      {
        id: 9,
        title: 'Breakdown Recovery',
        category: 'breakdown',
        image: assetPath('/img/web-images/breakdown/pexels-jonathan-reynaga-861774-17429096.jpg'),
        description: 'Professional breakdown service'
      },
      {
        id: 10,
        title: 'Rapid Assistance',
        category: 'breakdown',
        image: assetPath('/img/web-images/breakdown/pexels-mikebirdy-943930.jpg'),
        description: 'Fast emergency response'
      },
      {
        id: 11,
        title: 'Towing Service',
        category: 'breakdown',
        image: assetPath('/img/web-images/breakdown/pexels-mykola128-8660855.jpg'),
        description: 'Professional towing assistance'
      },
      {
        id: 12,
        title: 'On-Site Repair',
        category: 'breakdown',
        image: assetPath('/img/web-images/breakdown/pexels-usuariodaniel-10061763.jpg'),
        description: 'On-the-spot emergency repairs'
      }
    ],
    modification: [
      {
        id: 13,
        title: 'Custom Performance',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-chickenbunny-102941452-14267360.jpg'),
        description: 'Performance tuning and upgrades'
      },
      {
        id: 14,
        title: 'Aesthetic Upgrades',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-dimkidama-14999240.jpg'),
        description: 'Custom body modifications'
      },
      {
        id: 15,
        title: 'Premium Customization',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-kyle-buss-45080540-7457234.jpg'),
        description: 'Exclusive custom modifications'
      },
      {
        id: 16,
        title: 'Advanced Tuning',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-bylukemiller-32725702.jpg'),
        description: 'ECU remapping and tuning'
      },
      {
        id: 17,
        title: 'Interior Customization',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-jacobmooreimages-12330674.jpg'),
        description: 'Premium interior upgrades'
      },
      {
        id: 18,
        title: 'Exterior Enhancement',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-natasha-filippovskaya-2203043-10257898.jpg'),
        description: 'Body kit and styling upgrades'
      },
      {
        id: 19,
        title: 'Full Customization',
        category: 'modification',
        image: assetPath('/img/web-images/modification/pexels-sam-mccool-1923523643-28762239.jpg'),
        description: 'Complete vehicle customization'
      }
    ]
  }), [assetPath]);

  // Combine all images
  const allImages = useMemo(() => [
    ...galleryImages.regularService,
    ...galleryImages.breakdown,
    ...galleryImages.modification
  ], [galleryImages]);

  // Filter images by category
  const filteredImages = useMemo(() => {
    if (selectedCategory === 'all') return allImages;
    return allImages.filter(img => img.category === selectedCategory);
  }, [selectedCategory, allImages]);

  // Slice to show only displayed count
  const visibleImages = useMemo(() => {
    return filteredImages.slice(0, displayedCount);
  }, [filteredImages, displayedCount]);

  // Create skeleton loaders for loading state
  const skeletons = useMemo(() => {
    if (!isLoadingMore) return [];
    return Array(LOAD_MORE_COUNT).fill(null);
  }, [isLoadingMore]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '200px', // Start loading 200px before reaching bottom
      threshold: 0.1
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoadingMore && displayedCount < filteredImages.length) {
          setIsLoadingMore(true);
          // Simulate network delay (300ms)
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredImages.length));
            setIsLoadingMore(false);
          }, 300);
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, options);
    
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current && sentinelRef.current) {
        observerRef.current.unobserve(sentinelRef.current);
      }
    };
  }, [displayedCount, filteredImages.length, isLoadingMore]);

  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setDisplayedCount(INITIAL_LOAD); // Reset to initial load
    setIsLoadingMore(false);
  }, []);

  // Handle image click
  const handleImageClick = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  // Handle lightbox close
  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>AutoX Gallery</h1>
        <p>Explore our services through images</p>
      </div>

      <div className="gallery-filters">
        {['all', 'regular', 'breakdown', 'modification'].map(category => (
          <button 
            key={category}
            className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            {category === 'all' && 'All Services'}
            {category === 'regular' && 'Regular Services'}
            {category === 'breakdown' && 'Breakdown'}
            {category === 'modification' && 'Modification'}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {/* Render visible images */}
        {visibleImages.map((image, index) => (
          <GalleryItem 
            key={image.id}
            image={image}
            index={index}
            onClick={handleImageClick}
            isLoading={false}
          />
        ))}

        {/* Show skeleton loaders while loading more */}
        {skeletons.map((_, index) => (
          <GalleryItem
            key={`skeleton-${index}`}
            image={null}
            index={visibleImages.length + index}
            onClick={() => {}}
            isLoading={true}
          />
        ))}
      </div>

      {/* Intersection observer sentinel - triggers load more */}
      <div ref={sentinelRef} className="gallery-sentinel" />

      {/* Loading indicator at bottom */}
      {isLoadingMore && (
        <div className="gallery-loading">
          <div className="loading-spinner" />
          <p>Loading more images...</p>
        </div>
      )}

      {/* End of gallery message */}
      {!isLoadingMore && displayedCount >= filteredImages.length && filteredImages.length > 0 && (
        <div className="gallery-end">
          <p>✓ All images loaded ({filteredImages.length} total)</p>
        </div>
      )}

      {/* Empty state */}
      {filteredImages.length === 0 && (
        <div className="gallery-empty">
          <p>No images found for this category.</p>
        </div>
      )}

      {/* Lightbox modal */}
      {selectedImage && (
        <div className="lightbox" onClick={handleCloseImage}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={handleCloseImage} aria-label="Close">×</button>
            <LazyImage 
              src={selectedImage.image} 
              alt={selectedImage.title}
              aspectRatio="16/9"
              priority={true}
              className="lightbox-img"
              width={900}
              height={506}
            />
            <div className="lightbox-info">
              <h2>{selectedImage.title}</h2>
              <p>{selectedImage.description}</p>
              <span className="category-badge">{selectedImage.category}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
