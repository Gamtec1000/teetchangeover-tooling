// client/src/components/PartsManagement.tsx
import React, { useState, useEffect } from 'react';
import { getCollectionSnapshot, addPart, deletePart, updatePart, getMachines, getPipeSizes, uploadFile } from '../lib/supabase-service';
import { formatImageUrl } from '../utils/urlHelpers';
import type { Part, Machine, PipeSize } from '../types';

interface PartsManagementProps {
    isAdmin?: boolean;
}

const PartsManagement: React.FC<PartsManagementProps> = ({ isAdmin = false }) => {
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedPipeSize, setSelectedPipeSize] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartStock, setNewPartStock] = useState(0);
  const [newPartLocation, setNewPartLocation] = useState('');
  const [newPartFamily, setNewPartFamily] = useState('');
  const [newPartImage, setNewPartImage] = useState<File | null>(null);
  const [newPartImagePreview, setNewPartImagePreview] = useState<string | null>(null);
  const [newPartPdf, setNewPartPdf] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPartNumber, setEditPartNumber] = useState('');
  const [editStock, setEditStock] = useState(0);
  const [editLocation, setEditLocation] = useState('');
  const [editPartFamily, setEditPartFamily] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);
  const [editPdf, setEditPdf] = useState<File | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | undefined>(undefined);
  const [currentPdfName, setCurrentPdfName] = useState<string | undefined>(undefined);

  // Modal State
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const machineData = await getMachines();
      setMachines(machineData as Machine[]);
      if (machineData.length > 0) {
        setSelectedMachine((machineData[0] as Machine).id);
      }
      
      const pipeSizeData = await getPipeSizes();
      setPipeSizes(pipeSizeData as PipeSize[]);
      if (pipeSizeData.length > 0) {
        setSelectedPipeSize((pipeSizeData[0] as PipeSize).name);
      }
      
      const unsubscribe = getCollectionSnapshot('parts', (fetchedParts: any) => {
        setAllParts(fetchedParts);
        setLoading(false);
      });
      
      return () => unsubscribe();
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedMachine && selectedPipeSize) {
      const filtered = allParts.filter(part => part.machineId === selectedMachine && part.pipeSize === selectedPipeSize);
      setFilteredParts(filtered);
    }
  }, [selectedMachine, selectedPipeSize, allParts]);

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPartName.trim() === '' || !selectedMachine || !selectedPipeSize) return;

    setError(null);
    setUploading(true);

    try {
        let imageUrl = '';
                    if (newPartImage) {
                      imageUrl = await uploadFile(newPartImage);        }

        let pdfUrl = '';
        let pdfName = '';
                    if (newPartPdf) {
                        pdfUrl = await uploadFile(newPartPdf);
                        pdfName = newPartPdf.name;        }

        await addPart({
          name: newPartName,
          partNumber: newPartNumber,
          stock: newPartStock,
          location: newPartLocation,
          machineId: selectedMachine,
          pipeSize: selectedPipeSize,
          partFamily: newPartFamily,
          imageUrl,
          pdfUrl,
          pdfName
        } as Partial<Part>);
        setNewPartName('');
        setNewPartNumber('');
        setNewPartStock(0);
        setNewPartLocation('');
        setNewPartFamily('');
        setNewPartImage(null);
        setNewPartImagePreview(null);
        setNewPartPdf(null);
    } catch (err: any) {
        console.error("Error adding part:", err);
        setError("Failed to add part: " + (err.message || "Unknown error"));
    } finally {
        setUploading(false);
    }
  };

  const handleDeletePart = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      try {
          await deletePart(id);
      } catch (err: any) {
          console.error("Error deleting part:", err);
          setError("Failed to delete part: " + (err.message || "Unknown error"));
      }
    }
  };

  const startEditing = (part: Part) => {
      setEditingId(part.id);
      setEditName(part.name);
      setEditPartNumber(part.partNumber || ''); // Handle undefined
      setEditStock(part.stock || 0); // Handle undefined
      setEditLocation(part.location || ''); // Handle undefined
      setEditPartFamily(part.partFamily);
      setCurrentImageUrl(part.imageUrl);
      setEditImage(null);
      setEditImagePreview(null);
      setCurrentPdfUrl(part.pdfUrl);
      setCurrentPdfName(part.pdfName);
      setEditPdf(null);
      setError(null);
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditName('');
      setEditPartNumber('');
      setEditStock(0);
      setEditLocation('');
      setEditPartFamily('');
      setCurrentImageUrl(undefined);
      setEditImage(null);
      setEditImagePreview(null);
      setCurrentPdfUrl(undefined);
      setCurrentPdfName(undefined);
      setEditPdf(null);
      setError(null);
  };

  const saveEdit = async (id: string) => {
      if (editName.trim() === '') return;
      
      setError(null);
      setUploading(true);

      try {
          let imageUrl = currentImageUrl;
                      if (editImage) {
                          imageUrl = await uploadFile(editImage);          }

          let pdfUrl = currentPdfUrl;
          let pdfName = currentPdfName;
                      if (editPdf) {
                          pdfUrl = await uploadFile(editPdf);
                          pdfName = editPdf.name;          }

          await updatePart(id, {
              name: editName,
              partNumber: editPartNumber,
              stock: editStock,
              location: editLocation,
              partFamily: editPartFamily,
              imageUrl: imageUrl || '',
              pdfUrl: pdfUrl || '',
              pdfName: pdfName || ''
          });
          setEditingId(null);
      } catch (err: any) {
          console.error("Error updating part:", err);
          setError("Failed to update part: " + (err.message || "Unknown error"));
      } finally {
          setUploading(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isEdit) {
          setEditImage(file);
          setEditImagePreview(URL.createObjectURL(file));
      } else {
          setNewPartImage(file);
          setNewPartImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const openPartModal = (part: Part) => {
      setSelectedPart(part);
      setIsZoomed(false);
  };

  const closePartModal = () => {
      setSelectedPart(null);
      setIsZoomed(false);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="parts-management" style={{ color: 'var(--text-color)' }}>
      <h2 style={{ color: 'var(--text-color)' }}>{isAdmin ? 'Manage Parts' : 'Parts Catalog'}</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}
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
                      className={`selection-button ${selectedPipeSize === p.name ? 'selected' : ''}`}
                      onClick={() => setSelectedPipeSize(p.name)}
                  >
                      {p.name}
                  </div>
              ))}
          </div>
      </div>
      
      {isAdmin && (
      <form onSubmit={handleAddPart} className="add-part-form">
        <input
          type="text"
          placeholder="New part name"
          value={newPartName}
          onChange={(e) => setNewPartName(e.target.value)}
          disabled={uploading}
        />
        <input
          type="text"
          placeholder="Part number"
          value={newPartNumber}
          onChange={(e) => setNewPartNumber(e.target.value)}
          disabled={uploading}
        />
        <input
          type="number"
          placeholder="Stock"
          value={newPartStock}
          onChange={(e) => setNewPartStock(Number(e.target.value))}
          disabled={uploading}
        />
        <input
          type="text"
          placeholder="Location"
          value={newPartLocation}
          onChange={(e) => setNewPartLocation(e.target.value)}
          disabled={uploading}
        />
        <input
          type="text"
          placeholder="Part Family (e.g., Entry Guide)"
          value={newPartFamily}
          onChange={(e) => setNewPartFamily(e.target.value)}
          disabled={uploading}
        />
        <div style={{ margin: '10px 0' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e)}
              disabled={uploading}
            />
            {newPartImagePreview && (
                <img 
                    src={newPartImagePreview} 
                    alt="Preview" 
                    style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }} 
                />
            )}
        </div>
        <div style={{ margin: '10px 0' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Upload PDF (Optional):</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setNewPartPdf(e.target.files ? e.target.files[0] : null)}
              disabled={uploading}
            />
        </div>
        <button type="submit" disabled={uploading}>{uploading ? 'Adding...' : 'Add Part'}</button>
      </form>
      )}
      
      {filteredParts.length === 0 ? (
        <p>No parts found for this machine and pipe size.</p>
      ) : (
        <ul className="management-list">
          {filteredParts.map((part) => (
            <li key={part.id} className="list-item-card">
              {editingId === part.id ? (
                  <div className="edit-form" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ width: '100%', marginBottom: '5px' }} disabled={uploading} />
                      <input type="text" value={editPartNumber} onChange={(e) => setEditPartNumber(e.target.value)} placeholder="Part #" style={{ width: '100%', marginBottom: '5px' }} disabled={uploading} />
                      <input type="number" value={editStock} onChange={(e) => setEditStock(Number(e.target.value))} placeholder="Stock" style={{ width: '100%', marginBottom: '5px' }} disabled={uploading} />
                      <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" style={{ width: '100%', marginBottom: '5px' }} disabled={uploading} />
                      <input type="text" value={editPartFamily} onChange={(e) => setEditPartFamily(e.target.value)} placeholder="Part Family" style={{ width: '100%', marginBottom: '5px' }} disabled={uploading} />
                      
                       <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-color)' }}>Update Image:</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, true)}
                            disabled={uploading}
                        />
                        {(editImagePreview || currentImageUrl) && (
                            <div style={{ marginTop: '5px' }}>
                                <img 
                                    src={editImagePreview || formatImageUrl(currentImageUrl)} 
                                    alt="Preview" 
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                                />
                            </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-color)' }}>Update PDF:</label>
                        {currentPdfUrl && <p style={{ fontSize: '0.8rem', margin: '0 0 5px 0', color: 'var(--text-light)' }}>Current: {currentPdfName || 'Attached PDF'}</p>}
                        <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => setEditPdf(e.target.files ? e.target.files[0] : null)}
                            disabled={uploading}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => saveEdit(part.id)} style={{ backgroundColor: '#4caf50' }} disabled={uploading}>{uploading ? 'Saving...' : 'Save'}</button>
                        <button onClick={cancelEditing} style={{ backgroundColor: '#9e9e9e' }} disabled={uploading}>Cancel</button>
                      </div>
                  </div>
              ) : (
                  <>
                    <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, cursor: 'pointer' }}
                        onClick={() => openPartModal(part)}
                    >
                         {part.imageUrl ? (
                            <img 
                                src={formatImageUrl(part.imageUrl)} 
                                alt={part.name} 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: 'var(--background-color)' }} 
                            />
                        ) : (
                            <div style={{ width: '60px', height: '60px', borderRadius: '4px', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '0.8rem' }}>No Img</div>
                        )}
                        <span className="content">
                            <strong style={{ color: 'var(--text-color)' }}>{part.name}</strong> <span style={{ color: 'var(--text-light)' }}>(#{part.partNumber})</span> <br/>
                            <small style={{ color: 'var(--text-light)' }}>Stock: {part.stock} | Location: {part.location} | Family: {part.partFamily}</small>
                            
                            {part.pdfUrl && (
                                <div style={{ marginTop: '5px' }}>
                                    <span 
                                        style={{ 
                                            display: 'inline-block', 
                                            padding: '2px 8px', 
                                            backgroundColor: 'var(--primary-color)', 
                                            color: 'white', 
                                            borderRadius: '4px', 
                                            fontSize: '0.8rem',
                                            textDecoration: 'none',
                                            opacity: 0.9
                                        }}
                                    >
                                        Has PDF
                                    </span>
                                </div>
                            )}
                        </span>
                    </div>
                    {isAdmin && (
                    <div className="actions">
                        <button onClick={(e) => { e.stopPropagation(); startEditing(part); }} style={{ backgroundColor: '#2196f3' }}>Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePart(part.id); }} style={{ backgroundColor: '#ff5252' }}>Delete</button>
                    </div>
                    )}
                  </>
              )}
            </li>
          ))}
        </ul>
      )}

      {selectedPart && (
          <div className="modal" onClick={closePartModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--white)', color: 'var(--text-color)' }}>
                  <button onClick={closePartModal} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>×</button>
                  <h2 style={{ marginTop: 0, paddingRight: '30px', color: 'var(--text-color)' }}>{selectedPart.name}</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Image Section */}
                      <div style={{ textAlign: 'center', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          {selectedPart.imageUrl ? (
                              <img 
                                  src={formatImageUrl(selectedPart.imageUrl)} 
                                  alt={selectedPart.name} 
                                  style={{ 
                                      maxWidth: '100%', 
                                      maxHeight: '300px', 
                                      objectFit: 'contain', 
                                      cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                                      transform: isZoomed ? 'scale(2)' : 'scale(1)',
                                      transition: 'transform 0.3s ease'
                                  }}
                                  onClick={() => setIsZoomed(!isZoomed)}
                              />
                          ) : (
                              <div style={{ padding: '3rem', color: 'var(--text-light)' }}>No Image Available</div>
                          )}
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Tap image to zoom</p>
                      </div>

                      {/* Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-color)' }}>
                          <div>
                              <strong>Part Number (SKU):</strong>
                              <p style={{ margin: '0.2rem 0', color: 'var(--text-light)' }}>{selectedPart.partNumber}</p>
                          </div>
                          <div>
                              <strong>Stock:</strong>
                              <p style={{ margin: '0.2rem 0', color: 'var(--text-light)' }}>{selectedPart.stock}</p>
                          </div>
                          <div>
                              <strong>Location:</strong>
                              <p style={{ margin: '0.2rem 0', color: 'var(--text-light)' }}>{selectedPart.location}</p>
                          </div>
                          <div>
                              <strong>Machine:</strong>
                              <p style={{ margin: '0.2rem 0', color: 'var(--text-light)' }}>{machines.find(m => m.id === selectedPart.machineId)?.name || 'Unknown'}</p>
                          </div>
                          <div>
                              <strong>Pipe Size:</strong>
                              <p style={{ margin: '0.2rem 0', color: 'var(--text-light)' }}>{selectedPart.pipeSize}</p>
                          </div>
                          <div>
                              <strong>Part Family:</strong>
                              <p style={{ margin: '0.2rem 0', color: 'var(--text-light)' }}>{selectedPart.partFamily}</p>
                          </div>
                      </div>

                      {/* PDF Section */}
                      {selectedPart.pdfUrl && (
                          <div style={{ marginTop: '1rem' }}>
                              <a 
                                  href={formatImageUrl(selectedPart.pdfUrl)} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  style={{ 
                                      display: 'block', 
                                      width: '100%', 
                                      padding: '1rem', 
                                      textAlign: 'center', 
                                      backgroundColor: 'var(--primary-color)', 
                                      color: 'white', 
                                      textDecoration: 'none', 
                                      borderRadius: '5px', 
                                      fontWeight: 'bold'
                                  }}
                              >
                                  View Datasheet (PDF)
                              </a>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PartsManagement;