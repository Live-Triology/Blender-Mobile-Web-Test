import React, { useMemo, useState } from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import type { TransformMode } from '../store/useBlenderStore';

const toolSettings: Record<TransformMode, { label: string; min: number; max: number; step: number }> = {
  select: { label: 'Select', min: 0, max: 0, step: 1 },
  translate: { label: 'Translate X', min: -5, max: 5, step: 0.05 },
  rotate: { label: 'Rotate Y', min: -Math.PI, max: Math.PI, step: 0.01 },
  scale: { label: 'Uniform Scale', min: 0.2, max: 3, step: 0.01 },
  extrude: { label: 'Extrude Offset', min: 0, max: 2, step: 0.05 },
  bevel: { label: 'Bevel Radius', min: 0, max: 1, step: 0.02 },
  loopcut: { label: 'Loop Cut Strength', min: 0, max: 1, step: 0.02 },
  inset: { label: 'Inset Amount', min: 0, max: 1, step: 0.02 },
  sine: { label: 'Sine Amplitude', min: 0.05, max: 2, step: 0.01 }
};

export const WorkspaceLayout: React.FC = () => {
  const transformMode = useBlenderStore((state) => state.transformMode);
  const selectedObjectId = useBlenderStore((state) => state.selectedObjectId);
  const selectedObjectName = useBlenderStore((state) => state.meshes.find((m) => m.id === state.selectedObjectId)?.name ?? 'None');
  const objectCount = useBlenderStore((state) => state.meshes.length);
  const setTransformMode = useBlenderStore((state) => state.setTransformMode);
  const updateMeshTransform = useBlenderStore((state) => state.updateMeshTransform);
  const applySineDeform = useBlenderStore((state) => state.applySineDeform);
  const pushHistory = useBlenderStore((state) => state.pushHistory);
  const undo = useBlenderStore((state) => state.undo);
  const redo = useBlenderStore((state) => state.redo);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [numericValue, setNumericValue] = useState(1.0);

  const tools: { id: TransformMode; label: string; icon: string }[] = [
    { id: 'select', label: 'Select', icon: '⬈' },
    { id: 'translate', label: 'Move', icon: '✛' },
    { id: 'rotate', label: 'Rotate', icon: '⟳' },
    { id: 'scale', label: 'Scale', icon: '⤗' },
    { id: 'extrude', label: 'Extrude', icon: '⇪' },
    { id: 'bevel', label: 'Bevel', icon: '⬘' },
    { id: 'loopcut', label: 'LoopCut', icon: '⊞' },
    { id: 'inset', label: 'Inset', icon: '回' },
    { id: 'sine', label: 'Sine', icon: '∿' }
  ];

  const currentTool = toolSettings[transformMode];

  const handleToolTap = (mode: TransformMode) => {
    setTransformMode(mode);
    setShowBottomSheet(mode !== 'select');
    setNumericValue(mode === 'scale' ? 1 : 0.5);
  };

  const handleConfirm = () => {
    if (!selectedObjectId) return;

    if (transformMode === 'sine') {
      applySineDeform(selectedObjectId, numericValue, 3.0);
    } else {
      const mesh = useBlenderStore.getState().meshes.find((item) => item.id === selectedObjectId);
      if (!mesh) return;

      switch (transformMode) {
        case 'translate':
          updateMeshTransform(selectedObjectId, {
            position: { x: mesh.position.x + numericValue, y: mesh.position.y, z: mesh.position.z }
          });
          break;
        case 'rotate':
          updateMeshTransform(selectedObjectId, {
            rotation: { x: mesh.rotation.x, y: mesh.rotation.y + numericValue, z: mesh.rotation.z }
          });
          break;
        case 'scale':
          updateMeshTransform(selectedObjectId, {
            scale: {
              x: Math.max(0.1, mesh.scale.x * numericValue),
              y: Math.max(0.1, mesh.scale.y * numericValue),
              z: Math.max(0.1, mesh.scale.z * numericValue)
            }
          });
          break;
        case 'extrude':
          updateMeshTransform(selectedObjectId, {
            position: { x: mesh.position.x, y: mesh.position.y + numericValue * 0.2, z: mesh.position.z }
          });
          break;
        case 'bevel':
        case 'inset':
        case 'loopcut':
          updateMeshTransform(selectedObjectId, {
            scale: {
              x: mesh.scale.x * (1 + numericValue * 0.08),
              y: mesh.scale.y * (1 + numericValue * 0.08),
              z: mesh.scale.z * (1 + numericValue * 0.08)
            }
          });
          break;
        default:
          break;
      }
    }

    pushHistory();
    setShowBottomSheet(false);
  };

  const selectedStatus = useMemo(() => {
    return selectedObjectId ? `Selected: ${selectedObjectName}` : 'Nothing selected';
  }, [selectedObjectId, selectedObjectName]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      <div className="space-y-3 pointer-events-auto max-w-md">
        <div className="rounded-3xl border border-[#1D1D1D] bg-[#181818]/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500">Workspace</p>
              <h1 className="text-sm font-semibold text-white">Layout & Transform</h1>
              <p className="text-[11px] text-gray-400">{selectedStatus}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-[#111111] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                {objectCount} objects
              </div>
              <button
                onClick={undo}
                className="rounded-2xl bg-[#111111] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-300 transition hover:bg-[#1d1d1d]"
              >
                Undo
              </button>
              <button
                onClick={redo}
                className="rounded-2xl bg-[#111111] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-300 transition hover:bg-[#1d1d1d]"
              >
                Redo
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-3xl border border-[#1D1D1D] bg-[#181818]/90 p-3 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolTap(tool.id)}
                className={`rounded-2xl border px-2 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                  transformMode === tool.id
                    ? 'border-amber-500 bg-amber-400/20 text-amber-200'
                    : 'border-[#252525] bg-[#101010] text-gray-300 hover:border-[#E58E35]/70 hover:text-amber-200'
                }`}
              >
                <span className="block text-lg">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showBottomSheet && (
        <div className="w-full bg-[#181818]/95 border border-[#1D1D1D] rounded-3xl p-5 pointer-events-auto shadow-2xl backdrop-blur-xl max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#232323]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Operation</p>
              <h2 className="text-sm font-semibold text-white">{currentTool.label}</h2>
            </div>
            <button onClick={() => setShowBottomSheet(false)} className="text-gray-400 text-sm font-bold px-2">✕</button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{currentTool.label}</span>
              <span className="text-white font-mono">{numericValue.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={currentTool.min}
              max={currentTool.max}
              step={currentTool.step}
              value={numericValue}
              onChange={(e) => setNumericValue(parseFloat(e.target.value))}
              className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
            />
          </div>

          <button
            onClick={handleConfirm}
            className="mt-4 w-full h-11 rounded-2xl bg-[#E58E35] text-black font-bold uppercase tracking-[0.16em] shadow-lg transition-colors hover:bg-[#ffb46b]"
          >
            Confirm Operation
          </button>
        </div>
      )}
    </div>
  );
};
