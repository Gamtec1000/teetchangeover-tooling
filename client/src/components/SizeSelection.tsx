// client/src/components/SizeSelection.tsx
import React, { useState, useEffect } from 'react';
import { getPipeSizes } from '../firebase';
import type { PipeSize } from '../types';

interface SizeSelectionProps {
  onBack: () => void;
  onContinue: (fromSize: string, toSize: string) => void;
  onBatchStart: (fromSize: string, toSize: string) => void;
}

const SizeSelection: React.FC<SizeSelectionProps> = ({ onBack, onContinue, onBatchStart }) => {
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([]);
  const [fromSize, setFromSize] = useState('');
  const [toSize, setToSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // New state for error message

  useEffect(() => {
    const fetchPipeSizes = async () => {
      const sizes = await getPipeSizes();
      // Sort by order field
      const sorted = [...sizes].sort((a, b) => (a.order || 999) - (b.order || 999));
      setPipeSizes(sorted as PipeSize[]);
      setLoading(false);
    };

    fetchPipeSizes();
  }, []);

  const handleContinue = () => {
    setErrorMessage(null); // Clear previous errors
    if (fromSize && toSize) {
      if (fromSize === toSize) {
        setErrorMessage("'From' size and 'To' size cannot be the same.");
        return;
      }
      onContinue(fromSize, toSize);
    } else {
      setErrorMessage("Please select both 'From' and 'To' sizes.");
    }
  };

  const handleBatchStart = () => {
      setErrorMessage(null);
      if (fromSize && toSize) {
          if (fromSize === toSize) {
              setErrorMessage("'From' size and 'To' size cannot be the same.");
              return;
          }
          onBatchStart(fromSize, toSize);
      } else {
          setErrorMessage("Please select both 'From' and 'To' sizes.");
      }
  };

  if (loading) {
    return <p>Loading pipe sizes...</p>;
  }

  return (
    <div className="size-selection">
      <h2>Select Sizes</h2>
      {errorMessage && <p className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{errorMessage}</p>} {/* Render error message */}
      <div className="form-group">
        <label>From:</label>
        <div className="selection-grid">
          {pipeSizes.map((ps) => (
            <div
              key={ps.id}
              className={`selection-button ${fromSize === ps.size ? 'selected' : ''}`}
              onClick={() => { setFromSize(ps.size); setErrorMessage(null); }}
            >
              {ps.size}
            </div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>To:</label>
        <div className="selection-grid">
          {pipeSizes.map((ps) => (
            <div
              key={ps.id}
              className={`selection-button ${toSize === ps.size ? 'selected' : ''}`}
              onClick={() => { setToSize(ps.size); setErrorMessage(null); }}
            >
              {ps.size}
            </div>
          ))}
        </div>
      </div>
      <div className="navigation-buttons">
        <button onClick={onBack}>Back</button>
        <button onClick={handleContinue}>Continue</button>
        <button 
            onClick={handleBatchStart} 
            style={{ backgroundColor: '#f44336', marginLeft: '10px', color: 'white' }}
        >
            Start Batch View
        </button>
      </div>
    </div>
  );
};

export default SizeSelection;
