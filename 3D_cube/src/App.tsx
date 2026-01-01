import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import Cube from './components/Cube'
import Controls from './components/Controls'

function App() {
  return (
    <div className="relative w-full h-full bg-gray-900">
      <Canvas camera={{ position: [6, 4, 6], fov: 45 }}>
        <color attach="background" args={['#111']} />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} castShadow />

        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />

        {/* Main Content */}
        <Cube />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={20}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* UI Overlay */}
      <Controls />
    </div>
  )
}

export default App
