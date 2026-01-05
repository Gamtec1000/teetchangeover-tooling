// client/src/components/ToolsManagement.tsx
import React, { useState, useEffect } from 'react';
import { getCollectionSnapshot, addTool, updateTool, deleteTool, uploadFile } from '../firebase';
import { formatImageUrl } from '../utils/urlHelpers';

interface Tool {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
}

interface ToolsManagementProps {
    isAdmin?: boolean;
}

const ToolsManagement: React.FC<ToolsManagementProps> = ({ isAdmin = false }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToolName, setNewToolName] = useState('');
  const [newToolLocation, setNewToolLocation] = useState('');
  const [newToolImage, setNewToolImage] = useState<File | null>(null);
  const [newToolImagePreview, setNewToolImagePreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);

  // Modal State
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const unsubscribe = getCollectionSnapshot('tools', (fetchedTools: any) => {
      setTools(fetchedTools);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newToolName.trim() === '') return;
    
    setError(null);
    setUploading(true);

    try {
        let imageUrl = '';
                    if (newToolImage) {
                      imageUrl = await uploadFile(newToolImage);        }

        await addTool({
          name: newToolName,
          location: newToolLocation,
          imageUrl
        });
        setNewToolName('');
        setNewToolLocation('');
        setNewToolImage(null);
        setNewToolImagePreview(null);
    } catch (err: any) {
        console.error("Error adding tool:", err);
        setError("Failed to add tool: " + (err.message || "Unknown error"));
    } finally {
        setUploading(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      try {
          await deleteTool(id);
      } catch (err: any) {
          console.error("Error deleting tool:", err);
          setError("Failed to delete tool: " + (err.message || "Unknown error"));
      }
    }
  };

  const startEditing = (tool: Tool) => {
      setEditingId(tool.id);
      setEditName(tool.name);
      setEditLocation(tool.location);
      setCurrentImageUrl(tool.imageUrl);
      setEditImage(null);
      setEditImagePreview(null);
      setError(null);
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditName('');
      setEditLocation('');
      setCurrentImageUrl(undefined);
      setEditImage(null);
      setEditImagePreview(null);
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

          await updateTool(id, { 
              name: editName, 
              location: editLocation,
              imageUrl: imageUrl || ''
          });
          setEditingId(null);
      } catch (err: any) {
          console.error("Error updating tool:", err);
          setError("Failed to update tool: " + (err.message || "Unknown error"));
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
          setNewToolImage(file);
          setNewToolImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const openToolModal = (tool: Tool) => {
      setSelectedTool(tool);
      setIsZoomed(false);
  };

  const closeToolModal = () => {
      setSelectedTool(null);
      setIsZoomed(false);
  };

  if (loading) {
    return <p>Loading tools...</p>;
  }

  return (
    <div className="tools-management">
      <h2>{isAdmin ? 'Manage Tools' : 'Tools Catalog'}</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}
      {isAdmin && (
      <form onSubmit={handleAddTool} className="add-tool-form">
        <input
          type="text"
          placeholder="New tool name"
          value={newToolName}
          onChange={(e) => setNewToolName(e.target.value)}
          disabled={uploading}
        />
        <input
          type="text"
          placeholder="Location"
          value={newToolLocation}
          onChange={(e) => setNewToolLocation(e.target.value)}
          disabled={uploading}
        />
        <div style={{ margin: '10px 0' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e)}
              disabled={uploading}
            />
            {newToolImagePreview && (
                <img 
                    src={newToolImagePreview} 
                    alt="Preview" 
                    style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }} 
                />
            )}
        </div>
        <button type="submit" disabled={uploading}>{uploading ? 'Adding...' : 'Add Tool'}</button>
      </form>
      )}
      <ul className="management-list">
        {tools.map((tool) => (
          <li key={tool.id} className="list-item-card">
            {editingId === tool.id ? (
                <div className="edit-form" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        style={{ width: '100%', marginBottom: '5px' }}
                        disabled={uploading}
                    />
                    <input 
                        type="text" 
                        value={editLocation} 
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Location"
                        style={{ width: '100%', marginBottom: '5px' }}
                        disabled={uploading}
                    />
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Update Image:</label>
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => saveEdit(tool.id)} style={{ backgroundColor: '#4caf50' }} disabled={uploading}>{uploading ? 'Saving...' : 'Save'}</button>
                        <button onClick={cancelEditing} style={{ backgroundColor: '#9e9e9e' }} disabled={uploading}>Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, cursor: 'pointer' }}
                        onClick={() => openToolModal(tool)}
                    >
                         {tool.imageUrl ? (
                            <img 
                                src={formatImageUrl(tool.imageUrl)} 
                                alt={tool.name} 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0' }} 
                            />
                        ) : (
                            <div style={{ width: '60px', height: '60px', borderRadius: '4px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>No Img</div>
                        )}
                        <span className="content"><strong>{tool.name}</strong> <span style={{ color: '#666' }}>(Location: {tool.location})</span></span>
                    </div>
                    {isAdmin && (
                    <div className="actions">
                        <button onClick={(e) => { e.stopPropagation(); startEditing(tool); }} style={{ backgroundColor: '#2196f3' }}>Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }} style={{ backgroundColor: '#ff5252' }}>Delete</button>
                    </div>
                    )}
                </>
            )}
          </li>
        ))}
      </ul>

      {selectedTool && (
          <div className="modal" onClick={closeToolModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
                  <button onClick={closeToolModal} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#333' }}>×</button>
                  <h2 style={{ marginTop: 0 }}>{selectedTool.name}</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ textAlign: 'center', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
                          {selectedTool.imageUrl ? (
                              <img 
                                  src={formatImageUrl(selectedTool.imageUrl)} 
                                  alt={selectedTool.name} 
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
                              <div style={{ padding: '3rem', color: '#999' }}>No Image Available</div>
                          )}
                          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Tap image to zoom</p>
                      </div>

                      <div>
                          <strong>Location:</strong>
                          <p style={{ margin: '0.2rem 0' }}>{selectedTool.location}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ToolsManagement;