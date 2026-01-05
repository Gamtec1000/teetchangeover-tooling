import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiCircle, FiChevronLeft, FiChevronRight, FiMaximize2, FiSettings, FiTool, FiX, FiEdit } from 'react-icons/fi';
import { formatImageUrl } from '../utils/urlHelpers';
import type { Part, Tool, Step } from '../types'; // IMPORTED TYPES
import './BatchStepView.css';

interface BatchStepViewProps {
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

const BATCH_SIZE = 5;

const BatchStepView: React.FC<BatchStepViewProps> = ({ 
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
  // -- State --
  const [currentBatchStartIndex, setCurrentBatchStartIndex] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0); // Global index of currently viewed step
  // Local state removed in favor of prop
  const [timer, setTimer] = useState(initialDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [stepNotes, setStepNotes] = useState<{ [key: number]: string }>({});
  
  // Image Carousel State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Modals
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<{type: 'part'|'tool', data: Part | Tool} | null>(null); // TYPED
  const [showNotesModal, setShowNotesModal] = useState(false);

  // -- Derived State --
  const currentBatchSteps = steps.slice(currentBatchStartIndex, currentBatchStartIndex + BATCH_SIZE);
  const isBatchComplete = currentBatchSteps.every((_, idx) => completedSteps.has(currentBatchStartIndex + idx));
  const currentGlobalIndex = selectedStepIndex;
  const currentStep = steps[currentGlobalIndex];

  // -- Init --
  useEffect(() => {
    if (initialNotes.length > 0) {
        const notesMap: {[key: number]: string} = {};
        initialNotes.forEach(n => {
            notesMap[n.stepIndex] = n.text;
        });
        setStepNotes(notesMap);
    }
  }, [initialNotes]);

  // -- Timer --
  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Reset image index when step changes
  useEffect(() => {
      setActiveImageIndex(0);
  }, [selectedStepIndex]);

  // -- Handlers --

  const toggleStepCompletion = (globalIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggleStep) {
        onToggleStep(globalIndex);
    }
  };

  const handleStepSelect = (globalIndex: number) => {
      setSelectedStepIndex(globalIndex);
  };

  const handleNextBatch = () => {
      const nextIndex = currentBatchStartIndex + BATCH_SIZE;
      if (nextIndex < steps.length) {
          setCurrentBatchStartIndex(nextIndex);
          setSelectedStepIndex(nextIndex); // Select first of new batch
      } else {
          // Finish
          finishChangeover();
      }
  };

  const handlePrevBatch = () => {
      const prevIndex = currentBatchStartIndex - BATCH_SIZE;
      if (prevIndex >= 0) {
          setCurrentBatchStartIndex(prevIndex);
          setSelectedStepIndex(prevIndex);
      }
  };

  const finishChangeover = () => {
      setIsTimerRunning(false);
      const formattedNotes = Object.entries(stepNotes).map(([idxStr, text]) => ({
          stepIndex: parseInt(idxStr),
          stepTitle: steps[parseInt(idxStr)].title,
          text
      }));
      onComplete(timer, formattedNotes);
  };

  const handleExit = () => {
      if(window.confirm("Exit changeover? Progress will be lost.")) {
          onBack();
      }
  };

  // -- Resources Helpers --
  const getPartForName = (partName: string) => parts.find(p => p.name === partName); // NEW HELPER
  const getTool = (toolId: string) => tools.find(t => t.id === toolId); // NEW HELPER

  // -- Render Helpers --
  const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

  return (
    <div className="batch-view-container">
        {/* HEADER */}
        <div className="batch-header">
            <div className="header-title">
                <h2>Steps {currentBatchStartIndex + 1} - {Math.min(currentBatchStartIndex + BATCH_SIZE, steps.length)} <span style={{fontWeight: 'normal', color: '#888'}}>of {steps.length}</span></h2>
                <div className="header-progress">
                    {Math.round((completedSteps.size / steps.length) * 100)}% Complete
                </div>
            </div>
            <div className="batch-header-actions">
                <div className="timer-badge">
                    <FiClock /> {formatTime(timer)}
                </div>
                <button className="btn-exit" onClick={handleExit}>Exit</button>
            </div>
        </div>

        {/* BODY */}
        <div className="batch-body">
            
            {/* DETAILS PANEL (Top on portrait, Right on landscape) */}
            <div className="step-details-panel">
                {currentStep ? (
                    <div className="detail-content-container">
                        <div className="detail-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h3>{currentGlobalIndex + 1}. {currentStep.title}</h3>
                            <button 
                                className="btn-notes-toggle" 
                                onClick={() => setShowNotesModal(true)}
                                title="Add/View Notes"
                            >
                                <FiEdit /> Notes {stepNotes[currentGlobalIndex] ? '(1)' : ''}
                            </button>
                        </div>

                        {/* Image Area */}
                        <div className="detail-image-area">
                            {currentStep.imageUrls && currentStep.imageUrls.length > 0 ? (
                                <>
                                                                        <img
                                                                            src={formatImageUrl(currentStep.imageUrls[activeImageIndex])}
                                                                            className="detail-image"
                                                                            alt="Step Visual"                                        onClick={() => setZoomedImage(formatImageUrl(currentStep.imageUrls![activeImageIndex]))}
                                        style={{cursor: 'zoom-in'}}
                                    />
                                    {currentStep.imageUrls.length > 1 && (
                                        <div className="image-controls">
                                            <button className="btn-img-nav" disabled={activeImageIndex === 0} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => i - 1); }}>
                                                <FiChevronLeft />
                                            </button>
                                            <span>{activeImageIndex + 1} / {currentStep.imageUrls.length}</span>
                                            <button className="btn-img-nav" disabled={activeImageIndex === currentStep.imageUrls.length - 1} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => i + 1); }}>
                                                <FiChevronRight />
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                        style={{position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer'}}
                                        onClick={() => setZoomedImage(formatImageUrl(currentStep.imageUrls![activeImageIndex]))}
                                    >
                                        <FiMaximize2 />
                                    </button>
                                </>
                            ) : (
                                <span style={{color: '#999'}}>No Image Available</span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="detail-description">
                            {currentStep.description || "No description provided."}
                        </div>

                        {/* Resources */}
                        {(currentStep.requiredPartNames?.length || 0 > 0 || currentStep.requiredTools?.length || 0 > 0) && ( // CHANGED
                            <div className="resources-section">
                                {currentStep.requiredPartNames?.map((partName: string) => { // CHANGED
                                    const part = getPartForName(partName); // CHANGED
                                    if (!part) return null;
                                    return (
                                        <div key={part.id} className="resource-chip chip-part" onClick={() => setSelectedResource({type: 'part', data: part})}> {/* CHANGED key */}
                                            {part.imageUrl ? <img src={formatImageUrl(part.imageUrl)} className="chip-icon" alt="" /> : <FiSettings />}
                                            {part.name}
                                        </div>
                                    );
                                })}
                                {currentStep.requiredTools?.map((rt: {toolId: string, quantity: number}) => { // CHANGED
                                    const tool = getTool(rt.toolId); // CHANGED
                                    if (!tool) return null;
                                    return (
                                        <div key={tool.id} className="resource-chip chip-tool" onClick={() => setSelectedResource({type: 'tool', data: tool})}> {/* CHANGED key */}
                                            {tool.imageUrl ? <img src={formatImageUrl(tool.imageUrl)} className="chip-icon" alt="" /> : <FiTool />}
                                            {tool.name} ({rt.quantity}) {/* Display quantity */}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="empty-details">Select a step to view details</div>
                )}
            </div>

            {/* LIST PANEL (Bottom on portrait, Left on landscape) */}
            <div className="step-list-panel">
                <div className="step-list-scroll">
                    {currentBatchSteps.map((step, idx) => {
                        const globalIdx = currentBatchStartIndex + idx;
                        const isCompleted = completedSteps.has(globalIdx);
                        const isActive = globalIdx === selectedStepIndex;
                        
                        return (
                            <div 
                                key={globalIdx} 
                                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                onClick={() => handleStepSelect(globalIdx)}
                            >
                                <div className="step-indicator" onClick={(e) => toggleStepCompletion(globalIdx, e)}>
                                    {isCompleted ? <FiCheckCircle /> : <FiCircle />}
                                </div>
                                <div className="step-content">
                                    <div className="step-title-text">{globalIdx + 1}. {step.title}</div>
                                    {!isActive && (
                                        <div className="step-subtitle-text">{step.description}</div>
                                    )}
                                </div>
                                {(step.requiredPartNames?.length || 0 > 0 || step.requiredTools?.length || 0 > 0) && ( // CHANGED
                                    <div style={{display: 'flex', gap: '5px', opacity: 0.6}}>
                                        {step.requiredPartNames?.length || 0 > 0 && <FiSettings size={14} />} {/* CHANGED */}
                                        {step.requiredTools?.length || 0 > 0 && <FiTool size={14} />} {/* CHANGED */}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="list-footer">
                    {currentBatchStartIndex > 0 && (
                        <button 
                            className="btn-nav btn-prev" 
                            onClick={handlePrevBatch}
                        >
                            Previous
                        </button>
                    )}
                    <button 
                        className="btn-nav btn-next"
                        onClick={handleNextBatch}
                        disabled={!isBatchComplete}
                    >
                         {currentBatchStartIndex + BATCH_SIZE >= steps.length ? 'Finish' : 'Next Batch'}
                    </button>
                </div>
            </div>

        </div>

        {/* MODALS */}
        {showNotesModal && (
            <div className="modal-backdrop" onClick={() => setShowNotesModal(false)}>
                <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                        <h3 style={{margin: 0}}>Notes for Step {currentGlobalIndex + 1}</h3>
                        <button onClick={() => setShowNotesModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><FiX size={24}/></button>
                    </div>
                    <textarea 
                        placeholder="Add notes for this step..." 
                        value={stepNotes[currentGlobalIndex] || ''}
                        onChange={(e) => setStepNotes({...stepNotes, [currentGlobalIndex]: e.target.value})}
                        style={{width: '100%', minHeight: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical'}}
                        autoFocus
                    />
                    <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'flex-end'}}>
                        <button 
                            onClick={() => setShowNotesModal(false)}
                            style={{padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
                        >
                            Close & Save
                        </button>
                    </div>
                </div>
            </div>
        )}

        {zoomedImage && (
            <div className="modal-backdrop" onClick={() => setZoomedImage(null)}>
                <div className="zoom-modal">
                    <img src={formatImageUrl(zoomedImage)} alt="Zoomed" onClick={(e) => e.stopPropagation()} />
                    <button 
                        onClick={() => setZoomedImage(null)} 
                        style={{position: 'absolute', top: 20, right: 20, background: 'white', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer'}}
                    >
                        <FiX size={24}/>
                    </button>
                </div>
            </div>
        )}

        {selectedResource && (
            <div className="modal-backdrop" onClick={() => setSelectedResource(null)}>
                <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                        <h3 style={{margin: 0}}>{selectedResource.data.name}</h3>
                        <button onClick={() => setSelectedResource(null)} style={{background:'none', border:'none', cursor:'pointer'}}><FiX size={24}/></button>
                    </div>
                    {selectedResource.data.imageUrl && (
                        <img src={formatImageUrl(selectedResource.data.imageUrl)} alt={selectedResource.data.name} style={{width: '100%', borderRadius: '8px', marginBottom: '1rem', maxHeight: '300px', objectFit: 'contain', background: '#f9f9f9'}} />
                    )}
                    <div style={{display: 'grid', gap: '0.5rem'}}>
                         <div><strong>ID:</strong> {selectedResource.data.id}</div>
                         {/* Removed Part Family Display */}
                         {selectedResource.type === 'part' && (
                             <div><strong>Part Number:</strong> {(selectedResource.data as Part).partNumber}</div>
                         )}
                         {selectedResource.type === 'part' && (
                             <div><strong>Location:</strong> {(selectedResource.data as Part).location}</div>
                         )}
                         <div><strong>Description:</strong> {selectedResource.data.description || 'N/A'}</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BatchStepView;