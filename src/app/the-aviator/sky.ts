import * as THREE from "three";
import { Colors } from "./constants";

export class Sky {
  mesh: THREE.Object3D;
  nClouds = 20;
  stepAngle = (Math.PI * 2) / this.nClouds;

  constructor() {
    this.mesh = new THREE.Object3D();

    for (let i = 0; i < this.nClouds; i++) {
      const cloud = new Cloud();
      const angle = this.stepAngle * i;
      const h = 750 + Math.random() * 200;
      // const h = 750;

      cloud.mesh.position.y = Math.sin(angle) * h;
      cloud.mesh.position.x = Math.cos(angle) * h;

      cloud.mesh.rotation.z = angle + Math.PI / 2;

      // position on z axis between ( -400 and 400 )
      cloud.mesh.position.z = -400 - Math.random() * 400;

      const s = 1 + Math.random() * 2;
      cloud.mesh.scale.set(s, s, s);

      this.mesh.add(cloud.mesh);
    }
  }

  update() {
    this.mesh.rotation.z += 0.01;
  }
}

export class Cloud {
  mesh: THREE.Object3D;

  constructor() {
    this.mesh = new THREE.Object3D();

    const geometry = new THREE.BoxGeometry(20, 20, 20);

    const material = new THREE.MeshPhongMaterial({
      color: Colors.white,
      transparent: true,
      opacity: 0.6,
    });

    const nBlocks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nBlocks; i++) {
      const m = new THREE.Mesh(geometry, material);

      m.position.x = i * 15;
      m.position.y = Math.random() * 10;
      m.position.z = Math.random() * 10;

      m.rotation.y = Math.random() * Math.PI * 2;
      m.rotation.z = Math.random() * Math.PI * 2;

      const s = 0.1 + Math.random() * 0.9;
      m.scale.set(s, s, s);

      m.receiveShadow = true;
      m.castShadow = true;

      this.mesh.add(m);
    }
  }

  update() {}
}
