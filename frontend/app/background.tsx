'use client';
import Particles from './Particles/Particles';

export default function Background() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'absolute' }}>
      <Particles
        particleColors={['#0380ce', '#2d6cd2']}
        particleCount={1000}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />
    </div>
  );
}
