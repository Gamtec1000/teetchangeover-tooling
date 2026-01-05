// client/src/components/NotesModal.tsx
import React, { useState } from 'react';

interface NotesModalProps {
  stepDescription: string;
  existingNotes: any[];
  onAddNote: (note: string) => void;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ stepDescription, existingNotes, onAddNote, onClose }) => {
  const [noteText, setNoteText] = useState('');

  const handleAddNote = () => {
    if (noteText.trim() === '') return;
    onAddNote(noteText);
    setNoteText('');
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Notes for: {stepDescription}</h2>
        <div className="notes-list">
          {existingNotes.map((note, index) => (
            <div key={index} className="note-item">
              <p>{note.text}</p>
              <span className="note-timestamp">{new Date(note.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a new note..."
        ></textarea>
        <div className="modal-buttons">
          <button onClick={handleAddNote}>Add Note</button>
          <button onClick={onClose} className="secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
