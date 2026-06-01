import type { MeshObject } from '../store/useBlenderStore';

interface MeshRenderData {
  vao: WebGLVertexArrayObject | null;
  positionBuffer: WebGLBuffer | null;
  normalBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;
  indexCount: number;
}

const vertexShaderSource = `#version 300 es
in vec3 a_position;
in vec3 a_normal;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
out vec3 v_normal;
out vec3 v_worldPosition;
void main() {
  vec4 worldPosition = u_model * vec4(a_position, 1.0);
  v_worldPosition = worldPosition.xyz;
  v_normal = mat3(u_model) * a_normal;
  gl_Position = u_projection * u_view * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec3 v_normal;
in vec3 v_worldPosition;
uniform vec4 u_baseColor;
uniform vec3 u_lightDirection;
uniform vec3 u_cameraPosition;
out vec4 outColor;
void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDirection);
  float diffuse = max(dot(normal, lightDir), 0.1);
  vec3 viewDir = normalize(u_cameraPosition - v_worldPosition);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 24.0);
  vec3 color = u_baseColor.rgb * diffuse + vec3(spec * 0.22);
  outColor = vec4(color, u_baseColor.a);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create program');
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function multiplyMatrices(a: number[], b: number[]): number[] {
  const result = new Array(16).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      for (let i = 0; i < 4; i++) {
        result[row * 4 + col] += a[row * 4 + i] * b[i * 4 + col];
      }
    }
  }
  return result;
}

function translationMatrix(tx: number, ty: number, tz: number): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
}

function scaleMatrix(sx: number, sy: number, sz: number): number[] {
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
}

function rotationXMatrix(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

function rotationYMatrix(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

function rotationZMatrix(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function perspectiveMatrix(fov: number, aspect: number, near: number, far: number): number[] {
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

function normalizeVector(vec: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z) || 1;
  return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
}

function lookAtMatrix(eye: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, up: { x: number; y: number; z: number }): number[] {
  const zAxis = normalizeVector({ x: eye.x - target.x, y: eye.y - target.y, z: eye.z - target.z });
  const xAxis = normalizeVector({
    x: up.y * zAxis.z - up.z * zAxis.y,
    y: up.z * zAxis.x - up.x * zAxis.z,
    z: up.x * zAxis.y - up.y * zAxis.x,
  });
  const yAxis = {
    x: zAxis.y * xAxis.z - zAxis.z * xAxis.y,
    y: zAxis.z * xAxis.x - zAxis.x * xAxis.z,
    z: zAxis.x * xAxis.y - zAxis.y * xAxis.x,
  };

  return [
    xAxis.x, yAxis.x, zAxis.x, 0,
    xAxis.y, yAxis.y, zAxis.y, 0,
    xAxis.z, yAxis.z, zAxis.z, 0,
    -(xAxis.x * eye.x + xAxis.y * eye.y + xAxis.z * eye.z),
    -(yAxis.x * eye.x + yAxis.y * eye.y + yAxis.z * eye.z),
    -(zAxis.x * eye.x + zAxis.y * eye.y + zAxis.z * eye.z),
    1,
  ];
}

export class WebEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private isWebGPU = false;

  private program: WebGLProgram | null = null;
  private meshCache = new Map<string, MeshRenderData>();

  private cameraPosition = { x: 0, y: 3, z: 6 };
  private targetPosition = { x: 0, y: 0, z: 0 };
  private upVector = { x: 0, y: 1, z: 0 };
  private orbitX = 0.78;
  private orbitY = 0.52;
  private radius = 7.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public async init(): Promise<void> {
    if ('gpu' in navigator) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          this.device = await adapter.requestDevice();
          this.context = this.canvas.getContext('webgpu');
          if (this.context) {
            this.isWebGPU = true;
            this.initWebGPUPipeline();
            return;
          }
        }
      } catch (error) {
        console.warn('WebGPU initialization failed, falling back to WebGL2.', error);
      }
    }

    this.initWebGL2();
  }

  private initWebGPUPipeline(): void {
    if (!this.context || !this.device) return;
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'opaque',
    });
    this.updateCameraMatrices();
  }

  private initWebGL2(): void {
    this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!this.gl) {
      throw new Error('Neither WebGPU nor WebGL2 could be initialized on this hardware vendor.');
    }

    const gl = this.gl;
    gl.clearColor(0.13, 0.13, 0.13, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    this.updateCameraMatrices();
  }

  public orbit(dx: number, dy: number): void {
    this.orbitX += dx;
    this.orbitY = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.orbitY + dy));
    this.updateCameraMatrices();
  }

  public zoom(factor: number): void {
    this.radius = Math.max(1.5, Math.min(50.0, this.radius / factor));
    this.updateCameraMatrices();
  }

  public pan(dx: number, dy: number): void {
    const lookAtX = this.targetPosition.x - this.cameraPosition.x;
    const lookAtZ = this.targetPosition.z - this.cameraPosition.z;
    const length = Math.sqrt(lookAtX * lookAtX + lookAtZ * lookAtZ) || 1;
    const rightX = -lookAtZ / length;
    const rightZ = lookAtX / length;

    this.targetPosition.x += rightX * dx;
    this.targetPosition.z += rightZ * dx;
    this.targetPosition.y += dy;
    this.updateCameraMatrices();
  }

  public raycastSelect(x: number, y: number): void {
    console.log(`Raycast select at ${x}, ${y} - selection is handled by the app state.`);
  }

  private updateCameraMatrices(): void {
    this.cameraPosition.x = this.targetPosition.x + this.radius * Math.sin(this.orbitX) * Math.cos(this.orbitY);
    this.cameraPosition.z = this.targetPosition.z + this.radius * Math.cos(this.orbitX) * Math.cos(this.orbitY);
    this.cameraPosition.y = this.targetPosition.y + this.radius * Math.sin(this.orbitY);
  }

  public render(meshes: MeshObject[], selectedId: string | null): void {
    if (this.isWebGPU) {
      this.renderWebGPU(meshes);
    } else {
      this.renderWebGL2(meshes, selectedId);
    }
  }

  private renderWebGPU(meshes: MeshObject[]): void {
    if (!this.device || !this.context) return;
    // WebGPU support is not yet implemented for the preview renderer.
  }

  private ensureMeshData(mesh: MeshObject): MeshRenderData {
    const gl = this.gl;
    if (!gl) throw new Error('WebGL2 is not initialized.');

    let cache = this.meshCache.get(mesh.id);
    const positions = new Float32Array(mesh.vertices.flatMap((vertex) => [vertex.position.x, vertex.position.y, vertex.position.z]));
    const normals = new Float32Array(mesh.vertices.flatMap((vertex) => [vertex.normal.x, vertex.normal.y, vertex.normal.z]));
    const indices = new Uint32Array(mesh.indices);

    if (!cache) {
      const vao = gl.createVertexArray();
      const positionBuffer = gl.createBuffer();
      const normalBuffer = gl.createBuffer();
      const indexBuffer = gl.createBuffer();

      cache = {
        vao,
        positionBuffer,
        normalBuffer,
        indexBuffer,
        indexCount: mesh.indices.length
      };
      this.meshCache.set(mesh.id, cache);
    }

    if (!cache.vao || !cache.positionBuffer || !cache.normalBuffer || !cache.indexBuffer) {
      throw new Error('Unable to create WebGL buffers.');
    }

    gl.bindVertexArray(cache.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cache.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    cache.indexCount = indices.length;
    gl.bindVertexArray(null);

    return cache;
  }

  private composeModelMatrix(mesh: MeshObject): number[] {
    const translation = translationMatrix(mesh.position.x, mesh.position.y, mesh.position.z);
    const rotationX = rotationXMatrix(mesh.rotation.x);
    const rotationY = rotationYMatrix(mesh.rotation.y);
    const rotationZ = rotationZMatrix(mesh.rotation.z);
    const scale = scaleMatrix(mesh.scale.x, mesh.scale.y, mesh.scale.z);
    return multiplyMatrices(translation, multiplyMatrices(rotationY, multiplyMatrices(rotationX, multiplyMatrices(rotationZ, scale))));
  }

  private renderWebGL2(meshes: MeshObject[], selectedId: string | null): void {
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    const projection = perspectiveMatrix(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
    const view = lookAtMatrix(this.cameraPosition, this.targetPosition, this.upVector);

    const uProjection = gl.getUniformLocation(this.program, 'u_projection');
    const uView = gl.getUniformLocation(this.program, 'u_view');
    const uModel = gl.getUniformLocation(this.program, 'u_model');
    const uBaseColor = gl.getUniformLocation(this.program, 'u_baseColor');
    const uLightDirection = gl.getUniformLocation(this.program, 'u_lightDirection');
    const uCameraPosition = gl.getUniformLocation(this.program, 'u_cameraPosition');

    gl.uniformMatrix4fv(uProjection, false, new Float32Array(projection));
    gl.uniformMatrix4fv(uView, false, new Float32Array(view));
    gl.uniform3fv(uLightDirection, new Float32Array([0.6, 0.8, 0.3]));
    gl.uniform3fv(uCameraPosition, new Float32Array([this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z]));

    meshes.forEach((mesh) => {
      if (mesh.indices.length === 0 || mesh.vertices.length === 0) return;
      const cache = this.ensureMeshData(mesh);
      gl.bindVertexArray(cache.vao);

      const model = this.composeModelMatrix(mesh);
      gl.uniformMatrix4fv(uModel, false, new Float32Array(model));

      const color = mesh.material.baseColor;
      const isSelected = selectedId === mesh.id;
      const selectedColor = isSelected ? [1.0, 0.85, 0.33, 1.0] : color;
      gl.uniform4fv(uBaseColor, new Float32Array(selectedColor));
      gl.drawElements(gl.TRIANGLES, cache.indexCount, gl.UNSIGNED_INT, 0);
    });

    gl.bindVertexArray(null);
  }

  public resize(width: number, height: number): void {
    this.canvas.width = Math.floor(width * window.devicePixelRatio);
    this.canvas.height = Math.floor(height * window.devicePixelRatio);
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
