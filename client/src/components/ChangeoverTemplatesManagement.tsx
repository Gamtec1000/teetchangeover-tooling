// client/src/components/ChangeoverTemplatesManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  getCollectionSnapshot,
  addChangeoverTemplate,
  deleteChangeoverTemplate,
  addStep,
  deleteStep,
  updateStep,
  getMachines,
  getPartsForMachine,
  getTools,
  uploadFile,
  updateChangeoverTemplate,
  subscribeToSteps
} from '../lib/supabase-service';


import { formatImageUrl } from '../utils/urlHelpers';
import type { Machine, Tool, Step, ChangeoverTemplate, Document, Part } from '../types';

const ChangeoverTemplatesManagement: React.FC = () => {
  const [templates, setTemplates] = useState<ChangeoverTemplate[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ChangeoverTemplate | null>(null);
  
  // Step Form State
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [selectedPartNames, setSelectedPartNames] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [newStepImages, setNewStepImages] = useState<FileList | null>(null);
  
  // Editing State
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState('');
  const [editingStepDescription, setEditingStepDescription] = useState('');
  const [editingStepExistingImages, setEditingStepExistingImages] = useState<string[]>([]);
  const [editingNewImages, setEditingNewImages] = useState<FileList | null>(null);
  const [editingStepPartNames, setEditingStepPartNames] = useState<string[]>([]);
  const [editingStepTools, setEditingStepTools] = useState<string[]>([]);
  
  // Template Edit State
  const [editingTemplateTime, setEditingTemplateTime] = useState<number>(45);
  const [newTemplateDoc, setNewTemplateDoc] = useState<File | null>(null);
  const [newTemplateDocName, setNewTemplateDocName] = useState('');
  
  // UI/Error State
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const machineData = await getMachines();
      setMachines(machineData as Machine[]);
      if (machineData.length > 0) {
        setSelectedMachine((machineData[0] as Machine).id);
      }

      const unsubscribe = getCollectionSnapshot('changeover_templates', (templatesData: ChangeoverTemplate[]) => {
        setTemplates(templatesData);
      });

      return () => unsubscribe();
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      const fetchPartsAndTools = async () => {
        // Fetch all parts for the selected machine
        const allPartsForMachine = await getPartsForMachine(selectedTemplate.machineId);
        setAvailableParts(allPartsForMachine);

        // Still fetch tools as before
        const toolsData = await getTools();
        setAvailableTools(toolsData as Tool[]);
      };
      fetchPartsAndTools();

      const unsubscribe = subscribeToSteps(selectedTemplate.id, (stepsData) => {
        
        setSelectedTemplate(prev => {
            if (!prev) return null;
            return { ...prev, steps: stepsData };
        });
        
        setTemplates(prevTemplates => 
            prevTemplates.map(t => 
                t.id === selectedTemplate.id ? { ...t, steps: stepsData } : t
            )
        );
      });
      return () => unsubscribe();
    }
  }, [selectedTemplate?.id]);

  useEffect(() => {
      if (selectedTemplate) {
          setEditingTemplateTime(selectedTemplate.estimatedTime || 45);
      }
  }, [selectedTemplate]);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !selectedMachine) return;
    await addChangeoverTemplate({
      name: newTemplateName.trim(),
      machineId: selectedMachine,
      estimatedTime: 45, // Default
      documents: []
    } as Partial<ChangeoverTemplate>);
    setNewTemplateName(''); // Clear the input after adding
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStepTitle.trim() === '' || !selectedTemplate) return;

    setUploading(true);
    setError(null);

    try {
        const imageUrls: string[] = [];
        if (newStepImages) {
            for (let i = 0; i < newStepImages.length; i++) {
                const file = newStepImages[i];
                const url = await uploadFile(file);
                imageUrls.push(url);
            }
        }

        await addStep(selectedTemplate.id, {
          title: newStepTitle,
          description: newStepDescription,
          order: selectedTemplate.steps?.length || 0,
          requiredPartNames: selectedPartNames,
          requiredTools: selectedTools.map(toolId => ({ toolId, quantity: 1 })),
          imageUrls: imageUrls
        });

        setNewStepTitle('');
        setNewStepDescription('');
        setSelectedPartNames([]);
        setSelectedTools([]);
        setNewStepImages(null);
    } catch (err: any) {
        console.error("Error adding step:", err);
        setError("Failed to add step: " + (err.message || "Unknown error"));
    } finally {
        setUploading(false);
    }
  };
  
  const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this template?')) {
        deleteChangeoverTemplate(templateId);
        if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null);
        }
    }
  };
  
  const handleDeleteStep = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this step?')) {
        if (selectedTemplate) {
            deleteStep(selectedTemplate.id, stepId);
        }
    }
  };
  
  const handleEditStep = (step: Step) => {
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
    setEditingStepDescription(step.description);
    setEditingStepExistingImages(step.imageUrls || []);
    setEditingStepPartNames(step.requiredPartNames || []);
    setEditingStepTools(step.requiredTools?.map(t => t.toolId) || []);
    setEditingNewImages(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditingStepTitle('');
    setEditingStepDescription('');
    setEditingStepExistingImages([]);
    setEditingStepPartNames([]);
    setEditingStepTools([]);
    setEditingNewImages(null);
    setError(null);
  };

  const handleDeleteExistingImage = (index: number) => {
    setEditingStepExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveStep = async (stepId: string) => {
    if (editingStepTitle.trim() === '' || !selectedTemplate) return;
    
    setUploading(true);
    try {
        const newImageUrls: string[] = [];
        if (editingNewImages) {
            for (let i = 0; i < editingNewImages.length; i++) {
                const file = editingNewImages[i];
                const url = await uploadFile(file);
                newImageUrls.push(url);
            }
        }
        
        const finalImageUrls = [...editingStepExistingImages, ...newImageUrls];

        await updateStep(selectedTemplate.id, stepId, { 
            title: editingStepTitle,
            description: editingStepDescription,
            requiredPartNames: editingStepPartNames,
            requiredTools: editingStepTools.map(toolId => ({ toolId, quantity: 1 })),
            imageUrls: finalImageUrls
        });
        
        handleCancelEdit();
    } catch (err: any) {
        console.error("Error updating step:", err);
        setError("Failed to update step: " + (err.message || "Unknown error"));
    } finally {
        setUploading(false);
    }
  };

  const handleEditingPartSelection = (partName: string) => {
    setEditingStepPartNames(prev => 
      prev.includes(partName) 
        ? prev.filter(pn => pn !== partName) 
        : [...prev, partName]
    );
  }

  const handleEditingToolSelection = (toolId: string) => {
    setEditingStepTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }

  const handlePartSelection = (partName: string) => {
    setSelectedPartNames(prev => 
      prev.includes(partName) 
        ? prev.filter(pn => pn !== partName) 
        : [...prev, partName]
    );
  }

  const handleToolSelection = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setNewStepImages(e.target.files);
      }
  };

  const handleSaveTemplateSettings = async () => {
      if (!selectedTemplate) return;
      setUploading(true);
      try {
          let updatedDocs = selectedTemplate.documents || [];
          if (newTemplateDoc) {
              const url = await uploadFile(newTemplateDoc);
              // Use custom name if provided, else filename
              const docName = newTemplateDocName.trim() || newTemplateDoc.name;
              updatedDocs = [...updatedDocs, { name: docName, imageUrl: url }];
          }
          
          await updateChangeoverTemplate(selectedTemplate.id, {
              estimatedTime: editingTemplateTime,
              documents: updatedDocs
          });
          
          setNewTemplateDoc(null);
          setNewTemplateDocName('');
      } catch (err) {
          console.error(err);
          setError("Failed to update template settings");
      } finally {
          setUploading(false);
      }
  };
  
  const handleDeleteDoc = async (docIndex: number) => {
      if (!selectedTemplate) return;
      if (!window.confirm("Delete this document?")) return;
      
      try {
          const updatedDocs = (selectedTemplate.documents || []).filter((_, i) => i !== docIndex);
          await updateChangeoverTemplate(selectedTemplate.id, { documents: updatedDocs });
      } catch (err) {
          console.error(err);
      }
  };

  const sortedSteps = useMemo(() => {
      if (!selectedTemplate?.steps) return [];
      return [...selectedTemplate.steps].sort((a: Step, b: Step) => a.order - b.order);
  }, [selectedTemplate]);

  return (
      <div className="changeover-templates" style={{ color: 'var(--text-color)' }}>
          <h2 style={{ color: 'var(--text-color)' }}>Changeover Templates</h2>
          
          <div className="card-section" style={{ padding: '1.5rem', backgroundColor: 'var(--white)', borderRadius: '8px', boxShadow: 'var(--shadow)', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--text-color)' }}>Create New Template</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <label style={{ flex: 1, color: 'var(--text-color)' }}>
                      Machine:
                      <select style={{ width: '100%', backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }} value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)}>
                          {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                  </label>
                  <label style={{ flex: 1, color: 'var(--text-color)' }}>
                      Template Name:
                      <input 
                          type="text" 
                          value={newTemplateName} 
                          onChange={(e) => setNewTemplateName(e.target.value)} 
                          placeholder="e.g., Standard Changeover"
                          style={{ width: '100%' }}
                      />
                  </label>
                  <button onClick={handleAddTemplate}>Add Template</button>
              </div>
          </div>

          <div className="management-list">
             <h3 style={{ color: 'var(--text-color)' }}>Available Templates</h3>
             {templates.length === 0 && <p style={{ color: 'var(--text-light)' }}>No templates created yet.</p>}
             {templates.map(t => (
                 <div 
                    key={t.id} 
                    className={`list-item-card ${selectedTemplate?.id === t.id ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate(prev => prev?.id === t.id ? null : t)}
                    style={{ cursor: 'pointer' }}
                 >
                     <div className="content">
                        <strong style={{ color: 'var(--text-color)' }}>{t.name}</strong> on <strong style={{ color: 'var(--text-color)' }}>{machines.find(m => m.id === t.machineId)?.name}</strong>
                        <br/>
                        <small style={{ color: 'var(--text-light)' }}>{t.steps?.length || 0} Steps defined</small>
                     </div>
                     <div className="actions">
                        <button 
                            onClick={(e) => handleDeleteTemplate(e, t.id)} 
                            style={{ backgroundColor: '#ff5252' }}
                        >
                            Delete
                        </button>
                     </div>
                 </div>
             ))}
          </div>

          {selectedTemplate && (
            <div style={{ marginTop: '2rem', borderTop: '2px solid var(--border-color)', paddingTop: '2rem' }}>
              <h3 style={{ color: 'var(--text-color)' }}>Steps for {selectedTemplate.name} ({machines.find(m => m.id === selectedTemplate.machineId)?.name})</h3>
              
              {/* Template Settings Card */}
              <div className="card-section" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0, color: 'var(--text-color)' }}>Template Settings & Documents</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div>
                          <div className="form-group">
                              <label style={{ color: 'var(--text-color)' }}>Total Estimated Time (Minutes):</label>
                              <input 
                                type="number" 
                                value={editingTemplateTime} 
                                onChange={(e) => setEditingTemplateTime(parseInt(e.target.value))}
                                disabled={uploading}
                              />
                          </div>
                          <div className="form-group">
                              <label style={{ color: 'var(--text-color)' }}>Add Document (PDF/Image):</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <input 
                                    type="text"
                                    placeholder="Document Name (Optional)"
                                    value={newTemplateDocName}
                                    onChange={(e) => setNewTemplateDocName(e.target.value)}
                                    disabled={uploading}
                                  />
                                  <input 
                                    type="file" 
                                    accept=".pdf,image/*"
                                    onChange={(e) => setNewTemplateDoc(e.target.files ? e.target.files[0] : null)}
                                    disabled={uploading}
                                  />
                              </div>
                          </div>
                          <button onClick={handleSaveTemplateSettings} disabled={uploading}>
                              {uploading ? 'Saving...' : 'Save Settings'}
                          </button>
                      </div>
                      <div>
                          <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>Attached Documents:</label>
                          {selectedTemplate.documents && selectedTemplate.documents.length > 0 ? (
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                  {selectedTemplate.documents.map((d: Document, idx: number) => (
                                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', borderBottom: '1px solid var(--border-color)' }}>
                                          <a href={formatImageUrl(d.imageUrl)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>{d.name}</a>
                                          <button onClick={() => handleDeleteDoc(idx)} style={{ padding: '2px 8px', fontSize: '0.8rem', backgroundColor: '#ff5252' }}>Delete</button>
                                      </li>
                                  ))}
                              </ul>
                          ) : <p style={{ color: 'var(--text-light)' }}>No documents attached.</p>}
                      </div>
                  </div>
              </div>

              {/* Add Step Form */}
              <div style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <h4 style={{ color: 'var(--text-color)' }}>Add New Step</h4>
                  {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                  <form onSubmit={handleAddStep}>
                    <div className="form-group">
                        <input 
                            type="text" 
                            placeholder="Step Title (e.g., Remove Old Die)"
                            value={newStepTitle}
                            onChange={(e) => setNewStepTitle(e.target.value)}
                            disabled={uploading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            placeholder="Detailed Instructions..."
                            value={newStepDescription}
                            onChange={(e) => setNewStepDescription(e.target.value)}
                            disabled={uploading}
                            rows={3}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--white)', color: 'var(--text-color)' }}
                        />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="checkbox-group" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', backgroundColor: 'var(--white)' }}>
                            <h5 style={{ marginTop: 0, color: 'var(--text-color)' }}>Required Parts</h5>
                            {availableParts.length === 0 && <small style={{ color: 'var(--text-light)' }}>No parts found for this machine.</small>}
                            {availableParts.map(part => (
                                <div key={part.id}>
                                    <input 
                                        type="checkbox" 
                                        id={`part-${part.id}`}
                                        value={part.name}
                                        checked={selectedPartNames.includes(part.name)}
                                        onChange={() => handlePartSelection(part.name)}
                                        disabled={uploading}
                                    />
                                    <label htmlFor={`part-${part.id}`} style={{ color: 'var(--text-color)' }}>
                                        {part.name} {part.pipeSize ? `(${part.pipeSize})` : ''}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="checkbox-group" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', backgroundColor: 'var(--white)' }}>
                            <h5 style={{ marginTop: 0, color: 'var(--text-color)' }}>Required Tools</h5>
                            {availableTools.length === 0 && <small style={{ color: 'var(--text-light)' }}>No tools found.</small>}
                            {availableTools.map(t => (
                                <div key={t.id}>
                                    <input
                                        type="checkbox"
                                        id={`tool-${t.id}`}
                                        value={t.id}
                                        checked={selectedTools.includes(t.id)}
                                        onChange={() => handleToolSelection(t.id)}
                                        disabled={uploading}
                                    />
                                    <label htmlFor={`tool-${t.id}`} style={{ color: 'var(--text-color)' }}>{t.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label style={{ color: 'var(--text-color)' }}>Step Images (Optional)</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={handleImageChange}
                            disabled={uploading}
                            style={{ color: 'var(--text-color)' }}
                        />
                    </div>

                    <button type="submit" disabled={uploading}>
                        {uploading ? 'Adding Step...' : 'Add Step'}
                    </button>
                  </form>
              </div>

              {/* Steps List */}
              <ul className="management-list">
                {sortedSteps.map((s) => (
                  <li key={s.id} className="list-item-card" style={{ alignItems: 'flex-start' }}>
                    {editingStepId === s.id ? (
                      <div className="edit-form" style={{ width: '100%', flexDirection: 'column' }}>
                        <input 
                            type="text" 
                            value={editingStepTitle}
                            onChange={(e) => setEditingStepTitle(e.target.value)}
                            placeholder="Step Title"
                            style={{ width: '100%', marginBottom: '10px', fontWeight: 'bold' }}
                            disabled={uploading}
                        />
                        <textarea 
                          value={editingStepDescription}
                          onChange={(e) => setEditingStepDescription(e.target.value)}
                          rows={3}
                          placeholder="Step Description"
                          style={{ width: '100%', marginBottom: '10px', padding: '0.5rem', backgroundColor: 'var(--background-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                          disabled={uploading}
                        />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', width: '100%' }}>
                            <div className="checkbox-group" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', backgroundColor: 'var(--background-color)' }}>
                                <h5 style={{ marginTop: 0, color: 'var(--text-color)' }}>Required Parts</h5>
                                {availableParts.length === 0 && <small style={{ color: 'var(--text-light)' }}>No parts found for this machine.</small>}
                                {availableParts.map(part => (
                                    <div key={part.id}>
                                        <input 
                                            type="checkbox" 
                                            id={`edit-part-${part.id}`}
                                            value={part.name}
                                            checked={editingStepPartNames.includes(part.name)}
                                            onChange={() => handleEditingPartSelection(part.name)}
                                            disabled={uploading}
                                        />
                                        <label htmlFor={`edit-part-${part.id}`} style={{ color: 'var(--text-color)' }}>
                                            {part.name} {part.pipeSize ? `(${part.pipeSize})` : ''}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="checkbox-group" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', backgroundColor: 'var(--background-color)' }}>
                                <h5 style={{ marginTop: 0, color: 'var(--text-color)' }}>Required Tools</h5>
                                {availableTools.map(t => (
                                    <div key={t.id}>
                                        <input
                                            type="checkbox"
                                            id={`edit-tool-${t.id}`}
                                            value={t.id}
                                            checked={editingStepTools.includes(t.id)}
                                            onChange={() => handleEditingToolSelection(t.id)}
                                            disabled={uploading}
                                        />
                                        <label htmlFor={`edit-tool-${t.id}`} style={{ color: 'var(--text-color)' }}>{t.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Image Management in Edit Mode */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-color)' }}>Manage Images:</label>
                            
                            {/* Existing Images with Delete */}
                            {editingStepExistingImages.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                                    {editingStepExistingImages.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                                            <img 
                                                src={url} 
                                                alt="Step" 
                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                                            />
                                            <button 
                                                onClick={() => handleDeleteExistingImage(idx)}
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: '-5px', 
                                                    right: '-5px', 
                                                    background: 'red', 
                                                    color: 'white', 
                                                    borderRadius: '50%', 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    padding: 0,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                                disabled={uploading}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Add New Images */}
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={(e) => setEditingNewImages(e.target.files)}
                                disabled={uploading}
                                style={{ color: 'var(--text-color)' }}
                            />
                        </div>

                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleSaveStep(s.id)} style={{ backgroundColor: '#4caf50' }} disabled={uploading}>
                                {uploading ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={handleCancelEdit} style={{ backgroundColor: '#999' }} disabled={uploading}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="content">
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)' }}>{s.order + 1}. {s.title}</h4>
                            <p style={{ margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{s.description}</p>
                            
                            {/* Associated Items */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                {s.requiredPartNames && s.requiredPartNames.length > 0 && (
                                    <div>
                                        <strong>Parts: </strong>
                                        {s.requiredPartNames.join(', ')}
                                    </div>
                                )}
                                {s.requiredTools && s.requiredTools.length > 0 && (
                                    <div>
                                        <strong>Tools: </strong>
                                        {s.requiredTools.map(t => availableTools.find(at => at.id === t.toolId)?.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            {/* Images Gallery */}
                            {s.imageUrls && s.imageUrls.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {s.imageUrls.map((url: string, idx: number) => (
                                        <img 
                                            key={idx} 
                                            src={url} 
                                            alt={`Step ${idx + 1}`} 
                                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="actions" style={{ alignSelf: 'flex-start' }}>
                          <button onClick={() => handleEditStep(s)} style={{ backgroundColor: '#2196f3' }}>Edit</button>
                          <button onClick={(e) => handleDeleteStep(e, s.id)} style={{ backgroundColor: '#ff5252' }}>Delete</button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
  );
};

export default ChangeoverTemplatesManagement;