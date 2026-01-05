// client/src/components/PipeSizesManagement.tsx
import React, { useState, useEffect } from 'react';
import { getCollectionSnapshot, addPipeSize, deletePipeSize, updatePipeSize } from '../firebase';
import type { PipeSize } from '../types';

const PipeSizesManagement: React.FC = () => {
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPipeSizeValue, setNewPipeSizeValue] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const unsubscribe = getCollectionSnapshot('pipe_sizes', (fetchedPipeSizes: PipeSize[]) => {
      const sorted = [...fetchedPipeSizes].sort((a, b) => (a.order || 999) - (b.order || 999));
      setPipeSizes(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPipeSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPipeSizeValue.trim() === '') return;
    await addPipeSize({ size: newPipeSizeValue, order: pipeSizes.length + 1 });
    setNewPipeSizeValue('');
  };

  const handleDeletePipeSize = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this pipe size?')) {
      await deletePipeSize(id);
    }
  };

  const startEditing = (ps: PipeSize) => {
      setEditingId(ps.id);
      setEditValue(ps.size);
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditValue('');
  };

  const saveEdit = async (id: string) => {
      if (editValue.trim() === '') return;
      await updatePipeSize(id, { size: editValue });
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
          placeholder="New pipe size (e.g., 4.5 in)"
          value={newPipeSizeValue}
          onChange={(e) => setNewPipeSizeValue(e.target.value)}
        />
        <button type="submit">Add Pipe Size</button>
      </form>
      <ul className="management-list">
        {pipeSizes.map((ps) => (
          <li key={ps.id} className="list-item-card">
            {editingId === ps.id ? (
                <div className="edit-form">
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ flexGrow: 1 }}
                    />
                    <button onClick={() => saveEdit(ps.id)} style={{ backgroundColor: '#4caf50' }}>Save</button>
                    <button onClick={cancelEditing} style={{ backgroundColor: '#9e9e9e' }}>Cancel</button>
                </div>
            ) : (
                <>
                    <span className="content"><strong>{ps.size}</strong></span>
                    <div className="actions">
                        <button onClick={() => startEditing(ps)} style={{ backgroundColor: '#2196f3' }}>Edit</button>
                        <button onClick={() => handleDeletePipeSize(ps.id)} style={{ backgroundColor: '#ff5252' }}>Delete</button>
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
