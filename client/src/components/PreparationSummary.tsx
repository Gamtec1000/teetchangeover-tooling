// client/src/components/PreparationSummary.tsx
import React, { useState } from 'react';
import { formatImageUrl } from '../utils/urlHelpers';
import type { Part, Tool, ChangeoverTemplate, Document } from '../types'; // IMPORTED TYPES using type

interface PreparationSummaryProps {
  template: ChangeoverTemplate; // TYPED
  parts: Part[]; // TYPED
  tools: Tool[]; // TYPED
  onBack: () => void;
  onContinue: () => void;
}

const PreparationSummary: React.FC<PreparationSummaryProps> = ({ template, parts, tools, onBack, onContinue }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'parts' | 'docs'>('tools');
  const [estimatedTime, setEstimatedTime] = useState('00:45'); 
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Load initial estimated time from template
  React.useEffect(() => {
      if (template && template.estimatedTime) {
          // Convert minutes to HH:MM
          const hours = Math.floor(template.estimatedTime / 60);
          const mins = template.estimatedTime % 60;
          const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          setEstimatedTime(timeStr);
      }
  }, [template]);

  if (!template) {
    return (
        <div className="card-section">
            <h2>No Template Found</h2>
            <p>There is no changeover template found for this machine.</p>
            <button onClick={onBack}>Back</button>
        </div>
    )
  }

  return (
    <div className="preparation-summary">
      {/* Lightbox for Image Zoom */}
      {zoomedImage && (
          <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer'
            }}
            onClick={() => setZoomedImage(null)}
          >
              <img src={formatImageUrl(zoomedImage)} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
          </div>
      )}

      <h2>Preparation Summary</h2>
      
      <div className="card-section" style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px', color: 'var(--text-color)' }}>Total Estimated Time (HH:MM):</label>
          {/* Read-only since it is set by Admin */}
          <span style={{ fontSize: '1.2rem', padding: '5px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}>
              {estimatedTime}
          </span>
      </div>

      <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <button 
            style={{ 
                padding: '10px 20px', 
                border: 'none', 
                background: activeTab === 'tools' ? 'var(--primary-color)' : 'transparent', 
                color: activeTab === 'tools' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                borderRadius: '5px 5px 0 0'
            }}
            onClick={() => setActiveTab('tools')}
          >
              Tools ({tools.length})
          </button>
          <button 
            style={{ 
                padding: '10px 20px', 
                border: 'none', 
                background: activeTab === 'parts' ? 'var(--primary-color)' : 'transparent', 
                color: activeTab === 'parts' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                borderRadius: '5px 5px 0 0'
            }}
            onClick={() => setActiveTab('parts')}
          >
              Parts ({parts.length})
          </button>
          <button 
            style={{ 
                padding: '10px 20px', 
                border: 'none', 
                background: activeTab === 'docs' ? 'var(--primary-color)' : 'transparent', 
                color: activeTab === 'docs' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                borderRadius: '5px 5px 0 0'
            }}
            onClick={() => setActiveTab('docs')}
          >
              Documents
          </button>
      </div>

      <div className="tab-content card-section" style={{ minHeight: '200px' }}>
          {activeTab === 'tools' && (
              <ul className="management-list">
                {tools.map(tool => (
                  <li key={tool.id} className="list-item-card">
                      <div className="content">
                        <strong>{tool.name}</strong>
                        <br/><small>Location: {tool.location || 'N/A'}</small>
                      </div>
                      {tool.imageUrl && (
                                                    <img
                                                      src={formatImageUrl(tool.imageUrl)}
                                                      alt={tool.name}
                                                      style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in'}}
                                                      onClick={() => setZoomedImage(formatImageUrl(tool.imageUrl!))}                          />
                      )}
                  </li>
                ))}
                {tools.length === 0 && <p>No specific tools required for this template.</p>}
              </ul>
          )}

          {activeTab === 'parts' && (
              <ul className="management-list">
                {parts.map(part => (
                  <li key={part.id} className="list-item-card">
                      <div className="content">
                        <strong>{part.name}</strong> (#{part.partNumber})
                        <br/><small>Stock: {part.stock} | Location: {part.location}</small>
                      </div>
                      {part.imageUrl && (
                                                    <img
                                                      src={formatImageUrl(part.imageUrl)}
                                                      alt={part.name}
                                                      style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in'}}
                                                      onClick={() => setZoomedImage(formatImageUrl(part.imageUrl!))}                          />
                      )}
                  </li>
                ))}
                {parts.length === 0 && <p>No specific parts required for this template.</p>}
              </ul>
          )}

          {activeTab === 'docs' && (
              <div>
                  <p>Standard Operating Procedures (SOPs) and Safety Manuals relevant to this machine.</p>
                  
                  {template.documents && template.documents.length > 0 ? (
                      template.documents.map((doc: Document, idx: number) => ( // Typed Document
                          <div key={idx} className="list-item-card" style={{ alignItems: 'center' }}>
                              <strong>{doc.name}</strong>
                                                            <a
                                                              href={formatImageUrl(doc.imageUrl)}
                                                              target="_blank"
                                                              rel="noreferrer"                                style={{ 
                                    padding: '8px 15px', 
                                    backgroundColor: 'var(--primary-color)', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    borderRadius: '4px' 
                                }}
                              >
                                  View / Download
                              </a>
                          </div>
                      ))
                  ) : (
                      <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No specific documents attached to this template.</p>
                  )}
              </div>
          )}
      </div>

      <div className="navigation-buttons" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ backgroundColor: 'var(--text-light)', color: 'white' }}>Back</button>
        <button onClick={onContinue} style={{ padding: '10px 30px', fontSize: '1.1rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>Start Changeover</button>
      </div>
    </div>
  );
};

export default PreparationSummary;