import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { Axis, Direction } from '../store/useCubeStore'
import { useCubeStore } from '../store/useCubeStore'
import SubCube from './SubCube'


export default function Cube() {
    const { cubies, rotateLayer, isAnimating, setIsAnimating, shuffle } = useCubeStore()
    const groupRef = useRef<THREE.Group>(null)
    const pivotRef = useRef<THREE.Group>(null)
    const cubieRefs = useRef<{ [key: number]: THREE.Group }>({})

    // Animation State
    const [animationTask, setAnimationTask] = useState<{
        axis: Axis
        layerIndex: number
        direction: Direction
        progress: number
    } | null>(null)

    // Sync refs with store changes (initial position) is handled by React render.
    // But we need to handle the "Grab -> Rotate -> Release" flow.

    useFrame((_, delta) => {
        if (animationTask && pivotRef.current) {
            // Increment progress
            const speed = 5 * delta // Adjust speed
            let newProgress = animationTask.progress + speed
            if (newProgress >= Math.PI / 2) {
                newProgress = Math.PI / 2
            }

            // Apply rotation to pivot
            const { axis, direction } = animationTask
            pivotRef.current.rotation[axis] = newProgress * direction * -1 // ThreeJS rotation direction might differ

            if (newProgress >= Math.PI / 2) {
                // Animation Complete
                finishAnimation()
            } else {
                setAnimationTask(prev => prev ? ({ ...prev, progress: newProgress }) : null)
            }
        }
    })

    const startAnimation = (axis: Axis, layerIndex: number, direction: Direction) => {
        if (isAnimating) return
        setIsAnimating(true)

        // 1. Reset Pivot
        if (!pivotRef.current || !groupRef.current) return
        pivotRef.current.rotation.set(0, 0, 0)
        pivotRef.current.position.set(0, 0, 0)

        // 2. Attach relevant cubes to pivot
        // Filter cubies that are in the layer
        // We must check their CURRENT world position to be safe, 
        // but relying on Logic Position (Store) is safer for consistency if we sync correctly.

        const activeCubieIds: number[] = []

        cubies.forEach(cubie => {
            // Check if cubie is in the layer
            // We use the Store's logical position
            const pos = cubie.position
            const indexMap = { x: 0, y: 1, z: 2 }
            const axIdx = indexMap[axis]
            if (Math.round(pos[axIdx]) === layerIndex) {
                activeCubieIds.push(cubie.id)
            }
        })

        activeCubieIds.forEach(id => {
            const obj = cubieRefs.current[id]
            if (obj) {
                pivotRef.current?.attach(obj)
            }
        })

        setAnimationTask({ axis, layerIndex, direction, progress: 0 })
    }

    const finishAnimation = () => {
        if (!animationTask) return

        const { axis, layerIndex, direction } = animationTask

        // 1. Detach cubes back to main group (preserving transform)
        if (pivotRef.current && groupRef.current) {
            // We iterate over children of pivot, or use our list
            // IMPORTANT: iterate backwards or copy array because modifying children list
            const children = [...pivotRef.current.children]
            children.forEach(child => {
                groupRef.current?.attach(child)
            })
        }

        // 2. Update Store Logic
        rotateLayer(axis, layerIndex, direction)

        // 3. Reset State
        setAnimationTask(null)
        setIsAnimating(false)
        if (pivotRef.current) pivotRef.current.rotation.set(0, 0, 0)
    }

    // Camera & Quadrant Logic
    const { camera } = useThree()
    const [quadrant, setQuadrant] = useState(0) // 0:Front, 1:Right, 2:Back, 3:Left

    useFrame(() => {
        // Calculate Camera Azimuth (Angle in X-Z plane)
        // atan2(z, x) returns angle from -PI to PI
        // We want 0 at +Z (Front), but standard Math.atan2(z, x):
        // x=0, z=1 -> PI/2 (90deg)
        // x=1, z=0 -> 0deg
        // Let's use standard atan2 logic:
        const angle = Math.atan2(camera.position.x, camera.position.z)
        // angle is 0 at +Z? No, atan2(x, z) means x is opposite, z is adjacent. tan = x/z.
        // If z is large (Front), x=0 -> atan2(0, 1) = 0. Correct.
        // If x is large (Right), z=0 -> atan2(1, 0) = PI/2. Correct.
        // So 0=Front, 1=Right, 2=Back, 3=Left approximately.

        // Normalize angle to 0..2PI
        let normAngle = angle
        if (normAngle < 0) normAngle += Math.PI * 2

        // Divide by PI/2 (90deg) to get quadrant
        // 0 (Front): 315(-45) to 45 -> near 0
        // 1 (Right): 45 to 135 -> near PI/2
        // 2 (Back): 135 to 225 -> near PI
        // 3 (Left): 225 to 315 -> near 3PI/2

        // Shift by 45deg (PI/4) to align boundaries
        const shifted = normAngle + Math.PI / 4
        const q = Math.floor(shifted / (Math.PI / 2)) % 4

        if (q !== quadrant) setQuadrant(q)
    })

    // Keyboard Controls (Camera Relative)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAnimating) return
            // Shift inverts direction
            let dir = (e.shiftKey ? -1 : 1) as Direction

            const key = e.key.toLowerCase()

            // Helper to map visual column to actual action
            const rotateVert = (visualCol: 'left' | 'mid' | 'right') => {
                // Front (0): +Z face. Left=x-1, Right=x+1
                // Right (1): +X face. Left=z+1, Right=z-1
                // Back (2): -Z face. Left=x+1, Right=x-1
                // Left (3): -X face. Left=z-1, Right=z+1

                if (quadrant === 0) { // Front
                    // Front (+Z): +X rot moves Top->Front (Down). We want Up, so -X rot.
                    if (visualCol === 'left') startAnimation('x', -1, -dir as Direction)
                    if (visualCol === 'mid') startAnimation('x', 0, -dir as Direction)
                    if (visualCol === 'right') startAnimation('x', 1, -dir as Direction)
                } else if (quadrant === 1) { // Right
                    // Right (+X): +Z rot moves Right(+X)->Top(+Y). Up.
                    if (visualCol === 'left') startAnimation('z', 1, dir)
                    if (visualCol === 'mid') startAnimation('z', 0, dir)
                    if (visualCol === 'right') startAnimation('z', -1, dir)
                } else if (quadrant === 2) { // Back
                    // Back (-Z): +X rot moves Top->Front(+Z) (Away/Up from Back view).
                    if (visualCol === 'left') startAnimation('x', 1, dir)
                    if (visualCol === 'mid') startAnimation('x', 0, dir)
                    if (visualCol === 'right') startAnimation('x', -1, dir)
                } else if (quadrant === 3) { // Left
                    // Left (-X): +Z rot moves Left(-X)->Down(-Y). We want Up(-X->+Y), so -Z rot.
                    if (visualCol === 'left') startAnimation('z', -1, -dir as Direction)
                    if (visualCol === 'mid') startAnimation('z', 0, -dir as Direction)
                    if (visualCol === 'right') startAnimation('z', 1, -dir as Direction)
                }
            }

            const rotateHoriz = (visualRow: 'top' | 'mid' | 'bottom') => {
                // Horizontal is always Y axis. But direction might need flip.
                // Front: Standard.
                // Right: Standard. 
                // Back: Inverted? If I press 'A' (Left turn), top layer should go left.
                // In Back view, 'Left' is +X. In Front view 'Left' is -X.
                // Y-rotation +1 (CCW from top): Moves +Z points to +X.
                // Front view (+Z): +Z -> +X is "Right". 
                // Wait, standard +Y rotation: (1,0,0) -> (0,0,-1). X -> -Z.
                // Let's test. Standard dir=1 is CCW.
                // Front View: Top face moves Left.
                // Back View: Top face moves Right.
                // So for Back/Left quadrants, we might want to invert dir to keep 'A' moving 'Left'.

                // User requested unified "Right" rotation for horizontal lines.
                // Default 'dir' is 1. We want -1 for Right.
                // A global -Y rotation (Clockwise from top) looks like "Right" from all sides.
                let effectiveDir = -dir as Direction

                let yIndex = 0
                if (visualRow === 'top') yIndex = 1
                if (visualRow === 'bottom') yIndex = -1

                startAnimation('y', yIndex, effectiveDir)
            }

            switch (key) {
                // Shuffle
                case 'r': shuffle(); break;

                // Vertical
                case 'q': rotateVert('left'); break;
                case 'w': rotateVert('mid'); break;
                case 'e': rotateVert('right'); break;

                // Horizontal
                case 'a': rotateHoriz('top'); break;
                case 's': rotateHoriz('mid'); break;
                case 'd': rotateHoriz('bottom'); break;

                // Legacy
                case 'arrowup': startAnimation('x', 1, 1); break;
                case 'arrowdown': startAnimation('x', 1, -1); break;
                case 'arrowleft': startAnimation('y', 1, 1); break;
                case 'arrowright': startAnimation('y', 1, -1); break;
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isAnimating, cubies, shuffle, quadrant, camera]) // Added dependencies

    // Active Face Highlighter Component
    const ActiveFaceHighlighter = () => {
        // quadrant: 0=Front(Z+), 1=Right(X+), 2=Back(Z-), 3=Left(X-)
        const pos = [0, 0, 0] as [number, number, number]
        const rot = [0, 0, 0] as [number, number, number]
        // Removed unused scale variable

        switch (quadrant) {
            case 0: // Front (+Z)
                pos[2] = 1.55 // Slightly offset to avoid z-fighting if exact
                break;
            case 1: // Right (+X)
                pos[0] = 1.55
                rot[1] = Math.PI / 2
                break;
            case 2: // Back (-Z)
                pos[2] = -1.55
                break;
            case 3: // Left (-X)
                pos[0] = -1.55
                rot[1] = Math.PI / 2
                break;
        }

        return (
            <mesh position={pos} rotation={rot as any}>
                <boxGeometry args={[3.1, 3.1, 0.1]} />
                <meshBasicMaterial
                    color="#facc15" // Yellow-400
                    transparent
                    opacity={0.15}
                    wireframe={false} // Semi-transparent face
                />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(3.1, 3.1, 0.1)]} />
                    <lineBasicMaterial color="#fef08a" opacity={0.6} transparent />
                </lineSegments>
            </mesh>
        )
    }

    // Event Listener for UI Controls
    useEffect(() => {
        const handleTrigger = (e: CustomEvent) => {
            const { axis, layer, dir } = e.detail
            startAnimation(axis, layer, dir)
        }
        document.addEventListener('cube-rotate', handleTrigger as EventListener)
        return () => document.removeEventListener('cube-rotate', handleTrigger as EventListener)
    }, [isAnimating, cubies])

    return (
        <group ref={groupRef}>
            {/* Pivot Group Helper */}
            <group ref={pivotRef} />

            {/* Active Face Highlight */}
            <ActiveFaceHighlighter />

            {cubies.map((cubie) => (
                <SubCube
                    key={cubie.id}
                    // Do not pass 'id' prop to SubCube if it spreads to <group> which has an internal read-only id
                    // We intentionally DO NOT drive position/rotation fully by store during React updates
                    // if we want to rely on THREE's scene graph persistence for visual smoothness.
                    position={cubie.position}
                    rotation={cubie.rotation as any}
                    basePosition={cubie.basePosition}
                    ref={(el) => {
                        if (el) cubieRefs.current[cubie.id] = el
                    }}
                />
            ))}
        </group>
    )
}
