import { MeshObject, Vertex, Vector3D } from '../store/useBlenderStore';

export class GeometryEngine {
  private static generateUUID(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private static calculateNormal(p1: Vector3D, p2: Vector3D, p3: Vector3D): Vector3D {
    const ux = p2.x - p1.x, uy = p2.y - p1.y, uz = p2.z - p1.z;
    const vx = p3.x - p1.x, vy = p3.y - p1.y, vz = p3.z - p1.z;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    return { x: nx / len, y: ny / len, z: nz / len };
  }

  public static generateCube(): MeshObject {
    const vertices: Vertex[] = [
      { id: 0, position: { x: -1, y: -1, z:  1 }, normal: { x: 0, y: 0, z:  1 } },
      { id: 1, position: { x:  1, y: -1, z:  1 }, normal: { x: 0, y: 0, z:  1 } },
      { id: 2, position: { x:  1, y:  1, z:  1 }, normal: { x: 0, y: 0, z:  1 } },
      { id: 3, position: { x: -1, y:  1, z:  1 }, normal: { x: 0, y: 0, z:  1 } },
      { id: 4, position: { x: -1, y: -1, z: -1 }, normal: { x: 0, y: 0, z: -1 } },
      { id: 5, position: { x: -1, y:  1, z: -1 }, normal: { x: 0, y: 0, z: -1 } },
      { id: 6, position: { x:  1, y:  1, z: -1 }, normal: { x: 0, y: 0, z: -1 } },
      { id: 7, position: { x:  1, y: -1, z: -1 }, normal: { x: 0, y: 0, z: -1 } }
    ];

    const indices = [
      0, 1, 2,  0, 2, 3,
      7, 4, 5,  7, 5, 6,
      4, 0, 3,  4, 3, 5,
      1, 7, 6,  1, 6, 2,
      3, 2, 6,  3, 6, 5,
      4, 7, 1,  4, 1, 0
    ];

    return {
      id: this.generateUUID(),
      name: 'Cube',
      type: 'cube',
      vertices,
      indices,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: { preset: 'default', baseColor: [0.8, 0.8, 0.8, 1.0], roughness: 0.5, metallic: 0.0 }
    };
  }

  public static generatePlane(): MeshObject {
    const vertices: Vertex[] = [
      { id: 0, position: { x: -2, y: 0, z:  2 }, normal: { x: 0, y: 1, z: 0 } },
      { id: 1, position: { x:  2, y: 0, z:  2 }, normal: { x: 0, y: 1, z: 0 } },
      { id: 2, position: { x:  2, y: 0, z: -2 }, normal: { x: 0, y: 1, z: 0 } },
      { id: 3, position: { x: -2, y: 0, z: -2 }, normal: { x: 0, y: 1, z: 0 } }
    ];
    const indices = [0, 1, 2, 0, 2, 3];

    return {
      id: this.generateUUID(),
      name: 'Plane',
      type: 'plane',
      vertices,
      indices,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: { preset: 'default', baseColor: [0.6, 0.6, 0.6, 1.0], roughness: 0.6, metallic: 0.0 }
    };
  }

  public static generateSphere(rings = 16, segments = 16): MeshObject {
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    let vertexId = 0;

    for (let r = 0; r <= rings; ++r) {
      const phi = (r * Math.PI) / rings;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      for (let s = 0; s <= segments; ++s) {
        const theta = (s * 2 * Math.PI) / segments;
        const x = Math.cos(theta) * sinPhi;
        const y = cosPhi;
        const z = Math.sin(theta) * sinPhi;

        vertices.push({
          id: vertexId++,
          position: { x, y, z },
          normal: { x, y, z }
        });
      }
    }

    for (let r = 0; r < rings; ++r) {
      for (let s = 0; s < segments; ++s) {
        const first = r * (segments + 1) + s;
        const second = first + segments + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    return {
      id: this.generateUUID(),
      name: 'UV Sphere',
      type: 'sphere',
      vertices,
      indices,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: { preset: 'default', baseColor: [0.8, 0.8, 0.8, 1.0], roughness: 0.4, metallic: 0.0 }
    };
  }

  public static generateCylinder(segments = 16, radius = 1, height = 2): MeshObject {
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    let vertexId = 0;

    const halfH = height / 2;
    for (let i = 0; i <= segments; i++) {
      const theta = (i * 2 * Math.PI) / segments;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      vertices.push({ id: vertexId++, position: { x, y: halfH, z }, normal: { x: Math.cos(theta), y: 0, z: Math.sin(theta) } });
      vertices.push({ id: vertexId++, position: { x, y: -halfH, z }, normal: { x: Math.cos(theta), y: 0, z: Math.sin(theta) } });
    }

    for (let i = 0; i < segments; i++) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }

    return {
      id: this.generateUUID(),
      name: 'Cylinder',
      type: 'cylinder',
      vertices,
      indices,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: { preset: 'default', baseColor: [0.8, 0.8, 0.8, 1.0], roughness: 0.5, metallic: 0.0 }
    };
  }

  public static generateTorus(radialSegments = 16, tubularSegments = 16, radius = 1, tubeRadius = 0.4): MeshObject {
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    let vertexId = 0;

    for (let j = 0; j <= radialSegments; j++) {
      const u = (j * 2 * Math.PI) / radialSegments;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      for (let i = 0; i <= tubularSegments; i++) {
        const v = (i * 2 * Math.PI) / tubularSegments;
        const cosV = Math.cos(v);
        const sinV = Math.sin(v);

        const x = (radius + tubeRadius * cosV) * cosU;
        const y = (radius + tubeRadius * cosV) * sinU;
        const z = tubeRadius * sinV;

        const nx = cosV * cosU;
        const ny = cosV * sinU;
        const nz = sinV;

        vertices.push({ id: vertexId++, position: { x, y, z }, normal: { x: nx, y: ny, z: nz } });
      }
    }

    for (let j = 0; j < radialSegments; j++) {
      for (let i = 0; i < tubularSegments; i++) {
        const a = j * (tubularSegments + 1) + i;
        const b = j * (tubularSegments + 1) + i + 1;
        const c = (j + 1) * (tubularSegments + 1) + i;
        const d = (j + 1) * (tubularSegments + 1) + i + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    return {
      id: this.generateUUID(),
      name: 'Torus',
      type: 'torus',
      vertices,
      indices,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: { preset: 'default', baseColor: [0.8, 0.8, 0.8, 1.0], roughness: 0.5, metallic: 0.0 }
    };
  }

  public static executeExtrude(mesh: MeshObject, faceIndices: number[], factor: number): MeshObject {
    const newVertices = [...mesh.vertices];
    const newIndices = [...mesh.indices];
    
    faceIndices.forEach((idx) => {
      if (!newVertices[idx]) return;
      const v = newVertices[idx];
      const nextId = newVertices.length;
      newVertices.push({
        id: nextId,
        position: {
          x: v.position.x + v.normal.x * factor,
          y: v.position.y + v.normal.y * factor,
          z: v.position.z + v.normal.z * factor
        },
        normal: { ...v.normal }
      });
    });

    return { ...mesh, vertices: newVertices, indices: newIndices };
  }
}
