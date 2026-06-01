import React from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import { GeometryEngine } from '../core/GeometryEngine';
import { WorkspaceLayout } from './WorkspaceLayout';
import { WorkspaceSculpt } from './WorkspaceSculpt';
import { WorkspaceShading } from './WorkspaceShading';
import { WorkspaceAnimation } from './WorkspaceAnimation';
import { ViewportCanvas } from './ViewportCanvas';
import { BottomNavBar } from './BottomNavBar';

export const AppContainer: React.FC = () => {
  const currentTab = useBlenderStore((state) => state.currentTab);
  const meshes = useBlenderStore((state) => state.meshes);
  const selectedObjectId = useBlenderStore((state) => state.selectedObjectId);
  const selectObject = useBlenderStore((state) => state.selectObject);
  const addMesh = useBlenderStore((state) => state.addMesh);

  const addPrimitive = (type: string) => {
    let primitive;
    switch (type) {
      case 'sphere':
        primitive = GeometryEngine.generateSphere(20, 20);
        break;
      case 'cylinder':
        primitive = GeometryEngine.generateCylinder(20, 0.8, 2);
        break;
      case 'torus':
        primitive = GeometryEngine.generateTorus(20, 16, 1.2, 0.35);
        break;
      case 'plane':
        primitive = GeometryEngine.generatePlane();
        break;
      default:
        primitive = GeometryEngine.generateCube();
    }
    addMesh(primitive);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#111111] via-[#161616] to-[#1f1f1f]">
      <ViewportCanvas />

      <div className="pointer-events-auto absolute top-4 left-4 z-40 w-[min(320px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#181818]/90 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300">Scene</p>
            <h2 className="mt-1 text-sm font-semibold text-white">Blender Web Studio</h2>
          </div>
          <div className="rounded-2xl bg-[#111111] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            {meshes.length} objects
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-3xl border border-white/10 bg-[#111111]/80 p-3">
          {meshes.map((mesh) => (
            <button
              key={mesh.id}
              onClick={() => selectObject(mesh.id)}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition ${
                selectedObjectId === mesh.id ? 'bg-amber-500/15 text-white shadow-inner' : 'bg-[#141414] text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="truncate">{mesh.name}</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{mesh.type}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {['cube', 'sphere', 'cylinder', 'torus', 'plane'].map((type) => (
            <button
              key={type}
              onClick={() => addPrimitive(type)}
              className="rounded-2xl border border-white/10 bg-[#141414] px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-200 transition hover:border-amber-500 hover:text-amber-200"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {currentTab === 'layout' && <WorkspaceLayout />}
      {currentTab === 'sculpt' && <WorkspaceSculpt />}
      {currentTab === 'shading' && <WorkspaceShading />}
      {currentTab === 'animation' && <WorkspaceAnimation />}

      <BottomNavBar />
    </div>
  );
};
