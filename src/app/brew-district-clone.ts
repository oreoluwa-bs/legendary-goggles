import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { gsap } from "gsap";

const beer = {
  Ipa: {
    name: "Ipa",
    bg_color: "rgb(111, 142, 153)",
  },
  Blond: {
    name: "American blonde",
    bg_color: "rgb(117, 132, 106)",
  },
  Stout: {
    name: "Imperial stout",
    bg_color: "rgb(174, 102, 103)",
  },
  Neipa: {
    name: "Neipa",
    bg_color: "rgb(89, 111, 97)",
  },
};

const beerArr = Object.entries(beer).map(([key, value]) => ({
  key,
  ...value,
}));

export class BeerExperience {
  el: {
    canvas: HTMLCanvasElement;
    [key: string]: HTMLElement;
  };
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

  state = {
    currentModel: beerArr.at(0)!.key,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.el = {
      // Canvas
      canvas: canvas,

      background: document.querySelector<HTMLElement>(".background")!,

      svg_transition_wrapper:
        document.querySelector<HTMLElement>(".svg_transition")!,
      svg_transition_outer: document.querySelector<HTMLElement>(
        ".svg_transition .outer"
      )!,
      svg_transition_inner: document.querySelector<HTMLElement>(
        ".svg_transition .inner"
      )!,

      slider_name: document.querySelector<HTMLElement>(".order__name")!,
      slider_next_btn: document.querySelector<HTMLButtonElement>(
        ".order__nav.order__nav--next"
      )!,
      slider_prev_btn: document.querySelector<HTMLButtonElement>(
        ".order__nav.order__nav--prev"
      )!,
    };

    this.el.slider_name.innerText =
      beer[this.state.currentModel as keyof typeof beer].name;

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
      canvas: this.el.canvas,
      alpha: true,
    });
    // this.renderer.setClearColor();
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    // Controls
    this.controls = new OrbitControls(this.camera, this.el.canvas);
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

        // console.log(model.scene);

        model.scene.traverse((child) => {
          if (
            child instanceof THREE.Mesh &&
            child.material instanceof THREE.MeshStandardMaterial
          ) {
            child.material.metalness = 1;
            if (child.name !== "0" && child.name !== this.state.currentModel) {
              // console.log(child.name, this.state.currentModel, child);
              child.visible = false;
            }
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

  updateSVGTransitionPosition() {
    const beerModel = this.resources["beer_model"].scene;
    // const screenPosition = beerModel.position.clone();
    const box3 = new THREE.Box3().setFromObject(beerModel);
    const screenPosition = new THREE.Vector3(0, 0, 0);
    box3.getCenter(screenPosition);
    screenPosition.project(this.camera);

    const translateX = screenPosition.x * this.sizes.width * 0.5;
    const translateY = -screenPosition.y * this.sizes.height * 0.5;
    this.el.svg_transition_wrapper.style.transform = `translate(${translateX}px,${translateY}px)`;
  }

  update() {
    const currentTime = Date.now();

    this.deltaTime = currentTime - this.currentTime;
    this.currentTime = currentTime;
    this.elapsedTime = this.currentTime - this.startTime;

    this.controls.update(this.deltaTime);

    if (this.resources["beer_model"]) {
      this.updateSVGTransitionPosition();
    }

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

    this.el.slider_next_btn.addEventListener(
      "click",
      this.nextModel.bind(this)
    );
    this.el.slider_prev_btn.addEventListener(
      "click",
      this.prevModel.bind(this)
    );
  }

  changeCurrentModel(nextModelKey: string) {
    const tl = gsap.timeline({ defaults: { duration: 1.5 } });
    const beerModel = this.resources["beer_model"];

    const nextModel = beer[nextModelKey as keyof typeof beer];

    tl.to(
      beerModel.scene.rotation,
      {
        // y: beerModel.scene.rotation.y + Math.PI * 2,
        y: Math.PI * 2,
        onComplete: () => {
          beerModel.scene.rotation.y = 0;
        },
      },
      "start"
    )
      .to(
        this.el.svg_transition_outer,
        {
          // height: this.sizes.height,
          // width: this.sizes.width,
          scale: 2,
          autoAlpha: 1,
          backgroundColor: nextModel.bg_color,
          transformOrigin: "center center",
        },
        "start"
      )
      .to(
        this.el.svg_transition_inner,
        {
          scale: 2,
          autoAlpha: 1,
          backgroundColor: nextModel.bg_color,
          transformOrigin: "center center",
          delay: 0.2,
        },
        "start"
      )
      .set(this.el.background, {
        backgroundColor: nextModel.bg_color,
      })
      .set([this.el.svg_transition_outer, this.el.svg_transition_inner], {
        scale: 0.1,
        autoAlpha: 0,
      })
      .to(
        this.el.slider_name,
        {
          x: -20,
          opacity: 0,
          // duration: 1.6,
        },
        "start"
      )
      .set(this.el.slider_name, {
        x: 0,
        innerText: nextModel.name,
      })
      .to(
        this.el.slider_name,
        {
          opacity: 1,
          // duration: 1.7,
        }
        // "start"
      );

    this.scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        // child.material.metalness = 1;
        if (child.name !== "0" && child.name === this.state.currentModel) {
          child.visible = false;
        }
        if (child.name !== "0" && child.name === nextModelKey) {
          child.visible = true;
        }
      }
    });

    this.state.currentModel = nextModelKey;
  }

  nextModel() {
    const currInd = beerArr.findIndex((r) => r.key === this.state.currentModel);
    const nextInd = currInd + 1 > beerArr.length - 1 ? 0 : currInd + 1;

    this.changeCurrentModel(beerArr.at(nextInd)!.key);
  }

  prevModel() {
    const currInd = beerArr.findIndex((r) => r.key === this.state.currentModel);

    const nextInd = currInd - 1 < 0 ? beerArr.length - 1 : currInd - 1;

    this.changeCurrentModel(beerArr.at(nextInd)!.key);
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

function getCenterPoint(mesh: any) {
  const middle = new THREE.Vector3();
  const geometry =
    mesh instanceof THREE.Mesh || mesh.isMesh ? mesh.geometry : mesh;

  geometry.computeBoundingBox();
  geometry.boundingBox.getSize(middle);

  middle.x = middle.x / 2;
  middle.y = middle.y / 2;
  middle.z = middle.z / 2;

  mesh.localToWorld(middle);
  return middle;
}
