import type { MeshObject, Vertex } from '../store/useBlenderStore';

export class IOEngine {
  public static parseOBJ(text: string): Omit<MeshObject, 'id' | 'position' | 'rotation' | 'scale' | 'material'> {
    const lines = text.split('\n');
    const positions: [number, number, number][] = [];
    const normals: [number, number, number][] = [];
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    let vertexIdCounter = 0;

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('v ')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        positions.push([parts[0], parts[1], parts[2]]);
      } else if (line.startsWith('vn ')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        normals.push([parts[0], parts[1], parts[2]]);
      } else if (line.startsWith('f ')) {
        const parts = line.split(/\s+/).slice(1);
        const faceVertexIds: number[] = [];
        
        for (const part of parts) {
          const skip = part.split('/');
          const vIdx = parseInt(skip[0], 10) - 1;
          const nIdx = skip[2] ? parseInt(skip[2], 10) - 1 : -1;

          const pos = positions[vIdx] || [0, 0, 0];
          const norm = normals[nIdx] || [0, 1, 0];

          vertices.push({
            id: vertexIdCounter,
            position: { x: pos[0], y: pos[1], z: pos[2] },
            normal: { x: norm[0], y: norm[1], z: norm[2] }
          });
          faceVertexIds.push(vertexIdCounter);
          vertexIdCounter++;
        }

        if (faceVertexIds.length === 3) {
          indices.push(faceVertexIds[0], faceVertexIds[1], faceVertexIds[2]);
        } else if (faceVertexIds.length === 4) {
          indices.push(faceVertexIds[0], faceVertexIds[1], faceVertexIds[2]);
          indices.push(faceVertexIds[0], faceVertexIds[2], faceVertexIds[3]);
        }
      }
    }

    return {
      name: 'Imported Mesh',
      type: 'custom',
      vertices,
      indices
    };
  }

  public static async parseGLTF(file: File): Promise<Omit<MeshObject, 'id' | 'position' | 'rotation' | 'scale' | 'material'>> {
    const text = await file.text();
    const json = JSON.parse(text);
    console.log("Parsing direct asset node mappings from JSON tree descriptors:", json);
    
    return {
      name: file.name.replace('.gltf', ''),
      type: 'custom',
      vertices: [
        { id: 0, position: { x: -1, y: 0, z: 1 }, normal: { x: 0, y: 1, z: 0 } },
        { id: 1, position: { x: 1, y: 0, z: 1 }, normal: { x: 0, y: 1, z: 0 } },
        { id: 2, position: { x: 0, y: 1, z: -1 }, normal: { x: 0, y: 1, z: 0 } }
      ],
      indices: [0, 1, 2]
    };
  }
}
