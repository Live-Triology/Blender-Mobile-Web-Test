import { create } from 'zustand';

export type WorkspaceTab = 'layout' | 'sculpt' | 'shading' | 'animation';
export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale' | 'extrude' | 'bevel' | 'loopcut' | 'inset';
export type SculptBrush = 'clay' | 'crease' | 'grab' | 'smooth' | 'flatten' | 'draw';
export type ShadingPreset = 'glass' | 'rubber' | 'gold' | 'carpaint' | 'default';
export type AnimationMode = 'edit_bone' | 'weight_paint';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vertex {
  id: number;
  position: Vector3D;
  normal: Vector3D;
  color?: [number, number, number, number];
}

export interface MeshObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'plane' | 'custom';
  vertices: Vertex[];
  indices: number[];
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  material: {
    preset: ShadingPreset;
    baseColor: [number, number, number, number];
    roughness: number;
    metallic: number;
  };
}

export interface Bone {
  id: string;
  name: string;
  parent: string | null;
  head: Vector3D;
  tail: Vector3D;
}

export interface HistoryState {
  meshes: MeshObject[];
}

interface BlenderState {
  currentTab: WorkspaceTab;
  transformMode: TransformMode;
  sculptBrush: SculptBrush;
  brushRadius: number;
  brushStrength: number;
  shadingPreset: ShadingPreset;
  animationMode: AnimationMode;
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;

  meshes: MeshObject[];
  selectedObjectId: string | null;
  selectedVertexIds: number[];
  bones: Bone[];

  history: HistoryState[];
  historyIndex: number;

  setTab: (tab: WorkspaceTab) => void;
  setTransformMode: (mode: TransformMode) => void;
  setSculptBrush: (brush: SculptBrush) => void;
  setBrushRadius: (radius: number) => void;
  setBrushStrength: (strength: number) => void;
  setShadingPreset: (preset: ShadingPreset) => void;
  setAnimationMode: (mode: AnimationMode) => void;
  setCurrentFrame: (frame: number) => void;
  setTotalFrames: (frames: number) => void;
  setIsPlaying: (playing: boolean) => void;

  addMesh: (mesh: MeshObject) => void;
  updateMeshGeometry: (id: string, vertices: Vertex[], indices: number[]) => void;
  selectObject: (id: string | null) => void;
  setSelectedVertices: (ids: number[]) => void;
  addBone: (bone: Bone) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useBlenderStore = create<BlenderState>((set, get) => ({
  currentTab: 'layout',
  transformMode: 'select',
  sculptBrush: 'draw',
  brushRadius: 40,
  brushStrength: 0.5,
  shadingPreset: 'default',
  animationMode: 'edit_bone',
  currentFrame: 1,
  totalFrames: 250,
  isPlaying: false,
  
  meshes: [],
  selectedObjectId: null,
  selectedVertexIds: [],
  bones: [],
  
  history: [],
  historyIndex: -1,

  setTab: (tab) => set({ currentTab: tab }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setSculptBrush: (brush) => set({ sculptBrush: brush }),
  setBrushRadius: (radius) => set({ brushRadius: radius }),
  setBrushStrength: (strength) => set({ brushStrength: strength }),
  setShadingPreset: (preset) => set({ shadingPreset: preset }),
  setAnimationMode: (mode) => set({ animationMode: mode }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setTotalFrames: (frames) => set({ totalFrames: frames }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  addMesh: (mesh) => set((state) => {
    const newMeshes = [...state.meshes, mesh];
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      meshes: newMeshes,
      selectedObjectId: mesh.id,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length
    };
  }),

  updateMeshGeometry: (id, vertices, indices) => set((state) => {
    const newMeshes = state.meshes.map(m => m.id === id ? { ...m, vertices, indices } : m);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      meshes: newMeshes,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length
    };
  }),

  selectObject: (id) => set({ selectedObjectId: id, selectedVertexIds: [] }),
  setSelectedVertices: (ids) => set({ selectedVertexIds: ids }),
  addBone: (bone) => set((state) => ({ bones: [...state.bones, bone] })),

  pushHistory: () => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(state.meshes)) }],
      historyIndex: newHistory.length
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return {};
    const prevIndex = state.historyIndex - 1;
    return {
      historyIndex: prevIndex,
      meshes: JSON.parse(JSON.stringify(state.history[prevIndex].meshes))
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return {};
    const nextIndex = state.historyIndex + 1;
    return {
      historyIndex: nextIndex,
      meshes: JSON.parse(JSON.stringify(state.history[nextIndex].meshes))
    };
  })
}));
