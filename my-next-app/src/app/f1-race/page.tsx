"use client";

import React, { useRef, useEffect } from 'react';

// --- Constants ---
const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;

// Road and camera properties
const ROAD_WIDTH = 2000; // Logical width of the road
const SEGMENT_LENGTH = 200; // Length of a single track segment
const CAMERA_HEIGHT = 1000; // Z-height of the camera
const CAMERA_DEPTH = 1 / Math.tan((22.5 / 180) * Math.PI); // Distance from camera to screen
const DRAW_DISTANCE = 300; // Number of segments to draw

// Colors
const COLORS = {
  LIGHT_ROAD: '#6B6B6B',
  DARK_ROAD: '#696969',
  LIGHT_GRASS: '#10AA10',
  DARK_GRASS: '#009A00',
  LIGHT_RUMBLE: 'white',
  DARK_RUMBLE: 'red',
};

const F1RacePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Player and world state
  const playerPosition = useRef(0); // Player's Z position along the track (distance)
  const playerX = useRef(0); // Player's X position on the road (-1 to 1)
  const speed = useRef(0); // Player's speed

  // Keyboard state
  const keys = useRef({ ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false });

  // --- Game Objects ---
  const trackSegments = useRef<any[]>([]);
  const opponents = useRef<any[]>([]);
  const time = useRef(0);

  // Function to project 3D world coordinates to 2D screen coordinates
  const project = (p: { world: { x: number; y: number; z: number; }; camera: { x: number; y: number; z: number; }; screen: { x: number; y: number; w: number; }; }, playerX: number, playerZ: number) => {
    const cameraX = p.world.x - playerX;
    const cameraZ = p.world.z - playerZ;

    p.camera.x = cameraX;
    p.camera.y = p.world.y - CAMERA_HEIGHT;
    p.camera.z = cameraZ;

    const scale = CAMERA_DEPTH / cameraZ;

    p.screen.x = Math.round((SCREEN_WIDTH / 2) + (scale * cameraX * SCREEN_WIDTH / 2));
    p.screen.y = Math.round((SCREEN_HEIGHT / 2) - (scale * p.camera.y * SCREEN_HEIGHT / 2));
    p.screen.w = Math.round(scale * ROAD_WIDTH * SCREEN_WIDTH / 2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Keyboard Event Handlers ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key as keyof typeof keys.current] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key as keyof typeof keys.current] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- Build The Track ---
    const buildTrack = () => {
        const segments = [];
        const addSegment = (curve: number, length: number) => {
            for(let n = 0; n < length; n++) {
                const index = segments.length;
                segments.push({
                    index,
                    p1: { world: { y: 0, z: index * SEGMENT_LENGTH } },
                    p2: { world: { y: 0, z: (index + 1) * SEGMENT_LENGTH } },
                    curve,
                    sprites: [],
                    color: Math.floor(index / 3) % 2 === 0 ? COLORS.LIGHT_ROAD : COLORS.DARK_ROAD,
                });
            }
        };

        const addScenery = () => {
            // Simple placeholder sprites
            for(let i = 10; i < 200; i+= 20) {
                trackSegments.current[i].sprites.push({ x: -1.5, source: 'tree' });
                trackSegments.current[i+5].sprites.push({ x: 2.0, source: 'tree' });
            }
        };

        // Build the track geometry
        addSegment(0, 50);
        addSegment(2, 50);
        addSegment(-2, 50);
        addSegment(0, 100);
        addSegment(4, 50);
        addSegment(-4, 50);
        addSegment(0, 200);
        trackSegments.current = segments;

        // Add scenery after track is built
        addScenery();
    };

    const resetOpponents = () => {
        opponents.current = [];
        // Add some opponents
        for(let i = 0; i < 10; i++) {
            opponents.current.push({
                x: Math.random() * 2 - 1, // Randomly on left or right side
                z: Math.random() * trackSegments.current.length * SEGMENT_LENGTH, // Randomly placed on track
                speed: 10000 + Math.random() * 5000 // Random speed
            });
        }
    };

    buildTrack();
    resetOpponents();

    let animationFrameId: number;

    // --- Game Loop ---
    const gameLoop = (timestamp: number) => {
      // 1. Update game state
      update();

      // 2. Render the frame
      draw(ctx);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // --- Update Function ---
    const update = () => {
        const dt = 1 / 60; // Assume 60fps for simplicity

        // --- Update Player ---
        const baseSegment = findSegment(playerPosition.current);
        const curve = baseSegment.curve || 0;

        // --- Handle Input & Speed ---
        const MAX_SPEED = 20000;
        const ACCEL = MAX_SPEED / 5;
        const BRAKING = -MAX_SPEED;
        const DECEL = -MAX_SPEED / 5;
        const OFF_ROAD_DECEL = -MAX_SPEED / 2;
        const OFF_ROAD_LIMIT = MAX_SPEED / 4;

        if (keys.current.ArrowUp) {
            speed.current += ACCEL * dt;
        } else if (keys.current.ArrowDown) {
            speed.current += BRAKING * dt;
        } else {
            speed.current += DECEL * dt;
        }

        // --- Handle Steering ---
        const steer = keys.current.ArrowLeft ? -1 : (keys.current.ArrowRight ? 1 : 0);
        playerX.current += steer * dt * 2 * (speed.current / MAX_SPEED);

        // --- Centrifugal force ---
        playerX.current -= dt * (speed.current / MAX_SPEED) * curve;

        // --- Update Position ---
        playerPosition.current += speed.current * dt;

        // Clamp speed
        if (Math.abs(playerX.current) > 1) { // Off road
            if (speed.current > OFF_ROAD_LIMIT) {
                speed.current += OFF_ROAD_DECEL * dt;
            }
        }
        speed.current = Math.max(0, Math.min(speed.current, MAX_SPEED)); // Clamp speed
        playerX.current = Math.max(-2, Math.min(playerX.current, 2)); // Clamp playerX


        // --- Collision Detection ---
        const playerSegment = findSegment(playerPosition.current + 50); // Check slightly ahead
        // Scenery collision
        for (const sprite of playerSegment.sprites) {
            if (Math.abs(playerX.current - sprite.x) < 0.5) {
                speed.current = 0; // Dead stop
            }
        }
        // Opponent collision
        for (const opponent of opponents.current) {
            if (findSegment(opponent.z).index === playerSegment.index) {
                if (Math.abs(playerX.current - opponent.x) < 0.5) {
                    speed.current = 0; // Dead stop
                }
            }
        }

        // --- Update Opponents ---
        for (const opponent of opponents.current) {
            opponent.z += opponent.speed * dt;
            if (opponent.z > trackSegments.current.length * SEGMENT_LENGTH) {
                opponent.z -= trackSegments.current.length * SEGMENT_LENGTH; // Loop around
            }
        }

        // --- Update Time ---
        time.current += dt;
    };

    // --- Draw Function ---
    const draw = (context: CanvasRenderingContext2D) => {
      // Clear the canvas
      context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Draw background
      context.fillStyle = 'skyblue';
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
      context.fillStyle = 'green';
      context.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

      // --- Render the Road and Scenery ---
      const baseSegment = findSegment(playerPosition.current);
      let worldX = 0; // This will accumulate curvature

      for (let n = 0; n < DRAW_DISTANCE; n++) {
        const segmentIndex = (baseSegment.index + n) % trackSegments.current.length;
        const segment = trackSegments.current[segmentIndex];

        const looped = segmentIndex < baseSegment.index;
        const segmentPlayerDist = (looped ? trackSegments.current.length * SEGMENT_LENGTH : 0) + segment.p1.world.z - playerPosition.current;

        // Apply curvature
        const segCurve = segment.curve;
        worldX += segCurve * (speed.current / 20000); // simplified curve effect

        segment.p1.world.x = playerX.current * ROAD_WIDTH - worldX;
        segment.p2.world.x = playerX.current * ROAD_WIDTH - worldX;

        // Project the segment points to the screen
        project(segment.p1, playerX.current * ROAD_WIDTH, playerPosition.current);
        project(segment.p2, playerX.current * ROAD_WIDTH, playerPosition.current);

        // Don't draw segments behind the camera
        if (segment.p1.camera.z <= CAMERA_DEPTH) continue;

        drawSegment(context, segment);

        // --- Draw Sprites ---
        for (const sprite of segment.sprites) {
            const spriteScale = segment.p1.screen.w / 200;
            const spriteX = segment.p1.screen.x + (spriteScale * sprite.x * SCREEN_WIDTH / 2);
            const spriteY = segment.p1.screen.y;
            drawSprite(context, 'tree', spriteX, spriteY, spriteScale);
        }

        // --- Draw Opponents ---
        for (const opponent of opponents.current) {
            if (opponent.z > playerPosition.current && opponent.z < playerPosition.current + DRAW_DISTANCE * SEGMENT_LENGTH) {
                const opponentSegment = findSegment(opponent.z);
                const opponentScreenY = opponentSegment.p1.screen.y; // Simplified Y position
                const opponentScale = opponentSegment.p1.screen.w / 200;
                const opponentScreenX = opponentSegment.p1.screen.x + (opponentScale * opponent.x * SCREEN_WIDTH / 2);
                drawSprite(context, 'opponent', opponentScreenX, opponentScreenY, opponentScale);
            }
        }
      }

      // --- Draw Player Car ---
      context.fillStyle = 'red';
      context.fillRect(SCREEN_WIDTH / 2 - 15, SCREEN_HEIGHT - 60, 30, 30); // Simple rectangle for the car

      // --- Draw Timer ---
      context.fillStyle = 'white';
      context.font = '30px Monospace';
      context.textAlign = 'center';
      context.fillText(formatTime(time.current), SCREEN_WIDTH / 2, 40);

      // --- Draw UI Elements ---
      drawMinimap(context);
      drawTurnIndicator(context);
    };

    const formatTime = (t: number) => {
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60);
        const milliseconds = Math.floor((t % 1) * 100);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    };

    const drawMinimap = (ctx: CanvasRenderingContext2D) => {
        const mapSize = 100;
        const mapX = SCREEN_WIDTH - mapSize - 10;
        const mapY = 10;
        const scale = mapSize / (trackSegments.current.length * SEGMENT_LENGTH);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let currentX = mapX + mapSize / 2;
        let currentY = mapY;
        let angle = -Math.PI / 2; // Start pointing up

        ctx.moveTo(currentX, currentY);

        for(const segment of trackSegments.current) {
            const length = SEGMENT_LENGTH * scale;
            angle += (segment.curve / 20) * scale;
            currentX += Math.cos(angle) * length;
            currentY += Math.sin(angle) * length;
            ctx.lineTo(currentX, currentY);
        }
        ctx.stroke();

        // Draw player position
        const playerAngle = -Math.PI / 2; // simplified
        const playerMapX = mapX + mapSize / 2;
        const playerMapY = mapY + (playerPosition.current * scale);
        ctx.fillStyle = 'red';
        ctx.fillRect(playerMapX - 2, playerMapY - 2, 4, 4);
    };

    const drawTurnIndicator = (ctx: CanvasRenderingContext2D) => {
        const baseSegment = findSegment(playerPosition.current);
        let upcomingCurve = 0;
        for(let i = 1; i < 100; i++) {
            const segment = trackSegments.current[(baseSegment.index + i) % trackSegments.current.length];
            if (segment.curve !== 0) {
                upcomingCurve = segment.curve;
                break;
            }
        }

        if (upcomingCurve !== 0) {
            ctx.fillStyle = 'white';
            ctx.font = '40px Monospace';
            ctx.textAlign = 'left';
            let indicator = '';
            if (upcomingCurve > 0) { // Right turn
                indicator = Math.abs(upcomingCurve) > 2 ? '>>' : '>';
            } else { // Left turn
                indicator = Math.abs(upcomingCurve) > 2 ? '<<' : '<';
            }
            ctx.fillText(indicator, 20, 50);
        }
    };

    const drawSprite = (ctx: CanvasRenderingContext2D, source: string, x: number, y: number, scale: number) => {
        const spriteW = (source === 'opponent' ? 25 : 100) * scale;
        const spriteH = (source === 'opponent' ? 25 : 200) * scale;

        if (source === 'tree') {
            ctx.fillStyle = '#964B00'; // Brown for trunk
            ctx.fillRect(x - (spriteW / 2), y - spriteH, spriteW, spriteH);
            ctx.fillStyle = 'darkgreen'; // Green for leaves
            ctx.beginPath();
            ctx.moveTo(x, y - spriteH * 1.5);
            ctx.lineTo(x - spriteW, y - spriteH * 0.8);
            ctx.lineTo(x + spriteW, y - spriteH * 0.8);
            ctx.closePath();
            ctx.fill();
        } else if (source === 'opponent') {
            ctx.fillStyle = 'blue'; // Blue car
            ctx.fillRect(x - (spriteW / 2), y - spriteH, spriteW, spriteH);
        }
    };

    const findSegment = (z: number) => {
        return trackSegments.current[Math.floor(z / SEGMENT_LENGTH) % trackSegments.current.length];
    }

    const drawSegment = (ctx: CanvasRenderingContext2D, segment: { p1: { screen: { x: any; y: any; w: any; }; }; p2: { screen: { x: any; y: any; w: any; }; }; color: any; }) => {
        const p1 = segment.p1.screen;
        const p2 = segment.p2.screen;

        // Draw grass
        ctx.fillStyle = Math.floor(segment.index / 3) % 2 === 0 ? COLORS.LIGHT_GRASS : COLORS.DARK_GRASS;
        ctx.fillRect(0, p2.y, SCREEN_WIDTH, p1.y - p2.y);

        // Draw road
        drawPolygon(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, segment.color);

        // Draw rumble strips
        const rumbleWidth1 = p1.w / 5;
        const rumbleWidth2 = p2.w / 5;
        const rumbleColor = Math.floor(segment.index / 3) % 2 === 0 ? COLORS.LIGHT_RUMBLE : COLORS.DARK_RUMBLE;
        drawPolygon(ctx, p1.x - p1.w, p1.y, p1.x - p1.w + rumbleWidth1, p1.y, p2.x - p2.w + rumbleWidth2, p2.y, p2.x - p2.w, p2.y, rumbleColor);
        drawPolygon(ctx, p1.x + p1.w, p1.y, p1.x + p1.w - rumbleWidth1, p1.y, p2.x + p2.w - rumbleWidth2, p2.y, p2.x + p2.w, p2.y, rumbleColor);
    };

    const drawPolygon = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    };


    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);

    // Cleanup function to stop the loop when the component unmounts
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#333', padding: '20px' }}>
      <h1 style={{ color: 'white' }}>F1 Race Game</h1>
      <canvas
        ref={canvasRef}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={{ border: '2px solid white', backgroundColor: 'black' }}
      />
    </div>
  );
};

export default F1RacePage;
