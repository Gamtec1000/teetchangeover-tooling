// client/src/components/MachineSelection.tsx
import React, { useState, useEffect } from 'react';
import { getCollectionSnapshot } from '../lib/supabase-service';
import { formatImageUrl } from '../utils/urlHelpers';

interface Machine {
  id: string;
  name: string;
  imageUrl?: string;
}

interface MachineSelectionProps {
  onMachineSelect: (machineId: string) => void;
}

const MachineSelection: React.FC<MachineSelectionProps> = ({ onMachineSelect }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getCollectionSnapshot('machines', (fetchedMachines: any) => {
      setMachines(fetchedMachines);
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
