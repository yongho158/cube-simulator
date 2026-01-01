import React, { useMemo } from 'react'
import * as THREE from 'three'

interface SubCubeProps {
    position: [number, number, number]
    scale?: number
    id?: number
    basePosition: [number, number, number]
    rotation?: [number, number, number]
}

export const CUBE_Colors = {
    U: '#ecf0f1', // Up
    D: '#f1c40f', // Down
    R: '#e74c3c', // Right
    L: '#e67e22', // Left
    F: '#2ecc71', // Front
    B: '#3498db', // Back
    Core: '#2c3e50' // Core
}

const SubCube = React.forwardRef<THREE.Group, SubCubeProps>(({ position, basePosition, scale = 0.95, ...props }, ref) => {
    const [x, y, z] = basePosition

    const materials = useMemo(() => {
        const options = { roughness: 0.1, metalness: 0.1 }
        return [
            new THREE.MeshStandardMaterial({ color: x === 1 ? CUBE_Colors.R : CUBE_Colors.Core, ...options }), // Right (x+)
            new THREE.MeshStandardMaterial({ color: x === -1 ? CUBE_Colors.L : CUBE_Colors.Core, ...options }), // Left (x-)
            new THREE.MeshStandardMaterial({ color: y === 1 ? CUBE_Colors.U : CUBE_Colors.Core, ...options }), // Top (y+)
            new THREE.MeshStandardMaterial({ color: y === -1 ? CUBE_Colors.D : CUBE_Colors.Core, ...options }), // Bottom (y-)
            new THREE.MeshStandardMaterial({ color: z === 1 ? CUBE_Colors.F : CUBE_Colors.Core, ...options }), // Front (z+)
            new THREE.MeshStandardMaterial({ color: z === -1 ? CUBE_Colors.B : CUBE_Colors.Core, ...options }), // Back (z-)
        ]
    }, [x, y, z])

    return (
        <group ref={ref} position={position} {...props}>
            <mesh material={materials}>
                <boxGeometry args={[scale, scale, scale]} />
            </mesh>

            <mesh>
                <boxGeometry args={[scale * 1.001, scale * 1.001, scale * 1.001]} />
                <meshBasicMaterial color="black" wireframe />
            </mesh>
        </group>
    )
})

export default SubCube
