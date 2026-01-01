import { create } from 'zustand'
import * as THREE from 'three'

// Type definitions
export type Axis = 'x' | 'y' | 'z'
export type Direction = 1 | -1

export interface Cubie {
    id: number
    position: [number, number, number] // Current Logic Position (rounded)
    rotation: [number, number, number] // Current Logic Rotation
    basePosition: [number, number, number] // Initial position to determine colors
}

interface CubeState {
    cubies: Cubie[]
    isAnimating: boolean
    // Actions
    setIsAnimating: (isAnimating: boolean) => void
    rotateLayer: (axis: Axis, layerIndex: number, direction: Direction) => void
    reset: () => void
    shuffle: () => Promise<void>
}

// Helper to generate initial 27 cubies
const generateInitialCubies = (): Cubie[] => {
    const cubies: Cubie[] = []
    let id = 0
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                cubies.push({
                    id: id++,
                    position: [x, y, z],
                    rotation: [0, 0, 0],
                    basePosition: [x, y, z]
                })
            }
        }
    }
    return cubies
}



export const useCubeStore = create<CubeState>((set, get) => ({
    cubies: generateInitialCubies(),
    isAnimating: false,

    setIsAnimating: (isAnimating) => set({ isAnimating }),

    rotateLayer: (axis, layerIndex, direction) => {
        set((state) => {
            const indexMap = { x: 0, y: 1, z: 2 }
            const axIdx = indexMap[axis]

            // Define the rotation quaternion for this move
            const axesVec = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }
            const q = new THREE.Quaternion()
            // Note: direction is 1 or -1. -1 might need to be inverted depending on coordinate system, 
            // but let's stick to standard Right-Hand Rule: 
            // Axis +1, rotation positive is counter-clockwise.
            q.setFromAxisAngle(axesVec[axis], (Math.PI / 2) * -direction) // Invert direction to match logic if needed, but let's try standard.
            // Wait, in standard 3D:
            // If I look at X axis from positive:
            // "Right" face (x=1). 
            // Rotating +X (so ccw) means Front(z=1) goes to Up(y=1)?
            // y' = y*cos - z*sin
            // z' = y*sin + z*cos
            // If rot=90 (PI/2): cos=0, sin=1.
            // y' = -z
            // z' = y
            // (0,1,0) -> (0,0,1). Up -> Front. 
            // Wait, Up is +y, Front is +z. +y -> +z is rotation around +x? 
            // Let's use THREE's standard math to be safe.

            const newCubies = state.cubies.map((cubie) => {
                // Check if cubie is in the layer
                // We use rounding to avoid float errors
                if (Math.round(cubie.position[axIdx]) === layerIndex) {

                    // 1. Update Position (Vector3 rotation)
                    const v = new THREE.Vector3(...cubie.position)
                    v.applyQuaternion(q)
                    v.round() // Snap to grid
                    const newPos: [number, number, number] = [v.x, v.y, v.z]

                    // 2. Update Rotation (Quaternion multiplication)
                    // Current rotation to quaternion
                    const oldEuler = new THREE.Euler(...cubie.rotation)
                    const oldQ = new THREE.Quaternion().setFromEuler(oldEuler)

                    // New rotation = q * oldQ (Pre-multiply because we rotate the object in world space axis)
                    // Or Post-multiply? 
                    // We are rotating the "Group" that contains the cubie.
                    // Effectively, we apply a world-axis rotation to the cubie.
                    // So: newQ = q * oldQ
                    const newQ = q.clone().multiply(oldQ)

                    const newEuler = new THREE.Euler().setFromQuaternion(newQ)
                    const newRot: [number, number, number] = [newEuler.x, newEuler.y, newEuler.z]

                    return {
                        ...cubie,
                        position: newPos,
                        rotation: newRot
                    }
                }
                return cubie
            })

            return { cubies: newCubies }
        })
    },

    reset: () => set({ cubies: generateInitialCubies() }),

    shuffle: async () => {
        const axes: Axis[] = ['x', 'y', 'z']
        const dirs: Direction[] = [1, -1]
        const layers = [-1, 0, 1]

        // Perform 20 random moves instantly
        for (let i = 0; i < 20; i++) {
            const axis = axes[Math.floor(Math.random() * axes.length)]
            const dir = dirs[Math.floor(Math.random() * dirs.length)]
            const layer = layers[Math.floor(Math.random() * layers.length)]

            // We need to call the action. 
            // Since we are inside the store, we can use set() or just call the function if we extracted it.
            // But rotateLayer is defined in the object.
            get().rotateLayer(axis, layer, dir)
        }
    }

}))
