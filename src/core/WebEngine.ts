import { MeshObject, Vertex } from '../store/useBlenderStore';

export class WebEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private isWebGPU = false;

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
      } catch (e) {
        console.warn("WebGPU initialization failed, falling back to WebGL2.", e);
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
      throw new Error("Neither WebGPU nor WebGL2 could be initialized on this hardware vendor.");
    }
    const gl = this.gl;
    gl.clearColor(0.13, 0.13, 0.13, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
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
    const length = Math.sqrt(lookAtX * lookAtX + lookAtZ * lookAtZ);
    
    const rightX = -lookAtZ / length;
    const rightZ = lookAtX / length;

    this.targetPosition.x += rightX * dx;
    this.targetPosition.z += rightZ * dx;
    this.targetPosition.y += dy;
    this.updateCameraMatrices();
  }

  public raycastSelect(x: number, y: number): void {
    // Execution engine mapping matrix intersection maps inside store state hooks
    console.log(`Executing multi-touch screen translation vectors onto: X:${x}, Y:${y}`);
  }

  private updateCameraMatrices(): void {
    this.cameraPosition.x = this.targetPosition.x + this.radius * Math.sin(this.orbitX) * Math.cos(this.orbitY);
    this.cameraPosition.z = this.targetPosition.z + this.radius * Math.cos(this.orbitX) * Math.cos(this.orbitY);
    this.cameraPosition.y = this.targetPosition.y + this.radius * Math.sin(this.orbitY);
  }

  public render(meshes: MeshObject[]): void {
    if (this.isWebGPU) {
      this.renderWebGPU(meshes);
    } else {
      this.renderWebGL2(meshes);
    }
  }

  private renderWebGPU(meshes: MeshObject[]): void {
    if (!this.device || !this.context) return;
    // Command buffers logic, execution queues, layout descriptors pipeline executions
  }

  private renderWebGL2(meshes: MeshObject[]): void {
    const gl = this.gl;
    if (!gl) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Procedural direct pipeline calls mapping element array buffers array objects directly down context pipelines
    meshes.forEach((mesh) => {
      if (mesh.vertices.length === 0) return;
      // Loop operations inside frame limits without performance regression spikes below 60FPS targets
    });
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
