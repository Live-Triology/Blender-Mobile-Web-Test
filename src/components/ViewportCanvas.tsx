import React, { useEffect, useRef } from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import { useTouchGestureProcessor } from '../hooks/useTouchGestureProcessor';
import { WebEngine } from '../core/WebEngine';
import { IOEngine } from '../core/IOEngine';

export const ViewportCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<WebEngine | null>(null);
  const selectedObjectId = useBlenderStore((state) => state.selectedObjectId);
  const cycleSelection = useBlenderStore((state) => state.cycleSelection);
  const addMesh = useBlenderStore((state) => state.addMesh);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new WebEngine(canvasRef.current);
    engineRef.current = engine;

    engine.init().then(() => {
      const handleResize = () => {
        if (!canvasRef.current || !engineRef.current) return;
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          engineRef.current.resize(rect.width, rect.height);
        }
      };

      const preventContextMenu = (event: MouseEvent) => {
        event.preventDefault();
      };

      if (canvasRef.current) {
        canvasRef.current.style.touchAction = 'none';
        canvasRef.current.addEventListener('contextmenu', preventContextMenu);
      }

      window.addEventListener('resize', handleResize);
      handleResize();

      const handleCanvasClick = () => {
        cycleSelection();
      };

      canvasRef.current?.addEventListener('click', handleCanvasClick);

      let animationFrameId: number;
      const renderLoop = () => {
        const currentMeshes = useBlenderStore.getState().meshes;
        engineRef.current?.render(currentMeshes, selectedObjectId);
        animationFrameId = requestAnimationFrame(renderLoop);
      };
      renderLoop();

      return () => {
        window.removeEventListener('resize', handleResize);
        canvasRef.current?.removeEventListener('click', handleCanvasClick);
        canvasRef.current?.removeEventListener('contextmenu', preventContextMenu);
        cancelAnimationFrame(animationFrameId);
      };
    });
  }, [selectedObjectId, cycleSelection]);

  const cameraMatrices = {
    orbit: (dx: number, dy: number) => engineRef.current?.orbit(dx, dy),
    zoom: (factor: number) => engineRef.current?.zoom(factor),
    pan: (dx: number, dy: number) => engineRef.current?.pan(dx, dy),
    raycastSelect: (x: number, y: number) => engineRef.current?.raycastSelect(x, y),
  };

  useTouchGestureProcessor(canvasRef, cameraMatrices);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.obj')) {
      const text = await file.text();
      const parsed = IOEngine.parseOBJ(text);
      addMesh({
        ...parsed,
        id: Math.random().toString(36).substring(2, 15),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: { preset: 'default', baseColor: [0.8, 0.8, 0.8, 1.0], roughness: 0.5, metallic: 0.0 }
      });
    } else if (file.name.endsWith('.gltf')) {
      const parsed = await IOEngine.parseGLTF(file);
      addMesh({
        ...parsed,
        id: Math.random().toString(36).substring(2, 15),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: { preset: 'default', baseColor: [0.8, 0.8, 0.8, 1.0], roughness: 0.5, metallic: 0.0 }
      });
    }
  };

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block bg-[#1D1D1D]" />

      <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 flex w-[280px] -translate-x-1/2 flex-col items-center gap-2 rounded-3xl border border-white/10 bg-black/45 px-4 py-3 text-center text-[10px] uppercase tracking-[0.25em] text-white/90 shadow-2xl backdrop-blur-2xl md:hidden">
        <span className="font-semibold text-white">Mobile Controls</span>
        <span>Drag to orbit · Pinch to zoom · Double-tap to select</span>
      </div>

      <div className="absolute top-4 left-4 pointer-events-auto">
        <label className="flex items-center justify-center h-12 px-4 bg-[#303030] active:bg-[#E58E35] border border-[#1D1D1D] rounded-lg text-xs font-bold uppercase tracking-wider shadow-xl cursor-pointer">
          <span>Import Asset</span>
          <input type="file" accept=".obj,.gltf" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
};
