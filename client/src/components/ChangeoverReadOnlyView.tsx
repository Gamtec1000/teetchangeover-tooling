// client/src/components/ChangeoverReadOnlyView.tsx
import React, { useState, useEffect } from 'react';
import { getMachines, getPipeSizes, getChangeoverTemplate, getPartForMachinePipeAndName, getTools } from '../firebase'; // Import getPartForMachinePipeAndName
import { formatImageUrl } from '../utils/urlHelpers';
import type { Machine, Part, Tool, Step, ChangeoverTemplate, PipeSize, Document } from '../types'; // Import types

const ChangeoverReadOnlyView: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]); // Typed
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([]); // Typed
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedPipeSize, setSelectedPipeSize] = useState('');
  const [template, setTemplate] = useState<ChangeoverTemplate | null>(null); // Typed
  const [loading, setLoading] = useState(false);
  const [resolvedParts, setResolvedParts] = useState<Part[]>([]); // Holds resolved parts for selected pipe size
  const [resolvedTools, setResolvedTools] = useState<Tool[]>([]); // Holds resolved tools
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activeImageIndices, setActiveImageIndices] = useState<{ [key: number]: number }>({});

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

  const onTouchEnd = (stepIndex: number, maxIndex: number) => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      const currentIndex = activeImageIndices[stepIndex] || 0;

      if (isLeftSwipe && currentIndex < maxIndex) {
          setActiveImageIndices(prev => ({ ...prev, [stepIndex]: currentIndex + 1 }));
      }
      if (isRightSwipe && currentIndex > 0) {
          setActiveImageIndices(prev => ({ ...prev, [stepIndex]: currentIndex - 1 }));
      }
  };

  const handlePrevImage = (stepIndex: number) => {
      setActiveImageIndices(prev => ({ ...prev, [stepIndex]: (prev[stepIndex] || 0) - 1 }));
  };

  const handleNextImage = (stepIndex: number) => {
      setActiveImageIndices(prev => ({ ...prev, [stepIndex]: (prev[stepIndex] || 0) + 1 }));
  };

  useEffect(() => {
    const fetchData = async () => {
        const machineData = await getMachines();
        setMachines(machineData as Machine[]); // Type assertion
        if (machineData.length > 0) setSelectedMachine(machineData[0].id);

        const sizeData = await getPipeSizes();
        setPipeSizes(sizeData as PipeSize[]); // Type assertion
        const sortedSizes = [...sizeData].sort((a, b) => ((a as PipeSize).order || 999) - ((b as PipeSize).order || 999));
        setPipeSizes(sortedSizes as PipeSize[]);
        if (sortedSizes.length > 0) setSelectedPipeSize((sortedSizes[0] as PipeSize).size);
        
        // No need to fetch all parts and tools globally here anymore
    };
    fetchData();
  }, []);

  useEffect(() => {
      if (selectedMachine && selectedPipeSize) {
          const fetchTemplateAndResources = async () => {
              setLoading(true);
              // Fetch machine-specific template
              const fetchedTemplate = await getChangeoverTemplate(selectedMachine); // CHANGED: only machineId
              
              if (fetchedTemplate) {
                  fetchedTemplate.steps.sort((a: Step, b: Step) => a.order - b.order); // Typed step sorting
                  setTemplate(fetchedTemplate);

                  // Dynamically resolve parts based on pipeSize and requiredPartNames
                  const newResolvedParts: Part[] = [];
                  for (const step of fetchedTemplate.steps) {
                      if (step.requiredPartNames) {
                          for (const partName of step.requiredPartNames) {
                              const part = await getPartForMachinePipeAndName(selectedMachine, selectedPipeSize, partName);
                              if (part && !newResolvedParts.some(p => p.id === part.id)) {
                                  newResolvedParts.push(part);
                              }
                          }
                      }
                  }
                  setResolvedParts(newResolvedParts);

                  // Dynamically resolve tools
                  const allToolIds = [...new Set(fetchedTemplate.steps.flatMap((step: Step) => step.requiredTools?.map(t => t.toolId) || []))];
                  const allTools = await getTools();
                  const newResolvedTools = allTools.filter(t => allToolIds.includes(t.id));
                  setResolvedTools(newResolvedTools);

              } else {
                  setTemplate(null);
                  setResolvedParts([]);
                  setResolvedTools([]);
              }
              setLoading(false);
          };
          fetchTemplateAndResources();
      }
  }, [selectedMachine, selectedPipeSize]); // Dependencies updated

  const getPart = (partName: string) => resolvedParts.find(p => p.name === partName); // Helper to get resolved part by name
  const getTool = (toolId: string) => resolvedTools.find(t => t.id === toolId); // Helper to get resolved tool by ID

  return (
    <div className="changeover-read-only" style={{ color: 'var(--text-color)' }}>
        <h2 style={{ color: 'var(--text-color)' }}>Changeover Procedures (Read-Only)</h2>
        
        <div className="filters" style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Select Machine:</h4>
            <div className="selection-grid" style={{ marginBottom: '1.5rem' }}>
                {machines.map(m => (
                    <div 
                        key={m.id} 
                        className={`selection-button ${selectedMachine === m.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMachine(m.id)}
                    >
                        {m.name}
                    </div>
                ))}
            </div>
            
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Select Pipe Size:</h4>
            <div className="selection-grid">
                {pipeSizes.map(p => (
                    <div
                        key={p.id}
                        className={`selection-button ${selectedPipeSize === p.size ? 'selected' : ''}`}
                        onClick={() => setSelectedPipeSize(p.size)}
                    >
                        {p.size}
                    </div>
                ))}
            </div>
        </div>

        {loading ? <p>Loading procedure...</p> : (
            <>
                {!template ? (
                    <p>No procedure found for this combination.</p>
                ) : (
                    <div className="steps-container">
                        {/* Lightbox */}
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

                        {template.estimatedTime && (
                            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--text-color)' }}>
                                <strong>Estimated Time: </strong> {Math.floor(template.estimatedTime / 60).toString().padStart(2, '0')}:{ (template.estimatedTime % 60).toString().padStart(2, '0')}
                            </div>
                        )}

                        {template.documents && template.documents.length > 0 && (
                            <div className="card-section" style={{ marginBottom: '20px', padding: '1.5rem', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text-color)' }}>Reference Documents</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {template.documents.map((doc: Document, idx: number) => (
                                        <a 
                                            key={idx} 
                                            href={formatImageUrl(doc.imageUrl)} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                padding: '10px', 
                                                border: '1px solid var(--border-color)', 
                                                borderRadius: '5px', 
                                                textDecoration: 'none', 
                                                color: 'var(--text-color)',
                                                backgroundColor: 'var(--background-color)',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>📄</span>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {template.steps.map((step: Step, index: number) => (
                            <div key={step.id} className="card-section" style={{ marginBottom: '20px', padding: '1.5rem', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text-color)' }}>Step {index + 1}: {step.title}</h3>
                                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{step.description}</p>
                                
                                {/* Step Images Carousel */}
                                {(step.imageUrls && step.imageUrls.length > 0) && ( // Optional chaining
                                    <div 
                                        className="step-visuals-carousel" 
                                        style={{ position: 'relative', marginBottom: '15px', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onTouchStart={onTouchStart}
                                        onTouchMove={onTouchMove}
                                        onTouchEnd={() => onTouchEnd(index, step.imageUrls!.length - 1)}
                                    >
                                                                                <img
                                                                                    src={formatImageUrl(step.imageUrls[activeImageIndices[index] || 0])}
                                                                                    alt={`Step ${index + 1} - ${(activeImageIndices[index] || 0) + 1}`}                                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                                            onClick={() => setZoomedImage(formatImageUrl(step.imageUrls![activeImageIndices[index] || 0]))}
                                        />
                                        
                                        {/* Navigation Buttons */}
                                        {(activeImageIndices[index] || 0) > 0 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handlePrevImage(index); }}
                                                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                ‹
                                            </button>
                                        )}
                                        {(activeImageIndices[index] || 0) < step.imageUrls.length - 1 && ( // Optional chaining
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleNextImage(index); }}
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                ›
                                            </button>
                                        )}

                                        {/* Counter */}
                                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 8px', borderRadius: '15px', fontSize: '0.7rem' }}>
                                            {(activeImageIndices[index] || 0) + 1} / {step.imageUrls.length}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                                    <div>
                                        <strong style={{ color: 'var(--text-color)' }}>Parts:</strong>
                                        {step.requiredPartNames && step.requiredPartNames.length > 0 ? ( // CHANGED to requiredPartNames
                                            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                                                {step.requiredPartNames.map(partName => { // Iterating part names
                                                    const p = getPart(partName); // Getting resolved part
                                                    return (
                                                        <li key={partName} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                            {p?.imageUrl && <img src={formatImageUrl(p.imageUrl)} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '3px' }} />}
                                                            <span style={{ color: 'var(--text-color)' }}>{p?.name || `Unknown (${partName})`}</span> {/* Display resolved part name */}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : ' None'}
                                    </div>
                                    <div>
                                        <strong style={{ color: 'var(--text-color)' }}>Tools:</strong>
                                        {step.requiredTools && step.requiredTools.length > 0 ? ( // CHANGED to requiredTools
                                            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                                                {step.requiredTools.map(rt => { // Iterating tool objects
                                                    const t = getTool(rt.toolId); // Getting resolved tool
                                                    return (
                                                        <li key={rt.toolId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                            {t?.imageUrl && <img src={formatImageUrl(t.imageUrl)} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '3px' }} />}
                                                            <span style={{ color: 'var(--text-color)' }}>{t?.name || `Unknown (${rt.toolId})`} ({rt.quantity})</span> {/* Display resolved tool name and quantity */}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : ' None'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default ChangeoverReadOnlyView;