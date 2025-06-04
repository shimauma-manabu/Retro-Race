"use client"; // Good practice for consistency, though not strictly needed yet

import React from 'react';

const Track: React.FC = () => {
  const trackStyle: React.CSSProperties = {
    position: 'relative', // To position children like boundaries absolutely if needed, or just for context
    width: '100%', // Take full width of its container
    height: '100%', // Take full height of its container
    backgroundColor: 'dimgray', // Main track color
    display: 'flex',
    justifyContent: 'space-between', // To push boundaries to the sides
    overflow: 'hidden',
    zIndex: 1, // Base layer
  };

  const boundaryStyle: React.CSSProperties = {
    width: '50px', // Width of the track boundary/shoulder
    height: '100%', // Full height of the track
    backgroundColor: 'darkgreen', // Darker green for boundaries
  };

  const centerLineContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)', // Center the container
    height: '100%',
    width: '10px', // Width of the center line area
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around', // Distribute dashes
  };

  const dashStyle: React.CSSProperties = {
    width: '100%', // Full width of the centerLineContainer
    height: '40px', // Height of each dash
    backgroundColor: 'white',
    margin: '10px 0', // Spacing between dashes (adjust with justifyContent)
  };

  // Create an array for dashes, e.g., 10 dashes
  const numDashes = Array.from({ length: 10 });


  return (
    <div style={trackStyle}>
      <div style={boundaryStyle}></div> {/* Left Boundary */}
      <div style={centerLineContainerStyle}>
        {numDashes.map((_, index) => (
          <div key={index} style={dashStyle}></div>
        ))}
      </div>
      <div style={boundaryStyle}></div> {/* Right Boundary */}
    </div>
  );
};

export default Track;
