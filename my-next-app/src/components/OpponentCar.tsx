"use client";

import React, { useState, useEffect } from 'react';

export const CAR_WIDTH = 50; // Using shared constants is also an option later
export const CAR_HEIGHT = 100;

interface OpponentCarProps {
  id: any; // Unique identifier for this opponent
  initialXPosition: number;
  initialYPosition: number;
  speed?: number;
  onOpponentMove: (id: any, rect: { x: number; y: number; width: number; height: number }) => void;
  canvasHeight: number; // To know when to stop rendering/moving
}

const OpponentCar: React.FC<OpponentCarProps> = ({
  id,
  initialXPosition,
  initialYPosition,
  speed = 2,
  onOpponentMove,
  canvasHeight,
  gameOver, // New prop
}) => {
  const [yPosition, setYPosition] = useState<number>(initialYPosition);

  useEffect(() => {
    if (gameOver) {
      // If game is over, don't start or continue the interval for this car
      // If an interval was already running, it won't be cleared here unless
      // gameOver status changes, but new positions won't be set.
      // A more robust way might be to clear interval if gameOver becomes true.
      return;
    }

    const moveInterval = setInterval(() => {
      setYPosition((prevY) => {
        // Check gameOver again inside interval, in case it changed
        if (gameOver) return prevY;
        const newY = prevY + speed;
        onOpponentMove(id, { x: initialXPosition, y: newY, width: CAR_WIDTH, height: CAR_HEIGHT });
        return newY;
      });
    }, 50);

    return () => {
      clearInterval(moveInterval);
    };
  }, [speed, id, initialXPosition, onOpponentMove, gameOver]); // Added gameOver to dependencies

  // Car style
  const carStyle: React.CSSProperties = {
    width: `${CAR_WIDTH}px`,
    height: `${CAR_HEIGHT}px`,
    backgroundColor: 'firebrick', // Darker red
    position: 'absolute',
    left: `${initialXPosition}px`,
    top: `${yPosition}px`,
    border: '1px solid black',
    borderRadius: '5px 5px 0 0',
    zIndex: 9, // Slightly lower zIndex than player car if they could overlap
  };

  // Stop rendering if car is off-screen (bottom)
  if (yPosition > canvasHeight) {
    return null;
  }

  return <div style={carStyle}>{/* Opponent Car */}</div>;
};

export default OpponentCar;
