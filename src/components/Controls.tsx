import { useCubeStore } from '../store/useCubeStore'
import type { Axis, Direction } from '../store/useCubeStore'
import { RefreshCw, Shuffle } from 'lucide-react'

export default function Controls() {
    const { reset, shuffle, isAnimating } = useCubeStore()

    const handleRotate = (axis: Axis, layer: number, dir: Direction) => {
        if (isAnimating) return
        const event = new CustomEvent('cube-rotate', { detail: { axis, layer, dir } })
        document.dispatchEvent(event)
    }

    // Helper for UI buttons
    const RotateButton = ({ label, axis, layer, dir }: { label: string, axis: Axis, layer: number, dir: Direction }) => (
        <button
            onClick={() => handleRotate(axis, layer, dir)}
            disabled={isAnimating}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded flex items-center justify-center transition-colors disabled:opacity-50"
            title={`Rotate ${label}`}
        >
            {label}
        </button>
    )

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            {/* Header */}
            <div className="pointer-events-auto flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">CUBE<span className="text-blue-500">SIM</span></h1>
                    <p className="text-gray-400 text-sm">Interactive 3D Puzzle</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => shuffle()}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Shuffle size={18} /> Shuffle
                    </button>
                    <button
                        onClick={() => reset()}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <RefreshCw size={18} /> Reset
                    </button>
                </div>
            </div>

            {/* Instructions Panel - Fixed Position */}
            <div
                className="pointer-events-auto bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl text-right max-w-xs"
                style={{
                    position: 'fixed',
                    top: '80px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'block'
                }}
            >
                <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center justify-end gap-2">
                    <span>💡 조작 방법</span>
                </h3>
                <ul className="text-xs text-gray-200 space-y-2 font-medium">
                    <li className="flex justify-between items-center gap-2 border-b border-gray-700 pb-1">
                        <span>세로줄</span>
                        <span className="flex gap-1">
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">Q</span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">W</span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">E</span>
                        </span>
                    </li>
                    <li className="flex justify-between items-center gap-2 border-b border-gray-700 pb-1">
                        <span>가로줄</span>
                        <span className="flex gap-1">
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">A</span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">S</span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">D</span>
                        </span>
                    </li>
                    <li className="flex justify-between items-center gap-2 border-b border-gray-700 pb-1">
                        <span>기타</span>
                        <span className="flex gap-1 items-center">
                            <span className="text-[10px] text-gray-400 mr-2">Shuffle</span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white text-[10px]">R</span>
                        </span>
                    </li>
                    <li className="flex justify-end items-center gap-1 text-[10px] text-gray-400">
                        <span>Shift + 키 = 반대 방향</span>
                    </li>
                </ul>
            </div>

            {/* Manual Controls Panel */}
            <div className="pointer-events-auto bg-gray-900/80 backdrop-blur p-4 rounded-xl border border-gray-700 max-w-xs self-end">
                <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Manual Controls</h3>

                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-gray-400 text-xs text-center col-span-3">X-Axis (Right/Left)</div>
                    <RotateButton label="L" axis="x" layer={-1} dir={-1} />
                    <RotateButton label="M" axis="x" layer={0} dir={-1} />
                    <RotateButton label="R" axis="x" layer={1} dir={-1} />
                    <RotateButton label="L'" axis="x" layer={-1} dir={1} />
                    <RotateButton label="M'" axis="x" layer={0} dir={1} />
                    <RotateButton label="R'" axis="x" layer={1} dir={1} />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-gray-400 text-xs text-center col-span-3">Y-Axis (Up/Down)</div>
                    <RotateButton label="U" axis="y" layer={1} dir={-1} />
                    <RotateButton label="E" axis="y" layer={0} dir={-1} />
                    <RotateButton label="D" axis="y" layer={-1} dir={-1} />
                    <RotateButton label="U'" axis="y" layer={1} dir={1} />
                    <RotateButton label="E'" axis="y" layer={0} dir={1} />
                    <RotateButton label="D'" axis="y" layer={-1} dir={1} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-400 text-xs text-center col-span-3">Z-Axis (Front/Back)</div>
                    <RotateButton label="F" axis="z" layer={1} dir={-1} />
                    <RotateButton label="S" axis="z" layer={0} dir={-1} />
                    <RotateButton label="B" axis="z" layer={-1} dir={-1} />
                    <RotateButton label="F'" axis="z" layer={1} dir={1} />
                    <RotateButton label="S'" axis="z" layer={0} dir={1} />
                    <RotateButton label="B'" axis="z" layer={-1} dir={1} />
                </div>

                <div className="mt-4 text-[10px] text-gray-500 text-center">
                    Use visual controls or keyboard (Arrow Keys)
                </div>
            </div>
        </div>
    )
}
