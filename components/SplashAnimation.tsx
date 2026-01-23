import React, { useState, useEffect } from 'react';
import './css/SplashAnimation.css';

interface SplashAnimationProps {
  onComplete: () => void;
}

const SplashAnimation: React.FC<SplashAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  console.log('SplashAnimation rendering, phase:', animationPhase);

  useEffect(() => {
    const sequence = async () => {
      console.log('Starting splash sequence');
      try {
        // Phase 0: Initial black screen
        console.log('Phase 0: Black screen');
        await new Promise(resolve => setTimeout(resolve, 300));
        setAnimationPhase(1);
        
        // Phase 1: Logo appears
        console.log('Phase 1: Logo appears');
        setAnimationPhase(1);
        
        // Phase 2: Logo expands
        console.log('Phase 2: Logo expands');
        await new Promise(resolve => setTimeout(resolve, 1800));
        setAnimationPhase(2);
        
        // Phase 3: Brick pattern fills screen
        console.log('Phase 3: Brick pattern');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnimationPhase(3);
        
        // Phase 4: Fade out
        console.log('Phase 4: Fade out');
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsVisible(false);
        
        // Complete
        console.log('Phase 5: Complete');
        await new Promise(resolve => setTimeout(resolve, 300));
        onComplete();
        
      } catch (error) {
        console.error('Animation sequence error:', error);
        setTimeout(() => {
          setIsVisible(false);
          onComplete();
        }, 2000);
      }
    };

    sequence();
  }, [onComplete]);

  const handleSkip = () => {
    console.log('Skipping splash');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`splash-container ${animationPhase >= 3 ? 'splash-fade-out' : ''}`}>
      <div className="splash-content">
        {/* Netflix-style logo */}
        <div className={`netflix-logo ${animationPhase >= 1 ? 'netflix-logo-visible' : ''} ${animationPhase >= 2 ? 'netflix-logo-expand' : ''}`}>
          <div className="netflix-logo-text">
            <span className="netflix-logo-part-1">𝓮</span>
            <span className="netflix-logo-part-2">b=Bricks</span>
          </div>
          <div className="netflix-logo-subtitle">
            Building Nepal's Legacy
          </div>
        </div>

        {/* Brick grid */}
        <div className={`brick-grid ${animationPhase >= 2 ? 'brick-grid-fill' : ''}`}>
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="brick-tile"
              style={{ 
                animationDelay: `${(i % 10) * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Skip button */}
        {animationPhase >= 1 && (
          <button className="skip-button" onClick={handleSkip}>
            Skip Intro
          </button>
        )}
      </div>
    </div>
  );
};

export default SplashAnimation;