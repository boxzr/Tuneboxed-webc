import React from 'react';

// Inline CSS for direct styling without any class dependencies
const containerStyle = {
  padding: '20px', 
  textAlign: 'center' as const,
  maxWidth: '800px',
  margin: '0 auto'
};

const imageContainerStyle = {
  marginTop: '30px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '30px'
};

const boxStyle = {
  width: '300px',
  height: '300px',
  border: '3px solid #1B2D4E',
  overflow: 'hidden'
};

const imgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block'
};

function Home() {
  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>TUNEBOXED</h1>
      <p style={{ marginBottom: '40px' }}>Showcase your music taste.</p>
      
      <div style={imageContainerStyle}>
        <div style={boxStyle}>
          <img src="/story1.png" alt="Story 1" style={imgStyle} />
        </div>
        
        <div style={boxStyle}>
          <img src="/story2.png" alt="Story 2" style={imgStyle} />
        </div>
        
        <div style={boxStyle}>
          <img src="/story3.png" alt="Story 3" style={imgStyle} />
        </div>
      </div>
    </div>
  );
}

export default Home;
