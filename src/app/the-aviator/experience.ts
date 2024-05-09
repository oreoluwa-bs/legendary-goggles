import * as THREE from "three";
import { Sea } from "./sea";
import { Sky } from "./sky";
import { Airplane } from "./airplane";

export class TheAviatorExperience {
  el: {
    // container: HTMLElement;
    canvas: HTMLCanvasElement;
    [key: string]: HTMLElement;
  };
  scene: THREE.Scene;
  sizes: {
    width: number;
    height: number;
    aspectRatio: number;
    pixelRatio: number;
    nearPlane: number;
    farPlane: number;
  };
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock;
  startTime: number;
  currentTime: number;
  elapsedTime: number;
  deltaTime: number;
  clockId: number;
  resources: { [k: string]: any } = {};

  constructor(canvas: HTMLCanvasElement) {
    this.el = {
      canvas: canvas,
    };

    this.scene = new THREE.Scene();
    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    this.scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // Sizes
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      get aspectRatio() {
        return this.width / this.height;
      },
      pixelRatio: Math.min(window.devicePixelRatio, 2),

      nearPlane: 1,
      farPlane: 1000,
    };

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.sizes.aspectRatio,
      this.sizes.nearPlane,
      this.sizes.farPlane
    );

    this.camera.position.set(0, 100, 200);
    this.scene.add(this.camera);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.el.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    this.startTime = Date.now();
    this.clock = new THREE.Clock();
    this.currentTime = this.startTime;
    this.elapsedTime = 0;
    // cause on average the delta is 16/17/18 on 60fps screens
    this.deltaTime = 16;

    this.addListeners();

    this.addLights();
    this.runWorld();

    this.clockId = window.requestAnimationFrame(() => {
      this.update();
    });
  }

  addLights() {
    this.resources["hemisphereLight"] = new THREE.HemisphereLight(
      0xaaaaaa,
      0x000000,
      0.9
    );
    this.resources["shadowLight"] = new THREE.DirectionalLight(0xffffff, 5);

    this.resources["shadowLight"].castShadow = true;
    this.resources["shadowLight"].position.set(150, 350, 350);
    this.resources["shadowLight"].shadow.camera.left = -400;
    this.resources["shadowLight"].shadow.camera.right = -400;
    this.resources["shadowLight"].shadow.camera.top = 400;
    this.resources["shadowLight"].shadow.camera.bottom = -400;
    this.resources["shadowLight"].shadow.camera.near = 1;
    this.resources["shadowLight"].shadow.camera.far = 1000;

    this.resources["shadowLight"].shadow.mapSize.set(1024, 1024);

    this.resources["ambientLight"] = new THREE.AmbientLight(0xdc8874, 0.5);

    this.scene.add(this.resources["hemisphereLight"] as THREE.HemisphereLight);
    this.scene.add(this.resources["shadowLight"] as THREE.DirectionalLight);
    this.scene.add(this.resources["ambientLight"] as THREE.AmbientLight);
  }

  runWorld() {
    this.resources["sea"] = new Sea();
    this.resources["sea"].mesh.position.y = -600;
    this.scene.add(this.resources["sea"].mesh);

    this.resources["sky"] = new Sky();
    this.resources["sky"].mesh.position.y = -600;
    this.scene.add(this.resources["sky"].mesh);

    this.resources["airplane"] = new Airplane(this);
    this.resources["airplane"].fly();
    this.resources["airplane"].mesh.scale.set(0.25, 0.25, 0.25);
    this.resources["airplane"].mesh.position.y = 100;
    this.scene.add(this.resources["airplane"].mesh);
  }

  update() {
    const currentTime = Date.now();

    this.deltaTime = currentTime - this.currentTime;
    this.currentTime = currentTime;
    this.elapsedTime = this.currentTime - this.startTime;

    this.resources["airplane"].update();
    this.resources["sea"].update();
    this.resources["sky"].update();

    this.renderer.render(this.scene, this.camera);

    this.clockId = window.requestAnimationFrame(() => {
      this.update();
    });
  }

  addListeners() {
    window.addEventListener("resize", this.resize.bind(this), false);
  }

  resize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  dispose() {
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        for (const key in child.material) {
          const value = child.material[key];

          if (value && typeof value.dispose === "function") {
            value.dispose();
          }
        }
      }
    });

    this.renderer.dispose();

    window.removeEventListener("resize", this.resize.bind(this));
    window.cancelAnimationFrame(this.clockId);
  }
}
