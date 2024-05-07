import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { gsap } from "gsap";

export class BeerExperience {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  sizes: {
    width: number;
    height: number;
    aspectRatio: number;
    pixelRatio: number;
  };
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  clock: THREE.Clock;
  startTime: number;
  currentTime: number;
  elapsedTime: number;
  deltaTime: number;
  clockId: number;
  loaders: {
    texture: THREE.TextureLoader;
    draco: DRACOLoader;
    gltf: GLTFLoader;
  };
  assetsLoaded = false;
  resources: {
    [key: string]: any;
  } = {};
  animations: {
    [key: string]: any;
  } = {};

  constructor(canvas: HTMLCanvasElement) {
    // Canvas
    this.canvas = canvas;

    // Scene
    this.scene = new THREE.Scene();

    // Sizes
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      get aspectRatio() {
        return this.width / this.height;
      },
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      35,
      this.sizes.aspectRatio,
      0.1,
      100
    );

    this.camera.position.set(0, 0, 8.5);
    this.scene.add(this.camera);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });
    // this.renderer.setClearColor();
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.controls.enableDamping = true;

    // Update
    this.startTime = Date.now();
    this.clock = new THREE.Clock();
    this.currentTime = this.startTime;
    this.elapsedTime = 0;
    // cause on average the delta is 16/17/18 on 60fps screens
    this.deltaTime = 16;

    this.addListeners();

    const loadingManager = new THREE.LoadingManager(() => {
      this.assetsLoaded = true;
      this.runWorld();
    });
    this.loaders = {
      texture: new THREE.TextureLoader(loadingManager),
      draco: new DRACOLoader(loadingManager),
      gltf: new GLTFLoader(loadingManager),
    };
    this.loaders.draco.setDecoderPath("/draco/");
    this.loaders.gltf.setDRACOLoader(this.loaders.draco);

    this.loadAssets();

    this.clockId = window.requestAnimationFrame(() => {
      this.update();
    });
  }

  loadAssets() {
    const beer_textures = [
      {
        name: "ipa_texture",
        url: "/models/brew-district/baseColor_1.webp",
      },
      {
        name: "blonde_texture",
        url: "/models/brew-district/baseColor_2.webp",
      },
      {
        name: "imperial_texture",
        url: "/models/brew-district/baseColor_3.webp",
      },
      {
        name: "neipa_texture",
        url: "/models/brew-district/baseColor_4.webp",
      },
    ];

    for (const text of beer_textures) {
      this.loaders.texture.load(text.url, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.resources[text.name] = texture;
      });
    }

    this.loaders.gltf.load(
      "/models/brew-district/beer-model-1-compressed.gltf",
      (model) => {
        model.scene.scale.set(0.25, 0.25, 0.25);
        this.resources["beer_model"] = model;

        // model.scene.position.y = -0.5;

        model.scene.traverse((child) => {
          if (
            child instanceof THREE.Mesh &&
            child.material instanceof THREE.MeshStandardMaterial
          ) {
            child.material.metalness = 1;
          }
        });
      }
    );
  }

  runWorld() {
    this.addLights();
    const beerModel = this.resources["beer_model"];
    this.scene.add(beerModel.scene);

    // play beer animation
    this.animations.beerAnimation = {} as { [k: string]: any };

    this.animations.beerAnimation.mixer = new THREE.AnimationMixer(
      beerModel.scene
    );

    this.animations.beerAnimation.actions = {};
    // console.log(this.resource.animations[0]);

    beerModel.animations.forEach((anim: any, index: number) => {
      const animName = anim.name ?? `Animation ${index + 1}`;
      this.animations.beerAnimation.actions[animName] =
        this.animations.beerAnimation.mixer.clipAction(anim);
    });

    this.animations.beerAnimation.current =
      this.animations.beerAnimation.actions[
        Object.keys(this.animations.beerAnimation.actions as any).at(0)!
      ];
    this.animations.beerAnimation.current.reset();
    this.animations.beerAnimation.current.play();

    gsap.to(beerModel.scene.rotation, {
      x: Math.PI * 2,
      scrollTrigger: {
        trigger: ".main__container",
        start: "top top",
        // trigger: el,
        // start: index === 0 ? "clamp(top bottom)" : "top bottom", // top of the trigger  hits the bottom of the viewport
        // start: "top bottom", // top of the trigger  hits the bottom of the viewport
        // end: "+=600",
        //
        end: "bottom bottom",

        scrub: true,
      },
    });
  }

  addLights() {
    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    // this.scene.add(ambientLight);

    const dL1 = new THREE.DirectionalLight(0xfffee0, 6);
    dL1.shadow.mapSize.set(512, 512);
    dL1.shadow.camera.far = 20;
    dL1.position.set(-2, 0, 1);

    this.scene.add(dL1);

    // const helper1 = new THREE.DirectionalLightHelper(dL1, 1);
    // this.scene.add(helper1);

    const dL2 = new THREE.DirectionalLight(0xffffff, 6);
    dL2.shadow.mapSize.set(512, 512);
    dL2.shadow.camera.far = 20;
    dL2.position.set(3, 0, 1);

    this.scene.add(dL2);

    // const helper2 = new THREE.DirectionalLightHelper(dL2, 1);
    // this.scene.add(helper2);
  }

  update() {
    const currentTime = Date.now();

    this.deltaTime = currentTime - this.currentTime;
    this.currentTime = currentTime;
    this.elapsedTime = this.currentTime - this.startTime;

    this.controls.update(this.deltaTime);

    for (const anim of Object.values(this.animations)) {
      if (anim.mixer) {
        anim.mixer.update(this.deltaTime / 1000);
      }
    }
    this.renderer.render(this.scene, this.camera);

    this.clockId = window.requestAnimationFrame(() => {
      this.update();
    });
  }

  addListeners() {
    window.addEventListener("resize", this.resize.bind(this));
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

// const testMesh = new THREE.Mesh(
//   new THREE.BoxGeometry(1, 1, 1),
//   new THREE.MeshBasicMaterial()
// );

// this.scene.add(testMesh);
