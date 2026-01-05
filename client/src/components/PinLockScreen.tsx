import React, { useState, useEffect, useCallback } from 'react';
import './PinLockScreen.css';

interface PinLockScreenProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 4;
const CORRECT_PIN = '2025';

const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [showForgotMessage, setShowForgotMessage] = useState<boolean>(false);

  const handleUnlock = useCallback(() => {
    if (pin === CORRECT_PIN) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setShowForgotMessage(false); // Hide forgot message on PIN attempt
      setTimeout(() => setError(false), 1000);
    }
  }, [pin, onUnlock]);

  // Auto-submit when pin reaches length
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleUnlock();
    }
  }, [pin, handleUnlock]);

  const handleNumberClick = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin(prev => prev + num);
      setError(false);
      setShowForgotMessage(false); // Hide forgot message on PIN attempt
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
    setShowForgotMessage(false);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
    setShowForgotMessage(false);
  };

  const handleForgotPin = () => {
    setShowForgotMessage(true);
    setPin(''); // Clear PIN when "Forgot" is clicked
    setError(false);
  };

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        if (pin.length < PIN_LENGTH) {
          setPin(prev => prev + e.key);
          setError(false);
          setShowForgotMessage(false); // Hide forgot message on PIN attempt
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
        setError(false);
        setShowForgotMessage(false); // Hide forgot message on PIN attempt
      } else if (e.key === 'Escape') {
        setPin('');
        setError(false);
        setShowForgotMessage(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="pin-lock-overlay">
      <div className="pin-lock-container">
        <h2 className="pin-lock-title">Enter Kiosk PIN</h2>
        
        <div className="pin-display">
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <div 
              key={i} 
              className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              className="pin-key"
              onClick={() => handleNumberClick(num.toString())}
            >
              {num}
            </button>
          ))}
          <button className="pin-key clear" onClick={handleClear}>CLR</button>
          <button className="pin-key" onClick={() => handleNumberClick('0')}>0</button>
          <button className="pin-key" onClick={handleBackspace}>⌫</button>
        </div>

        <div className={`pin-error ${error ? 'visible' : ''}`}>
          Incorrect PIN. Try again.
        </div>

        {showForgotMessage && (
          <p className="forgot-pin-message">Ask Husain Alhashmi</p>
        )}

        <button className="forgot-pin-button" onClick={handleForgotPin}>Forgot PIN?</button>
      </div>
    </div>
  );
};

export default PinLockScreen;
