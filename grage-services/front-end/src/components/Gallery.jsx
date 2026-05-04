import React, { useState, useCallback, useMemo, memo } from 'react';
import './Gallery.css';
import LazyImage from './LazyImage';

// Memoized gallery item for performance
const GalleryItem = memo(({ image, index, onClick }) => (
  <div 
    key={image.id} 
    className="gallery-item"
    onClick={() => onClick(image)}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === 'Enter' && onClick(image)}
  >
    <div className="gallery-image-wrapper">
      <LazyImage 
        src={image.image} 
        alt={image.title}
        aspectRatio="4/3"
        priority={index < 8}
        className="gallery-img"
      />
      <div className="gallery-overlay">
        <h3>{image.title}</h3>
        <p>{image.description}</p>
        <span className="view-btn">View Details</span>
      </div>
    </div>
  </div>
), (prevProps, nextProps) => {
  return prevProps.image.id === nextProps.image.id && prevProps.index === nextProps.index;
});

GalleryItem.displayName = 'GalleryItem';

const ITEMS_PER_PAGE = 12; // 12 images per page to avoid rendering too many

function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const assetPath = useCallback((path) => encodeURI(path), []);

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

  const allImages = useMemo(() => [
    ...galleryImages.regularService,
    ...galleryImages.breakdown,
    ...galleryImages.modification
  ], [galleryImages]);

  const filteredImages = useMemo(() => {
    if (selectedCategory === 'all') return allImages;
    return allImages.filter(img => img.category === selectedCategory);
  }, [selectedCategory, allImages]);

  // Pagination logic: calculate start and end indices
  const paginatedImages = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    return filteredImages.slice(startIdx, endIdx);
  }, [filteredImages, currentPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  }, [filteredImages.length]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
  }, []);

  const handleImageClick = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>AutoX Gallery</h1>
        <p>Explore our services through images</p>
      </div>

      <div className="gallery-filters">
        <button 
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('all')}
        >
          All Services
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'regular' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('regular')}
        >
          Regular Services
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'breakdown' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('breakdown')}
        >
          Breakdown
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'modification' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('modification')}
        >
          Modification
        </button>
      </div>

      <div className="gallery-grid">
        {paginatedImages.map((image, index) => (
          <GalleryItem 
            key={image.id}
            image={image}
            index={index}
            onClick={handleImageClick}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button 
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages} ({filteredImages.length} images)
          </div>
          <button 
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

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
