import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, X, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

// Assets
import gallery1 from '../assets/images/gallery1.jpeg';
import NTB2 from '../assets/images/NTB-2.jpeg';
import CM1 from '../assets/images/CM1.jpeg';
import CM2 from '../assets/images/CM2.jpeg';
import CMVideo from '../assets/videos/CM-Video.mp4';
import NTBVideo from '../assets/videos/NTB-Video.mp4';

const Gallery: React.FC = () => {
  // State for Image Popup
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // State for video section
  const [activeVideo, setActiveVideo] = useState<'CM' | 'NTB'>('CM');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // The minimum distance required to be considered a swipe
  const minSwipeDistance = 50;

  const images = [
    { src: gallery1, title: "Traditional Craft", type: "Traditional" },
    { src: CM1, title: "Modern Precision", type: "C.M." },
    { src: CM2, title: "Structural Integrity", type: "C.M." },
    { src: NTB2, title: "Local Brick Production", type: "NTB" }
  ];

  // Video descriptions
  const videoDescriptions = {
    CM: {
      title: "C.M. SPECIAL BRICKS",
      description: "Delivery of high-quality C.M. bricks at construction site showcasing premium brick quality and proper stacking",
      details: [
        "Premium machine-cut precision bricks",
        "Uniform size and consistent quality",
        "Properly stacked for safe transportation",
        "Ready for immediate construction use",
        "Quality checked before delivery"
      ]
    },
    NTB: {
      title: "NTB LOCAL BRICKS",
      description: "Traditional brick factory production showing the entire manufacturing process from clay to finished bricks",
      details: [
        "Traditional clay preparation techniques",
        "Hand-molding by skilled artisans",
        "Sun-drying process",
        "Kiln firing for strength",
        "Quality sorting and stacking"
      ]
    }
  };

  const handleImageClick = (src: string, index: number) => {
    setSelectedImg(src);
    setCurrentIndex(index);
    setIsZoomed(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImg(images[nextIndex].src);
    setIsZoomed(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImg(images[prevIndex].src);
    setIsZoomed(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle image zoom for mobile
  const handleImageZoom = (e: React.TouchEvent) => {
    if (!imageRef.current) return;
    
    const touch = e.touches[0];
    const rect = imageRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (!isZoomed) {
      setIsZoomed(true);
      setScale(2);
      setPosition({ x: x * -1, y: y * -1 });
    } else {
      setIsZoomed(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Handle double tap for zoom on mobile
  const handleDoubleTap = () => {
    if (!isZoomed) {
      setIsZoomed(true);
      setScale(2);
    } else {
      setIsZoomed(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  let lastTap = 0;
  const handleTouchEndImage = () => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      handleDoubleTap();
    }
    lastTap = currentTime;
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

  // Video controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoRef.current) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImg(null);
        if (isFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
      if (selectedImg) {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'z' || e.key === 'Z') handleDoubleTap();
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
  }, [selectedImg, currentIndex, isFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="py-12 md:py-24 bg-gradient-to-b from-white to-gray-50 min-h-screen font-mukta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- ANIMATED HEADER --- */}
        <div className="text-center mb-12 md:mb-20 animate-fade-in">
          <h2 className="text-heritage-gold font-oswald tracking-[0.3em] uppercase text-sm mb-3 animate-slide-up">
            Authentic Nepal Bricks
          </h2>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-oswald font-bold text-brick-900 mb-6 uppercase tracking-tighter animate-slide-up delay-100">
            eBricks Gallery
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-heritage-gold to-brick-900 mx-auto mb-8 animate-scale-x"></div>
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed animate-fade-in delay-200">
            Merging Nepal's rich architectural heritage with our smart booking technology.
          </p>
        </div>

        {/* --- ENHANCED IMAGE GRID WITH ANIMATIONS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-16 md:mb-32">
          {images.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => handleImageClick(item.src, idx)}
              className="group relative h-[300px] md:h-[500px] overflow-hidden rounded-2xl md:rounded-[2.5rem] shadow-lg hover:shadow-2xl bg-gray-100 cursor-pointer transform transition-all duration-500 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <img 
                src={item.src} 
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1" 
                alt={item.title}
                loading="lazy"
              />
              
              {/* Enhanced Overlay with Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-end pb-8 md:pb-12">
                <div className="text-center transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-white font-oswald text-xl md:text-3xl tracking-widest uppercase mb-2 block">
                    𝓮Bricks
                  </span>
                  <div className="h-[2px] w-16 md:w-24 bg-gradient-to-r from-transparent via-heritage-gold to-transparent mb-3 md:mb-4"></div>
                  <p className="text-white/90 font-mukta text-sm md:text-base tracking-widest uppercase mb-2">
                    {item.title}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
                    <div className={`w-2 h-2 rounded-full ${item.type === 'C.M.' ? 'bg-blue-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="text-heritage-gold text-xs md:text-sm font-bold tracking-wider">
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Hover indicator */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- ENHANCED DUAL VIDEO SECTION --- */}
        <div className="pt-12 md:pt-20 border-t border-gray-200">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h3 className="text-heritage-gold font-oswald uppercase tracking-widest text-sm mb-2 animate-slide-up">
              THE EBRICKS EXPERIENCE
            </h3>
            <h2 className="text-3xl md:text-4xl font-oswald font-bold text-brick-900 uppercase animate-slide-up delay-100">
              PRODUCTION IN MOTION
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto italic animate-fade-in delay-200">
              "Witness the journey of bricks from earth to architecture."
            </p>
          </div>

          {/* Animated Video Selection Tabs - UPDATED TEXT COLOR */}
          <div className="flex justify-center mb-8 md:mb-10 animate-fade-in">
            <div className="inline-flex rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 p-1 shadow-inner border border-gray-200">
              <button
                onClick={() => {
                  setActiveVideo('CM');
                  setIsPlaying(false);
                }}
                className={`px-6 md:px-8 py-3 rounded-lg font-oswald font-bold text-sm uppercase tracking-wider transition-all duration-500 transform hover:scale-105 ${
                  activeVideo === 'CM' 
                    ? 'bg-gradient-to-r from-brick-700 to-brick-800 text-heritage-gold shadow-lg scale-105' 
                    : 'text-gray-600 hover:text-heritage-gold'
                }`}
              >
                C.M. Production
              </button>
              <button
                onClick={() => {
                  setActiveVideo('NTB');
                  setIsPlaying(false);
                }}
                className={`px-6 md:px-8 py-3 rounded-lg font-oswald font-bold text-sm uppercase tracking-wider transition-all duration-500 transform hover:scale-105 ${
                  activeVideo === 'NTB' 
                    ? 'bg-gradient-to-r from-brick-700 to-brick-800 text-heritage-gold shadow-lg scale-105' 
                    : 'text-gray-600 hover:text-heritage-gold'
                }`}
              >
                NTB Production
              </button>
            </div>
          </div>

          {/* Main Content: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mb-12 md:mb-16">
            {/* Left Column: Enhanced Video Player */}
            <div className="lg:col-span-1 animate-fade-in-left">
              <div className="relative group rounded-xl md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(139,38,22,0.3)] hover:shadow-[0_30px_80px_-15px_rgba(139,38,22,0.4)] bg-black transform transition-all duration-500 hover:-translate-y-1">
                {activeVideo === 'CM' ? (
                  <video 
                    ref={videoRef}
                    key="cm-video"
                    controls={false}
                    poster={CM1}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full min-h-[400px] md:min-h-[500px] object-cover transition-all duration-700 group-hover:scale-105"
                  >
                    <source src={CMVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <video 
                    ref={videoRef}
                    key="ntb-video"
                    controls={false}
                    poster={NTB2}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full min-h-[400px] md:min-h-[500px] object-cover transition-all duration-700 group-hover:scale-105"
                  >
                    <source src={NTBVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}

                {/* Custom Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 md:p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={togglePlayPause}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 md:w-6 md:h-6 text-heritage-gold" />
                      ) : (
                        <Play className="w-5 h-5 md:w-6 md:h-6 text-heritage-gold ml-1" />
                      )}
                    </button>
                    
                    <div className="flex items-center gap-3 md:gap-4">
                      <button 
                        onClick={toggleMute}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-heritage-gold" />
                        ) : (
                          <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-heritage-gold" />
                        )}
                      </button>
                      
                      <button 
                        onClick={toggleFullscreen}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all"
                      >
                        <Maximize className="w-4 h-4 md:w-5 md:h-5 text-heritage-gold" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Video Title Overlay */}
                <div className="absolute top-4 md:top-6 left-4 md:left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full animate-pulse-slow">
                  <span className="font-oswald text-xs md:text-sm tracking-widest text-heritage-gold">
                    {videoDescriptions[activeVideo].title}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Animated Details */}
            <div className="lg:col-span-1 animate-fade-in-right">
              <div className="bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 rounded-xl md:rounded-[2rem] shadow-lg border border-gray-200 h-full transform transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                <div className="mb-6">
                  <h3 className="text-xl md:text-2xl font-oswald font-bold text-brick-900 mb-4 uppercase tracking-tight">
                    {videoDescriptions[activeVideo].title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">
                    {videoDescriptions[activeVideo].description}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-brick-800 mb-4 flex items-center gap-2 animate-slide-left">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-heritage-gold to-yellow-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Video Highlights
                  </h4>
                  <ul className="space-y-3">
                    {videoDescriptions[activeVideo].details.map((detail, index) => (
                      <li 
                        key={index} 
                        className="flex items-start gap-3 animate-slide-left"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-heritage-gold/20 to-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-heritage-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm md:text-base">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brick Type Badge */}
                <div className="mt-8 pt-6 border-t border-gray-200 animate-fade-in delay-500">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-brick-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-300">
                    <div className={`w-4 h-4 rounded-full ${activeVideo === 'CM' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-red-400 to-red-600'} animate-pulse`}></div>
                    <span className="font-bold text-xs md:text-sm text-heritage-gold">
                      {activeVideo === 'CM' ? 'PREMIUM MACHINE-CUT BRICKS' : 'TRADITIONAL HANDMADE BRICKS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Description Section REMOVED */}
        </div>
      </div>

      {/* --- ENHANCED IMAGE POPUP MODAL WITH ZOOM --- */}
      {selectedImg && (
        <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-gray-900 to-black">
          {/* Sticky Header */}
          <div className="sticky top-0 z-[1002] bg-gradient-to-r from-black/90 via-black/80 to-black/70 backdrop-blur-lg border-b border-gray-800">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
              <button 
                onClick={() => setSelectedImg(null)}
                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 bg-gradient-to-r from-brick-700 to-brick-800 hover:from-brick-800 hover:to-brick-900 text-heritage-gold rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                aria-label="Go back to gallery"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-oswald text-xs md:text-sm tracking-wider">BACK TO GALLERY</span>
              </button>
              
              <button 
                onClick={() => setIsZoomed(!isZoomed)}
                className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-heritage-gold rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-gray-700 shadow-lg"
              >
                <span className="font-oswald text-xs md:text-sm tracking-wider">
                  {isZoomed ? 'RESET ZOOM' : 'ZOOM IN'}
                </span>
              </button>
            </div>
          </div>
          
          {/* Image Container with Zoom and Swipe Support */}
          <div 
            className="h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] flex items-center justify-center p-2 md:p-10 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Simple Close Button */}
            <button 
              onClick={() => setSelectedImg(null)}
              className="absolute top-4 md:top-6 right-4 md:right-6 z-[1001] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-md border border-gray-700 text-heritage-gold hover:text-yellow-400 transition-all duration-300 transform hover:scale-110 shadow-2xl"
              aria-label="Close gallery"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Navigation Arrows */}
            <button 
              onClick={handlePrev}
              className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 z-[1001] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-md border border-gray-700 text-heritage-gold hover:text-yellow-400 hover:border-heritage-gold transition-all duration-300 active:scale-95 shadow-2xl"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <button 
              onClick={handleNext}
              className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 z-[1001] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-md border border-gray-700 text-heritage-gold hover:text-yellow-400 hover:border-heritage-gold transition-all duration-300 active:scale-95 shadow-2xl"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Zoomable Image */}
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onTouchStart={(e) => {
                onTouchStart(e);
                handleImageZoom(e);
              }}
              onTouchEnd={handleTouchEndImage}
            >
              <img 
                ref={imageRef}
                src={selectedImg} 
                className={`max-w-full max-h-full rounded-lg md:rounded-2xl shadow-2xl object-contain transition-transform duration-300 touch-none select-none ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                style={{
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: 'center center'
                }}
                alt={images[currentIndex].title}
                draggable="false"
                onClick={handleDoubleTap}
              />
            </div>
            
            {/* Image Info - REMOVED MOBILE ZOOM INSTRUCTIONS */}
            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-black/80 to-black/70 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-full border border-gray-700 shadow-2xl min-w-[250px] md:min-w-[350px] text-center animate-slide-up">
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
                <span className="font-oswald text-white text-sm md:text-lg tracking-wider uppercase truncate max-w-[120px] md:max-w-none">
                  {images[currentIndex].title}
                </span>
                <div className="hidden md:block text-gray-500">|</div>
                <span className="text-gray-300 font-mukta text-sm md:text-base">
                  {currentIndex + 1} / {images.length}
                </span>
                <div className="hidden md:block text-gray-500">|</div>
                <span className="text-heritage-gold font-bold text-xs md:text-sm bg-gradient-to-r from-black/50 to-gray-900/50 px-3 py-1 rounded-full border border-heritage-gold/30">
                  {images[currentIndex].type}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Inline styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideLeft {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideRight {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes scaleX {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-slide-left {
          animation: slideLeft 0.6s ease-out;
        }
        
        .animate-slide-right {
          animation: slideRight 0.6s ease-out;
        }
        
        .animate-fade-in-left {
          animation: slideRight 0.6s ease-out;
        }
        
        .animate-fade-in-right {
          animation: slideLeft 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-scale-x {
          animation: scaleX 0.6s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
        
        .delay-500 {
          animation-delay: 500ms;
        }
        
        @media (max-width: 768px) {
          .cursor-pointer {
            cursor: default;
          }
          
          .cursor-zoom-in {
            cursor: default;
          }
          
          .cursor-zoom-out {
            cursor: default;
          }
        }
      `}</style>
    </div>
  );
};

export default Gallery;