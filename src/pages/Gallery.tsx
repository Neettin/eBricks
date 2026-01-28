import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, X } from 'lucide-react';

// Assets
import gallery1 from '../assets/images/gallery1.jpeg';
import gallery4 from '../assets/images/gallery4.avif';
import CM1 from '../assets/images/CM1.jpeg';
import CM2 from '../assets/images/CM2.jpeg';
import CMVideo from '../assets/videos/CM-Video.mp4';

const Gallery: React.FC = () => {
  // State for Image Popup
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // The minimum distance required to be considered a swipe
  const minSwipeDistance = 50;

  const images = [
    { src: gallery1, title: "Traditional Craft" },
    { src: CM1, title: "Modern Precision" },
    { src: CM2, title: "Structural Integrity" },
    { src: gallery4, title: "Heritage Finish" }
  ];

  const handleImageClick = (src: string, index: number) => {
    setSelectedImg(src);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImg(images[nextIndex].src);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImg(images[prevIndex].src);
  };

  // Handle touch events for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    
    if (isRightSwipe) {
      handlePrev();
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImg(null);
      }
      if (selectedImg) {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
      }
    };

    if (selectedImg) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImg, currentIndex]);

  return (
    <div className="py-24 bg-white min-h-screen font-mukta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-20">
          <h2 className="text-heritage-gold font-oswald tracking-[0.3em] uppercase text-sm mb-3">Authentic Nepal Bricks</h2>
          <h1 className="text-6xl md:text-7xl font-oswald font-bold text-brick-900 mb-6 uppercase tracking-tighter">
            eBricks Gallery
          </h1>
          <div className="w-20 h-1 bg-brick-900 mx-auto mb-8"></div>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Merging Nepal's rich architectural heritage with our smart booking technology.
          </p>
        </div>

        {/* --- IMAGE GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32">
          {images.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => handleImageClick(item.src, idx)}
              className="group relative h-[400px] md:h-[500px] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-xl bg-gray-100 cursor-zoom-in"
            >
              <img 
                src={item.src} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                alt={item.title} 
              />
              {/* Elegant Overlay */}
              <div className="absolute inset-0 bg-brick-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-[2px]">
                <span className="text-white font-oswald text-2xl md:text-3xl tracking-widest uppercase mb-2">
                  𝓮Bricks
                </span>
                <div className="h-[1px] w-10 md:w-12 bg-heritage-gold mb-3 md:mb-4"></div>
                <p className="text-white/90 font-mukta text-xs md:text-sm tracking-widest uppercase">{item.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* --- FIXED VIDEO SECTION --- */}
        <div className="pt-20 border-t border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-heritage-gold font-oswald uppercase tracking-widest text-sm mb-2">
              THE EBRICKS EXPERIENCE
            </h3>
            <h2 className="text-4xl font-oswald font-bold text-brick-900 uppercase">
              PRODUCTION IN MOTION
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto italic">
              "Witness the journey of a single brick from earth to architecture."
            </p>
          </div>

          <div className="relative group rounded-2xl md:rounded-[3rem] overflow-hidden shadow-[0_30px_70px_-15px_rgba(139,38,22,0.3)] bg-black aspect-video max-w-6xl mx-auto">
            <video 
              controls 
              poster={CM1} 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'contrast(1.06) brightness(1.02) saturate(1.05)',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
              className="transition-all duration-700"
            >
              <source src={CMVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      {/* --- ENHANCED IMAGE POPUP MODAL --- */}
      {selectedImg && (
        <div className="fixed inset-0 z-[1000] bg-white">
          {/* Red Back Button Below Navbar */}
          <div className="sticky top-0 z-[1002] bg-white border-b border-gray-200">
            <button 
              onClick={() => setSelectedImg(null)}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-red-600 hover:bg-red-700 text-white w-full transition-all duration-300 shadow-sm"
              aria-label="Go back to gallery"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              <span className="font-oswald text-sm md:text-base tracking-wider">BACK TO GALLERY</span>
            </button>
          </div>
          
          {/* Image Container with Swipe Support */}
          <div 
            className="h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] flex items-center justify-center p-4 md:p-10 relative"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Simple Close Button */}
            <button 
              onClick={() => setSelectedImg(null)}
              className="absolute top-6 right-6 z-[1001] w-10 h-10 flex items-center justify-center text-brick-800 hover:text-brick-900 transition-all duration-300"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Navigation Arrows */}
            <button 
              onClick={handlePrev}
              className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 z-[1001] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <button 
              onClick={handleNext}
              className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 z-[1001] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Image */}
            <img 
              src={selectedImg} 
              className="max-w-full max-h-full rounded-lg md:rounded-2xl shadow-xl object-contain animate-in zoom-in-95 duration-500 touch-none select-none"
              alt={images[currentIndex].title}
              draggable="false"
            />
            
            {/* Image Info */}
            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-full border border-gray-300 shadow-lg min-w-[200px] md:min-w-[300px] text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
                <span className="font-oswald text-brick-900 text-sm md:text-lg tracking-wider uppercase truncate max-w-[120px] md:max-w-none">
                  {images[currentIndex].title}
                </span>
                <div className="hidden md:block text-gray-400">|</div>
                <span className="text-gray-600 font-mukta text-sm md:text-base">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;