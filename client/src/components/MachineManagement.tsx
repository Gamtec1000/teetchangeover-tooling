// client/src/components/MachineManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
  getCollectionSnapshot,
  addMachine, 
  updateMachine, 
  deleteMachine,
  uploadFile
} from '../firebase';
import type { Machine } from '../types'; // Import Machine type

const MachineManagement: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineDescription, setNewMachineDescription] = useState('');
  const [newMachineImage, setNewMachineImage] = useState<File | null>(null);
  const [newMachineImagePreview, setNewMachineImagePreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = getCollectionSnapshot('machines', (fetchedMachines: any) => {
      setMachines(fetchedMachines as Machine[]); // Type assertion
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMachineName.trim() === '') return;
    
    setError(null);
    setUploading(true);

    try {
        let imageUrl = '';
                    if (newMachineImage) {
                      imageUrl = await uploadFile(newMachineImage);        }

        const newMachine: Partial<Machine> = { // Explicitly use Partial<Machine>
          name: newMachineName,
          description: newMachineDescription,
          imageUrl,
        };

        await addMachine(newMachine);
        setNewMachineName('');
        setNewMachineDescription('');
        setNewMachineImage(null);
        setNewMachineImagePreview(null);
    } catch (err: any) {
        console.error("Error adding machine:", err);
        setError("Failed to add machine: " + (err.message || "Unknown error"));
    } finally {
        setUploading(false);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
          await deleteMachine(id);
      } catch (err: any) {
          console.error("Error deleting machine:", err);
          setError("Failed to delete machine: " + (err.message || "Unknown error"));
      }
    }
  };

  const startEditing = (machine: Machine) => {
      setEditingId(machine.id);
      setEditName(machine.name);
      setEditDescription(machine.description || ''); // Handle optional description
      setCurrentImageUrl(machine.imageUrl);
      setEditImage(null);
      setEditImagePreview(null);
      setError(null);
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditName('');
      setEditDescription('');
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

          await updateMachine(id, {
              name: editName,
              description: editDescription,
              imageUrl: imageUrl || ''
          });
          setEditingId(null);
      } catch (err: any) {
          console.error("Error updating machine:", err);
          setError("Failed to update machine: " + (err.message || "Unknown error"));
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
          setNewMachineImage(file);
          setNewMachineImagePreview(URL.createObjectURL(file));
      }
    }
  };

  if (loading) {
    return <p>Loading machines...</p>;
  }

  return (
    <div className="machine-management">
      <h2>Manage Machines</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={handleAddMachine} className="add-machine-form">
        <input
          type="text"
          placeholder="New machine name"
          value={newMachineName}
          onChange={(e) => setNewMachineName(e.target.value)}
          disabled={uploading}
        />
        <input
          type="text"
          placeholder="New machine description"
          value={newMachineDescription}
          onChange={(e) => setNewMachineDescription(e.target.value)}
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
            {newMachineImagePreview && (
                <img 
                    src={newMachineImagePreview} 
                    alt="Preview" 
                    style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }} 
                />
            )}
        </div>
        <button type="submit" disabled={uploading}>{uploading ? 'Adding...' : 'Add Machine'}</button>
      </form>

      <ul className="management-list">
        {machines.map((machine) => (
          <li key={machine.id} className="list-item-card">
             {editingId === machine.id ? (
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
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
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
                                    src={editImagePreview || currentImageUrl} 
                                    alt="Preview" 
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                                />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => saveEdit(machine.id)} style={{ backgroundColor: '#4caf50' }} disabled={uploading}>{uploading ? 'Saving...' : 'Save'}</button>
                        <button onClick={cancelEditing} style={{ backgroundColor: '#9e9e9e' }} disabled={uploading}>Cancel</button>
                    </div>
                </div>
             ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1 }}>
                        {machine.imageUrl ? (
                            <img 
                                src={machine.imageUrl} 
                                alt={machine.name} 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0' }} 
                            />
                        ) : (
                            <div style={{ width: '60px', height: '60px', borderRadius: '4px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>No Img</div>
                        )}
                        <div className="content">
                            <strong>{machine.name}</strong>
                            <p style={{ margin: '0.2rem 0', color: '#666', fontSize: '0.9rem' }}>{machine.description}</p>
                        </div>
                    </div>
                    <div className="actions">
                        <button onClick={() => startEditing(machine)} style={{ backgroundColor: '#2196f3' }}>Edit</button>
                        <button onClick={() => handleDeleteMachine(machine.id)} style={{ backgroundColor: '#ff5252' }}>Delete</button>
                    </div>
                </>
             )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MachineManagement;