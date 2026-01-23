import React from 'react';

// 1. Import your local images correctly
import gallery1 from '../assets/images/gallery1.jpeg';
import gallery2 from '../assets/images/gallery2.jpeg';
import gallery3 from '../assets/images/gallery3.avif';
import gallery4 from '../assets/images/gallery4.avif';

const Gallery: React.FC = () => {
  // 2. Put the imported variables into the array
  const images = [
    gallery1,
    gallery2,
    gallery3,
    gallery4
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-oswald font-bold text-brick-900 mb-4 uppercase tracking-tighter">
            Heritage Gallery
          </h1>
          <div className="w-24 h-1.5 bg-heritage-gold mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 font-mukta max-w-2xl mx-auto">
            Glimpses of Nepal's architectural beauty and our role in building it.
          </p>
        </div>

        {/* 3. The Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {images.map((img, idx) => (
            <div key={idx} className="group relative h-[400px] overflow-hidden rounded-[2rem] shadow-2xl bg-gray-200">
              <img 
                src={img} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt={`Heritage architectural project ${idx + 1}`} 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-oswald text-2xl tracking-widest border-2 border-white px-6 py-2 uppercase">
                  𝓮Bricks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;