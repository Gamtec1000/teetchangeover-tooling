// client/src/components/MachineSelection.tsx
import React, { useState, useEffect } from 'react';
import { getCollectionSnapshot } from '../firebase';
import { formatImageUrl } from '../utils/urlHelpers';

interface Machine {
  id: string;
  name: string;
  imageUrl?: string;
  order?: number;
}

interface MachineSelectionProps {
  onMachineSelect: (machineId: string) => void;
}

const MachineSelection: React.FC<MachineSelectionProps> = ({ onMachineSelect }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getCollectionSnapshot('machines', (fetchedMachines: Machine[]) => {
      // Sort by order field
      const sorted = [...fetchedMachines].sort((a, b) => (a.order || 999) - (b.order || 999));
      setMachines(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Loading machines...</p>;
  }

  return (
    <div className="machine-selection">
      <h2>Select a Machine</h2>
      <div className="machine-grid">
        {machines.map((machine) => (
          <div key={machine.id} className="machine-card" onClick={() => onMachineSelect(machine.id)}>
            <div className="machine-image">
              {machine.imageUrl ? (
                <img src={formatImageUrl(machine.imageUrl)} alt={machine.name} />
              ) : (
                <div className="placeholder-image">No Image</div>
              )}
            </div>
            <h3>{machine.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MachineSelection;
