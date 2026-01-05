// client/src/components/PipeSizesManagement.tsx
import React, { useState, useEffect } from 'react';
import { getCollectionSnapshot, addPipeSize, deletePipeSize, updatePipeSize } from '../lib/supabase-service';

interface PipeSize {
  id: string;
  name: string;
}

const PipeSizesManagement: React.FC = () => {
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPipeSizeName, setNewPipeSizeName] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const unsubscribe = getCollectionSnapshot('pipe_sizes', (fetchedPipeSizes: any) => {
      setPipeSizes(fetchedPipeSizes);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPipeSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPipeSizeName.trim() === '') return;
    await addPipeSize({ name: newPipeSizeName });
    setNewPipeSizeName('');
  };

  const handleDeletePipeSize = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this pipe size?')) {
      await deletePipeSize(id);
    }
  };

  const startEditing = (size: PipeSize) => {
      setEditingId(size.id);
      setEditName(size.name);
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditName('');
  };

  const saveEdit = async (id: string) => {
      if (editName.trim() === '') return;
      await updatePipeSize(id, { name: editName });
      setEditingId(null);
  };

  if (loading) {
    return <p>Loading pipe sizes...</p>;
  }

  return (
    <div className="pipe-sizes-management">
      <h2>Manage Pipe Sizes</h2>
      <form onSubmit={handleAddPipeSize} className="add-pipe-size-form">
        <input
          type="text"
          placeholder="New pipe size name"
          value={newPipeSizeName}
          onChange={(e) => setNewPipeSizeName(e.target.value)}
        />
        <button type="submit">Add Pipe Size</button>
      </form>
      <ul className="management-list">
        {pipeSizes.map((size) => (
          <li key={size.id} className="list-item-card">
            {editingId === size.id ? (
                <div className="edit-form">
                    <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ flexGrow: 1 }} 
                    />
                    <button onClick={() => saveEdit(size.id)} style={{ backgroundColor: '#4caf50' }}>Save</button>
                    <button onClick={cancelEditing} style={{ backgroundColor: '#9e9e9e' }}>Cancel</button>
                </div>
            ) : (
                <>
                    <span className="content"><strong>{size.name}</strong></span>
                    <div className="actions">
                        <button onClick={() => startEditing(size)} style={{ backgroundColor: '#2196f3' }}>Edit</button>
                        <button onClick={() => handleDeletePipeSize(size.id)} style={{ backgroundColor: '#ff5252' }}>Delete</button>
                    </div>
                </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PipeSizesManagement;
