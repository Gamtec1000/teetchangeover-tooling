// client/src/components/ChangeoverSteps.tsx
import React, { useState, useEffect } from 'react';
import { formatImageUrl } from '../utils/urlHelpers';
import type { Part, Tool, Step } from '../types'; // IMPORTED TYPES using type

interface ChangeoverStepsProps {
  steps: Step[]; // TYPED
  parts: Part[]; // TYPED
  tools: Tool[]; // TYPED
  onBack: () => void;
  onComplete: (duration: number, notes: any[]) => void;
  initialDuration?: number;
  initialNotes?: any[];
  completedSteps?: Set<number>;
  onToggleStep?: (index: number) => void;
}

const ChangeoverSteps: React.FC<ChangeoverStepsProps> = ({ 
  steps, 
  parts, 
  tools, 
  onBack, 
  onComplete, 
  initialDuration = 0, 
  initialNotes = [],
  completedSteps = new Set(),
  onToggleStep
}) => {
  // If returning from finalize (initialDuration > 0), start at the last step
  const [currentStepIndex, setCurrentStepIndex] = useState(initialDuration > 0 ? steps.length - 1 : 0);
  const [timer, setTimer] = useState(initialDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  // Transform array back to map
  const initialNotesMap = initialNotes.reduce((acc, note) => {
      acc[note.stepIndex] = note.text;
      return acc;
  }, {} as { [key: number]: string });

  const [stepNotes, setStepNotes] = useState<{ [key: number]: string }>(initialNotesMap);
  
  // Local completedSteps state removed in favor of props

  // ... rest of the component ...
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset active image when step changes
  useEffect(() => {
      setActiveImageIndex(0);
  }, [currentStepIndex]);

  const currentStep = steps[currentStepIndex];

  // Swipe handlers
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

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
      
      // Safe access to imageUrls
      const imageUrls = currentStep.imageUrls || [];

      if (isLeftSwipe && imageUrls.length > 0 && activeImageIndex < imageUrls.length - 1) {
          setActiveImageIndex(prev => prev + 1);
      }
      if (isRightSwipe && activeImageIndex > 0) {
          setActiveImageIndex(prev => prev - 1);
      }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeImageIndex > 0) setActiveImageIndex(prev => prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Safe access to imageUrls
      const imageUrls = currentStep.imageUrls || [];
      if (imageUrls.length > 0 && activeImageIndex < imageUrls.length - 1) setActiveImageIndex(prev => prev + 1);
  };

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleNextStep = () => {
    if (!completedSteps.has(currentStepIndex) && onToggleStep) {
        onToggleStep(currentStepIndex);
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsTimerRunning(false);
      // Compile final notes array
      const finalNotes = Object.keys(stepNotes).map(index => ({
          stepIndex: parseInt(index),
          stepTitle: steps[parseInt(index)].title,
          text: stepNotes[parseInt(index)]
      }));
      onComplete(timer, finalNotes);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const handleCancel = () => {
      if (window.confirm('Are you sure you want to cancel the changeover? All progress will be lost.')) {
          onBack();
      }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setStepNotes({
          ...stepNotes,
          [currentStepIndex]: e.target.value
      });
  };

  // Modified to find parts based on requiredPartNames and passed-in parts
  const getPartForName = (partName: string) => parts.find(p => p.name === partName); // CHANGED
  const getTool = (toolId: string) => tools.find(t => t.id === toolId);

  const progressPercentage = ((currentStepIndex) / steps.length) * 100;
  const currentImageUrls = currentStep.imageUrls || [];

  return (
    <div className="changeover-steps-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Lightbox for Image Zoom */}
      {zoomedImage && (
          <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer'
            }}
            onClick={() => setZoomedImage(null)}
          >
              <img src={formatImageUrl(zoomedImage)} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
          </div>
      )}

      {/* Header & Progress */}
      <div className="step-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
              <h2 style={{ margin: 0 }}>Step {currentStepIndex + 1} of {steps.length}</h2>
              <div style={{ width: '200px', height: '8px', backgroundColor: '#eee', borderRadius: '4px', marginTop: '5px' }}>
                  <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#367BF5', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
              </div>
          </div>
          <div className="timer" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', backgroundColor: '#f0f7ff', padding: '10px 20px', borderRadius: '8px' }}>
            {new Date(timer * 1000).toISOString().substr(11, 8)}
          </div>
      </div>

      {/* Main Step Card */}
      <div className="card-section" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#333' }}>{currentStep.title}</h1>
          
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
              {currentStep.description}
          </p>

          {/* Visuals Carousel */}
          {currentImageUrls.length > 0 && (
              <div 
                  className="step-visuals-carousel" 
                  style={{ position: 'relative', marginBottom: '2rem', backgroundColor: '#eee', borderRadius: '8px', overflow: 'hidden', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
              >
                                    <img
                                      src={formatImageUrl(currentImageUrls[activeImageIndex])}
                                      alt={`Step Visual ${activeImageIndex + 1}`}                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                    onClick={() => setZoomedImage(formatImageUrl(currentImageUrls[activeImageIndex]))}
                  />
                  
                  {/* Navigation Buttons */}
                  {activeImageIndex > 0 && (
                      <button 
                          onClick={handlePrevImage}
                          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                          ‹
                      </button>
                  )}
                  {activeImageIndex < currentImageUrls.length - 1 && (
                      <button 
                          onClick={handleNextImage}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                          ›
                      </button>
                  )}

                  {/* Counter */}
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem' }}>
                      {activeImageIndex + 1} / {currentImageUrls.length}
                  </div>
              </div>
          )}

          {/* Requirements Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
              <div>
                  <h4 style={{ marginTop: 0, borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>Parts Needed</h4>
                  {currentStep.requiredPartNames && currentStep.requiredPartNames.length > 0 ? ( // CHANGED
                      <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
                          {currentStep.requiredPartNames.map((partName: string) => { // CHANGED
                              const p = getPartForName(partName); // CHANGED
                              if (!p) return <li key={partName}>Unknown Part: {partName}</li>; // CHANGED message
                              return (
                                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                                      {p.imageUrl && (
                                                                                    <img
                                                                                      src={formatImageUrl(p.imageUrl)}
                                                                                      alt={p.name}                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }} 
                                            onClick={() => setZoomedImage(formatImageUrl(p.imageUrl))}
                                          />
                                      )}
                                      <span>{p.name} ({p.partNumber})</span> {/* Displaying part name and number */}
                                  </li>
                              );
                          })}
                      </ul>
                  ) : <span style={{ color: '#999' }}>None</span>}
              </div>
              <div>
                  <h4 style={{ marginTop: 0, borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>Tools Needed</h4>
                  {currentStep.requiredTools && currentStep.requiredTools.length > 0 ? (
                      <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
                          {currentStep.requiredTools.map((rt: { toolId: string, quantity: number }) => { // ITERATE requiredTools OBJECT
                              const t = getTool(rt.toolId); // USE toolId FROM OBJECT
                              if (!t) return <li key={rt.toolId}>Unknown Tool ID: {rt.toolId}</li>; // CHANGED message
                              return (
                                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                                      {t.imageUrl && (
                                                                                    <img
                                                                                      src={formatImageUrl(t.imageUrl)}
                                                                                      alt={t.name}                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }}
                                            onClick={() => setZoomedImage(formatImageUrl(t.imageUrl))}
                                          />
                                      )}
                                      <span>{t.name} ({rt.quantity})</span> {/* Display tool name and quantity */}
                                  </li>
                              );
                          })}
                      </ul>
                  ) : <span style={{ color: '#999' }}>None</span>}
              </div>
          </div>

          {/* Notes Section */}
          <div style={{ marginTop: 'auto' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Step Notes / Observations:</label>
              <textarea 
                  value={stepNotes[currentStepIndex] || ''}
                  onChange={handleNoteChange}
                  placeholder="Enter any issues or comments for this step..."
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px' }}
              />
          </div>
      </div>

      {/* Footer Actions */}
      <div className="step-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button onClick={handleCancel} style={{ backgroundColor: '#999' }}>Cancel Changeover</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
              {currentStepIndex > 0 && (
                  <button onClick={handlePrevStep} style={{ backgroundColor: '#fff', color: '#333', border: '1px solid #ccc' }}>Previous</button>
              )}
              <button onClick={handleNextStep} style={{ padding: '10px 40px', fontSize: '1.1rem' }}>
                  {currentStepIndex === steps.length - 1 ? 'Finish Changeover' : 'Complete Step & Next'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default ChangeoverSteps;
