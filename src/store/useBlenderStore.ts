import { create } from 'zustand';
import { GeometryEngine } from '../core/GeometryEngine';

export type WorkspaceTab = 'layout' | 'sculpt' | 'shading' | 'animation';
export type TransformMode =
  | 'select'
  | 'translate'
  | 'rotate'
  | 'scale'
  | 'extrude'
  | 'bevel'
  | 'loopcut'
  | 'inset'
  | 'sine';
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

interface MeshTransformDelta {
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
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
  setMaterialProperties: (objectId: string | null, values: Partial<Pick<MeshObject['material'], 'baseColor' | 'roughness' | 'metallic'>>) => void;
  setShadingPreset: (preset: ShadingPreset) => void;
  setAnimationMode: (mode: AnimationMode) => void;
  setCurrentFrame: (frame: number) => void;
  setTotalFrames: (frames: number) => void;
  setIsPlaying: (playing: boolean) => void;

  addMesh: (mesh: MeshObject) => void;
  updateMeshGeometry: (id: string, vertices: Vertex[], indices: number[]) => void;
  updateMeshTransform: (id: string, delta: MeshTransformDelta) => void;
  applySineDeform: (id: string, amplitude: number, frequency: number) => void;
  applySculptBrush: (brush: SculptBrush, radius: number, strength: number) => void;
  advanceFrame: () => void;
  selectObject: (id: string | null) => void;
  cycleSelection: () => void;
  setSelectedVertices: (ids: number[]) => void;
  addBone: (bone: Bone) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const defaultMeshes = [GeometryEngine.generateCube(), GeometryEngine.generatePlane()];
const defaultSelectionId = defaultMeshes[0].id;

const presetMaterials: Record<ShadingPreset, { baseColor: [number, number, number, number]; roughness: number; metallic: number }> = {
  default: { baseColor: [0.72, 0.72, 0.72, 1.0], roughness: 0.5, metallic: 0.0 },
  glass: { baseColor: [0.62, 0.82, 0.96, 0.45], roughness: 0.08, metallic: 0.0 },
  rubber: { baseColor: [0.12, 0.12, 0.12, 1.0], roughness: 0.84, metallic: 0.0 },
  gold: { baseColor: [1.0, 0.78, 0.21, 1.0], roughness: 0.18, metallic: 1.0 },
  carpaint: { baseColor: [0.86, 0.16, 0.14, 1.0], roughness: 0.22, metallic: 0.72 },
};

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
  
  meshes: defaultMeshes,
  selectedObjectId: defaultSelectionId,
  selectedVertexIds: [],
  bones: [],
  
  history: [{ meshes: JSON.parse(JSON.stringify(defaultMeshes)) }],
  historyIndex: 0,

  setTab: (tab) => set({ currentTab: tab }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setSculptBrush: (brush) => set({ sculptBrush: brush }),
  setBrushRadius: (radius) => set({ brushRadius: radius }),
  setBrushStrength: (strength) => set({ brushStrength: strength }),
  setMaterialProperties: (objectId, values) => set((state) => {
    const targetId = objectId ?? state.selectedObjectId;
    if (!targetId) return {};
    const newMeshes = state.meshes.map((mesh) => {
      if (mesh.id !== targetId) return mesh;
      return {
        ...mesh,
        material: {
          ...mesh.material,
          ...values,
        },
      };
    });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      meshes: newMeshes,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length,
    };
  }),
  setShadingPreset: (preset) => set((state) => {
    const materialOverride = presetMaterials[preset];
    const newMeshes = state.meshes.map((mesh) => {
      if (mesh.id !== state.selectedObjectId) return mesh;
      return {
        ...mesh,
        material: {
          ...mesh.material,
          preset,
          ...materialOverride,
        },
      };
    });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      shadingPreset: preset,
      meshes: newMeshes,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length,
    };
  }),
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

  updateMeshTransform: (id, delta) => set((state) => {
    const newMeshes = state.meshes.map((mesh) => {
      if (mesh.id !== id) return mesh;
      return {
        ...mesh,
        position: {
          x: delta.position?.x ?? mesh.position.x,
          y: delta.position?.y ?? mesh.position.y,
          z: delta.position?.z ?? mesh.position.z,
        },
        rotation: {
          x: delta.rotation?.x ?? mesh.rotation.x,
          y: delta.rotation?.y ?? mesh.rotation.y,
          z: delta.rotation?.z ?? mesh.rotation.z,
        },
        scale: {
          x: delta.scale?.x ?? mesh.scale.x,
          y: delta.scale?.y ?? mesh.scale.y,
          z: delta.scale?.z ?? mesh.scale.z,
        },
      };
    });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      meshes: newMeshes,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length
    };
  }),

  applySineDeform: (id, amplitude, frequency) => set((state) => {
    const newMeshes = state.meshes.map((mesh) => {
      if (mesh.id !== id) return mesh;
      const newVertices = mesh.vertices.map((vertex) => {
        const sineOffset = Math.sin(vertex.position.x * frequency + vertex.position.z * frequency) * amplitude;
        return {
          ...vertex,
          position: {
            x: vertex.position.x,
            y: vertex.position.y + sineOffset,
            z: vertex.position.z,
          },
        };
      });
      return { ...mesh, vertices: newVertices };
    });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      meshes: newMeshes,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length,
    };
  }),
  applySculptBrush: (brush, radius, strength) => set((state) => {
    if (!state.selectedObjectId) return {};
    const selectedMesh = state.meshes.find((mesh) => mesh.id === state.selectedObjectId);
    if (!selectedMesh) return {};

    const averageY = selectedMesh.vertices.reduce((sum, vertex) => sum + vertex.position.y, 0) / Math.max(selectedMesh.vertices.length, 1);
    const newVertices = selectedMesh.vertices.map((vertex) => {
      let deltaY = 0;
      let deltaX = 0;

      switch (brush) {
        case 'draw':
        case 'clay':
          deltaY = strength * 0.15;
          break;
        case 'crease':
          deltaY = (vertex.position.y - averageY) * strength * 0.12;
          break;
        case 'grab':
          deltaX = strength * 0.1;
          break;
        case 'smooth':
          deltaY = (averageY - vertex.position.y) * strength * 0.35;
          break;
        case 'flatten':
          deltaY = (averageY - vertex.position.y) * strength * 0.6;
          break;
        default:
          break;
      }

      return {
        ...vertex,
        position: {
          x: vertex.position.x + deltaX,
          y: vertex.position.y + deltaY,
          z: vertex.position.z,
        },
      };
    });

    const newMeshes = state.meshes.map((mesh) =>
      mesh.id === state.selectedObjectId ? { ...mesh, vertices: newVertices } : mesh
    );
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      meshes: newMeshes,
      history: [...newHistory, { meshes: JSON.parse(JSON.stringify(newMeshes)) }],
      historyIndex: newHistory.length,
    };
  }),
  advanceFrame: () => set((state) => {
    const nextFrame = state.currentFrame >= state.totalFrames ? 1 : state.currentFrame + 1;
    const newMeshes = state.meshes.map((mesh) => ({
      ...mesh,
      rotation: {
        x: mesh.rotation.x,
        y: mesh.rotation.y + 0.012,
        z: mesh.rotation.z,
      },
    }));

    return {
      currentFrame: nextFrame,
      meshes: newMeshes,
    };
  }),

  selectObject: (id) => set({ selectedObjectId: id, selectedVertexIds: [] }),

  cycleSelection: () => set((state) => {
    if (state.meshes.length <= 1) return {};
    const currentIndex = state.meshes.findIndex((mesh) => mesh.id === state.selectedObjectId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.meshes.length;
    return { selectedObjectId: state.meshes[nextIndex].id };
  }),

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
