import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductImageSlideshow = ({ images, productName, className = "", children }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance slideshow every 3 seconds when hovered
  useEffect(() => {
    if (!isHovered || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentImageIndex(index);
  };

  // Handle single image or no images
  if (!images || images.length === 0) {
    return (
      <div className={`relative bg-gradient-to-br from-forest-green-100 to-forest-green-200 flex items-center justify-center ${className}`}>
        <div className="text-6xl text-forest-green-400">{productName?.charAt(0) || '?'}</div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`relative bg-gradient-to-br from-forest-green-100 to-forest-green-200 flex items-center justify-center ${className}`}>
        <img 
          src={images[0]} 
          alt={productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        <div className="text-6xl hidden text-forest-green-400">{productName?.charAt(0) || '?'}</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-gradient-to-br from-forest-green-100 to-forest-green-200 overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img 
          src={images[currentImageIndex]} 
          alt={`${productName} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        <div className="text-6xl hidden text-forest-green-400">{productName?.charAt(0) || '?'}</div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Image Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentImageIndex 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {currentImageIndex + 1}/{images.length}
        </div>
      )}

      {/* Render children (badges, etc.) */}
      {children}
    </div>
  );
};

export default ProductImageSlideshow;
