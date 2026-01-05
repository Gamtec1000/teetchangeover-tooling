// client/src/components/ChangeoverFlow.tsx
import React, { useState, useEffect } from 'react';
import MachineSelection from './MachineSelection';
import SizeSelection from './SizeSelection';
import PreparationSummary from './PreparationSummary';
import ChangeoverSteps from './ChangeoverSteps';
import BatchStepView from './BatchStepView';
import { addChangeoverLog } from '../firebase';
import { getChangeoverTemplate, getPartForMachinePipeAndName, getTools, getMachines } from '../firebase'; // REMOVED getParts
import type { Machine, Part, Tool, ChangeoverTemplate, Step } from '../types'; // IMPORTED TYPES

interface ChangeoverFlowProps {
    onActiveStateChange: (isActive: boolean) => void;
}

const ChangeoverFlow: React.FC<ChangeoverFlowProps> = ({ onActiveStateChange }) => {
  const [view, setView] = useState('machine-selection'); // machine-selection, size-selection, summary, steps, finalize
  const [machines, setMachines] = useState<Machine[]>([]); // TYPED
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [fromSize, setFromSize] = useState<string | null>(null);
  const [toSize, setToSize] = useState<string | null>(null);
  const [template, setTemplate] = useState<ChangeoverTemplate | null>(null); // TYPED
  const [parts, setParts] = useState<Part[]>([]); // TYPED
  const [tools, setTools] = useState<Tool[]>([]); // TYPED
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousView, setPreviousView] = useState<string>('steps');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'wizard' | 'batch'>('wizard');

  // Fetch machines for the header
  useEffect(() => {
      const fetchMachines = async () => {
          const m = await getMachines();
          setMachines(m as Machine[]); // TYPE ASSERTION
      };
      fetchMachines();
  }, []);

  // Effect to notify parent of active state
  useEffect(() => {
      const isActive = view === 'steps' || view === 'batch-steps' || view === 'finalize';
      onActiveStateChange(isActive);
      
      return () => onActiveStateChange(false);
  }, [view, onActiveStateChange]);

  const handleMachineSelect = (machineId: string) => {
    setSelectedMachineId(machineId);
    setView('size-selection');
  };

  const handleSizeSelectionContinue = async (from: string, to: string, newMode: 'wizard' | 'batch' = 'wizard') => {
    setLoading(true);
    setFromSize(from);
    setToSize(to);
    setMode(newMode);
    if (selectedMachineId) {
      // Fetch the machine-specific template (no pipeSize in template query)
      const fetchedTemplate = await getChangeoverTemplate(selectedMachineId); // CHANGED

      if (fetchedTemplate) {
        // Sort steps by order to ensure correct sequence
        if (fetchedTemplate.steps) {
            fetchedTemplate.steps.sort((a: any, b: any) => a.order - b.order);
        }
        
        setTemplate(fetchedTemplate as ChangeoverTemplate); // TYPE ASSERTION
        
        // Dynamic Part Resolution
        const resolvedParts: Part[] = [];
        for (const step of fetchedTemplate.steps) {
          if (step.requiredPartNames) {
            for (const partName of step.requiredPartNames) {
              const part = await getPartForMachinePipeAndName(selectedMachineId, to, partName);
              if (part && !resolvedParts.some(p => p.id === part.id)) { // Avoid duplicates
                resolvedParts.push(part);
              }
            }
          }
        }
        
        // Tool fetching remains similar, but using the Step interface's requiredTools
        const allToolIds = [...new Set(fetchedTemplate.steps.flatMap((step: Step) => step.requiredTools?.map(t => t.toolId) || []))];
        const allTools = await getTools(); // Assuming getTools returns all tools
        const requiredTools = allTools.filter(t => allToolIds.includes(t.id));

        setParts(resolvedParts);
        setTools(requiredTools);
      }
    }
    setLoading(false);
    setView('summary');
  };
  
  const handleBackToMachineSelection = () => {
    setSelectedMachineId(null);
    setFromSize(null);
    setToSize(null);
    setTemplate(null);
    setParts([]); // CLEAR PARTS
    setTools([]); // CLEAR TOOLS
    setMode('wizard');
    setDuration(0); // RESET DURATION
    setNotes([]); // RESET NOTES
    setCompletedSteps(new Set()); // RESET COMPLETED STEPS
    setView('machine-selection');
  };

  const handleBatchStart = (from: string, to: string) => {
      handleSizeSelectionContinue(from, to, 'batch');
  };
  
  const handleBackToSizeSelection = () => {
    setFromSize(null);
    setToSize(null);
    setTemplate(null);
    setParts([]); // CLEAR PARTS
    setTools([]); // CLEAR TOOLS
    setDuration(0); // RESET DURATION
    setNotes([]); // RESET NOTES
    setCompletedSteps(new Set()); // RESET COMPLETED STEPS
    setView('size-selection');
  };

  const handleSummaryContinue = () => {
    if (mode === 'batch') {
        setView('batch-steps');
    } else {
        setView('steps');
    }
  };

  const handleStepsComplete = (d: number, n: any[]) => {
    setPreviousView(view);
    setDuration(d);
    setNotes(n); // These are step-specific notes
    setView('finalize');
  };
  
  const handleBackToSummary = () => {
    setView('summary');
  };

  const toggleStepCompletion = (stepIndex: number) => {
      const newSet = new Set(completedSteps);
      if (newSet.has(stepIndex)) {
          newSet.delete(stepIndex);
      } else {
          newSet.add(stepIndex);
      }
      setCompletedSteps(newSet);
  };

  const [operatorName, setOperatorName] = useState('');
  const [finalNote, setFinalNote] = useState('');

  const handleFinalize = async () => {
    if (operatorName.trim() === '') {
        alert('Please enter your name.');
        return;
    }

    const changeoverLog = {
      machineId: selectedMachineId!,
      fromSize: fromSize!,
      toSize: toSize!,
      duration,
      stepNotes: notes,
      finalNote,
      operatorName,
    };
    
    await addChangeoverLog(changeoverLog);
    
    alert("Changeover Logged & Complete");

    // Reset state
    setView('machine-selection');
    setSelectedMachineId(null);
    setFromSize(null);
    setToSize(null);
    setTemplate(null);
    setParts([]);
    setTools([]);
    setDuration(0);
    setNotes([]);
    setCompletedSteps(new Set());
    setOperatorName('');
    setFinalNote('');
  };

  const handleFinalizeBack = () => {
      setView(previousView);
  };

  const renderCurrentStep = () => {
    if (loading) return <p>Loading...</p>;
    
    switch (view) {
      case 'machine-selection':
        return <MachineSelection onMachineSelect={handleMachineSelect} />;
      case 'size-selection':
        if (!selectedMachineId) return null;
        return (
          <SizeSelection
            onBack={handleBackToMachineSelection}
            onContinue={(f, t) => handleSizeSelectionContinue(f, t, 'wizard')}
            onBatchStart={handleBatchStart}
          />
        );
      case 'batch-steps':
        if (!template) return (
          <div className="card-section" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.2rem', color: '#c62828', marginBottom: '1.5rem' }}>No template found for this changeover with the selected machine.</p> {/* CHANGED MESSAGE */}
            <button onClick={handleBackToSizeSelection} style={{ padding: '10px 20px', fontSize: '1rem' }}>Back to Size Selection</button>
          </div>
        );
        return (
          <BatchStepView
            steps={template.steps}
            parts={parts}
            tools={tools}
            onBack={handleBackToSizeSelection} // Or back to machine selection if preferred
            onComplete={handleStepsComplete}
            initialDuration={duration}
            initialNotes={notes}
            completedSteps={completedSteps}
            onToggleStep={toggleStepCompletion}
          />
        );
      case 'summary':
        if (!selectedMachineId || !fromSize || !toSize || !template) return null;
        return (
          <PreparationSummary
            template={template}
            parts={parts}
            tools={tools}
            onBack={handleBackToSizeSelection}
            onContinue={handleSummaryContinue}
          />
        );
      case 'steps':
        if (!template) return (
          <div className="card-section" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.2rem', color: '#c62828', marginBottom: '1.5rem' }}>No template found for this changeover with the selected machine.</p> {/* CHANGED MESSAGE */}
            <button onClick={handleBackToSummary} style={{ padding: '10px 20px', fontSize: '1rem' }}>Back to Summary</button>
          </div>
        );
        return (
          <ChangeoverSteps
            steps={template.steps}
            parts={parts}
            tools={tools}
            onBack={handleBackToSummary}
            onComplete={handleStepsComplete}
            initialDuration={duration}
            initialNotes={notes}
            completedSteps={completedSteps}
            onToggleStep={toggleStepCompletion}
          />
        );
      case 'finalize':
        return (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-section" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#4caf50' }}>Changeover Complete!</h2>
                <p style={{ fontSize: '1.2rem' }}>Total Duration: <strong>{(duration / 60).toFixed(2)} min</strong></p>
                
                <div style={{ margin: '2rem 0', textAlign: 'left' }}>
                    <div className="form-group">
                        <label>Operator Name:</label>
                        <input 
                            type="text" 
                            value={operatorName} 
                            onChange={(e) => setOperatorName(e.target.value)} 
                            placeholder="Enter your name"
                            style={{ fontSize: '1.1rem', padding: '10px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Final Notes / Issues Encountered:</label>
                        <textarea 
                            value={finalNote} 
                            onChange={(e) => setFinalNote(e.target.value)} 
                            placeholder="Any general comments about this changeover..."
                            rows={4}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleFinalizeBack} style={{ width: '30%', padding: '15px', fontSize: '1.1rem', backgroundColor: '#999' }}>Back to Steps</button>
                    <button onClick={handleFinalize} style={{ width: '70%', padding: '15px', fontSize: '1.2rem' }}>Log Changeover & Finish</button>
                </div>
            </div>
          </div>
        );
      default:
        return <p>Unknown step</p>;
    }
  };

  const selectedMachineName = machines.find(m => m.id === selectedMachineId)?.name;

  return (
    <div className="changeover-flow">
      {selectedMachineId && (
          <div className="changeover-header">
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary-color)' }}>{selectedMachineName || 'Unknown Machine'}</h2>
              {fromSize && toSize && (
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                      <span style={{ color: 'var(--text-light)' }}>From:</span> {fromSize} <span style={{ margin: '0 10px', color: 'var(--text-light)' }}>→</span> <span style={{ color: 'var(--text-light)' }}>To:</span> {toSize}
                  </div>
              )}
          </div>
      )}
      {renderCurrentStep()}
    </div>
  );
};

export default ChangeoverFlow;