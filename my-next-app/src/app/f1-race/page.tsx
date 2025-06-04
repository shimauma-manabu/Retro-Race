"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PlayerCar, { CAR_WIDTH as PLAYER_CAR_WIDTH, CAR_HEIGHT as PLAYER_CAR_HEIGHT } from '@/components/PlayerCar';
import Track from '@/components/Track';
import OpponentCar, { CAR_WIDTH as OPPONENT_CAR_WIDTH, CAR_HEIGHT as OPPONENT_CAR_HEIGHT } from '@/components/OpponentCar';

// Game constants
const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 500; // Keep this consistent with placeholder style
const TRACK_BOUNDARY_WIDTH = 50; // Width of the green shoulders in Track.tsx

const PLAYER_START_X = CANVAS_WIDTH / 2 - PLAYER_CAR_WIDTH / 2;
const PLAYER_Y_POSITION = CANVAS_HEIGHT - PLAYER_CAR_HEIGHT - 10; // 10px from bottom

const PLAYER_MIN_X = TRACK_BOUNDARY_WIDTH;
const PLAYER_MAX_X = CANVAS_WIDTH - TRACK_BOUNDARY_WIDTH - PLAYER_CAR_WIDTH;

// Initial opponent configurations
const initialOpponentsData = [
  { id: 1, x: 60, y: -OPPONENT_CAR_HEIGHT - 50, speed: 2.5 },
  { id: 2, x: 150, y: -OPPONENT_CAR_HEIGHT - 150, speed: 2 },
  { id: 3, x: 240, y: -OPPONENT_CAR_HEIGHT - 100, speed: 3 },
];

export default function F1RacePage() {
  const [playerPosition, setPlayerPosition] = useState({ x: PLAYER_START_X, y: PLAYER_Y_POSITION });
  const [opponentPositions, setOpponentPositions] = useState<Map<any, { x: number; y: number; width: number; height: number }>>(new Map());
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Score increment effect
  useEffect(() => {
    if (gameOver) {
      return; // Stop scoring when game is over
    }

    const scoreInterval = setInterval(() => {
      setScore(prevScore => prevScore + 10);
    }, 1000); // Increment score every second

    return () => {
      clearInterval(scoreInterval); // Cleanup interval on component unmount or if gameOver changes
    };
  }, [gameOver]); // Rerun effect if gameOver status changes

  const handlePlayerPositionChange = useCallback((newX: number) => {
    if (gameOver) return;
    // Check track boundaries
    const boundedX = Math.max(PLAYER_MIN_X, Math.min(newX, PLAYER_MAX_X));
    setPlayerPosition(prev => ({ ...prev, x: boundedX }));
  }, [gameOver]);

  const handleOpponentMove = useCallback((id: any, rect: { x: number; y: number; width: number; height: number }) => {
    if (gameOver) return;
    setOpponentPositions(prev => new Map(prev).set(id, rect));
  }, [gameOver]);

  // Collision detection effect
  useEffect(() => {
    if (gameOver) return;

    const playerRect = {
      x: playerPosition.x,
      y: playerPosition.y,
      width: PLAYER_CAR_WIDTH,
      height: PLAYER_CAR_HEIGHT
    };

    for (const opponentRect of opponentPositions.values()) {
      if (
        playerRect.x < opponentRect.x + opponentRect.width &&
        playerRect.x + playerRect.width > opponentRect.x &&
        playerRect.y < opponentRect.y + opponentRect.height &&
        playerRect.y + playerRect.height > opponentRect.y
      ) {
        console.log("Collision detected with opponent ID:", [...opponentPositions.entries()].find(([_, val]) => val === opponentRect)?.[0]);
        setGameOver(true);
        // alert("Game Over! Collision!"); // Alert can be disruptive, console log is better for now
        break;
      }
    }
  }, [playerPosition, opponentPositions, gameOver]);

  // Reset game state (e.g., for a restart button later)
  // const resetGame = () => {
  //   setPlayerPosition({ x: PLAYER_START_X, y: PLAYER_Y_POSITION });
  //   setOpponentPositions(new Map());
  //   setGameOver(false);
  //   // Could also re-initialize opponents if their starting Y needs reset
  // };

  return (
    <div style={{ textAlign: 'center' }}> {/* Centering the game title and canvas */}
      <h1>F1 Race Game {gameOver && <span style={{ color: 'red', fontWeight: 'bold' }}>- GAME OVER!</span>}</h1>
      <div style={{ fontSize: '1.5em', margin: '10px 0', fontWeight: 'bold', color: '#333333' }}>Score: {score}</div>
      <div
        id="game-canvas-placeholder"
        style={{
          position: 'relative',
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          margin: '20px auto', // Added more margin for better separation
          border: '2px solid midnightblue', // Made border more prominent
          borderRadius: '5px', // Slightly rounded corners for the canvas
          overflow: 'hidden',
          backgroundColor: '#efefef', // Slightly adjusted background
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)', // Subtle shadow for depth
        }}
      >
        {/* Score display can also be positioned absolutely inside the canvas if preferred */}
        {/* <div style={{position: 'absolute', top: '10px', left: '10px', fontSize: '1.5em', color: 'black', zIndex: 50}}>Score: {score}</div> */}
        <Track />
        {initialOpponentsData.map(op => (
          <OpponentCar
            key={op.id}
            id={op.id}
            initialXPosition={op.x}
            initialYPosition={op.y}
            speed={op.speed}
            onOpponentMove={handleOpponentMove}
            canvasHeight={CANVAS_HEIGHT}
            gameOver={gameOver} // Pass gameOver state
          />
        ))}
        {!gameOver && (
          <PlayerCar
            xPosition={playerPosition.x}
            yPosition={playerPosition.y}
            onPositionChange={handlePlayerPositionChange}
          />
        )}
        {gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '20px',
            borderRadius: '10px',
            fontSize: '2.5em', // Made font larger
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 100 // Ensure it's on top
          }}>
            GAME OVER!
            {/* Optionally, add a button here to reset the game */}
            {/* <button onClick={resetGame} style={{fontSize: '0.5em', padding: '10px', marginTop: '20px', cursor: 'pointer'}}>Play Again?</button> */}
          </div>
        )}
      </div>
      {/* <button onClick={resetGame}>Reset Game</button> */}
    </div>
  );
}
