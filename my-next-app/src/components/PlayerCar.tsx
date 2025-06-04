"use client";

import React, { useEffect } from 'react';

export const CAR_WIDTH = 50;
export const CAR_HEIGHT = 100;
const MOVE_STEP = 10; // Pixels to move per key press

interface PlayerCarProps {
  xPosition: number;
  yPosition: number; // For styling top/bottom, parent now controls Y
  onPositionChange: (newX: number) => void;
}

const PlayerCar: React.FC<PlayerCarProps> = ({ xPosition, yPosition, onPositionChange }) => {
  // Car dimensions and style
  const carStyle: React.CSSProperties = {
    width: `${CAR_WIDTH}px`,
    height: `${CAR_HEIGHT}px`,
    backgroundColor: 'royalblue', // Changed color slightly
    position: 'absolute',
    left: `${xPosition}px`,
    top: `${yPosition}px`,
    border: '1px solid black',
    borderRadius: '5px 5px 0 0', // Rounded top
    zIndex: 10, // Ensure player car is above track and opponents, but below Game Over message
  };

  const cockpitStyle: React.CSSProperties = {
    width: `${CAR_WIDTH * 0.6}px`, // 60% of car width
    height: `${CAR_HEIGHT * 0.3}px`, // 30% of car height
    backgroundColor: 'black',
    position: 'absolute',
    top: `${CAR_HEIGHT * 0.1}px`, // 10% from the top of the car
    left: `${CAR_WIDTH * 0.2}px`, // Centered (20% from left)
    borderRadius: '3px 3px 0 0',
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        onPositionChange(xPosition - MOVE_STEP);
      } else if (event.key === 'ArrowRight') {
        onPositionChange(xPosition + MOVE_STEP);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [xPosition, onPositionChange]); // Re-attach if xPosition or onPositionChange changes

  return (
    <div style={carStyle}>
      <div style={cockpitStyle}></div>
      {/* Player Car */}
    </div>
  );
};

export default PlayerCar;
