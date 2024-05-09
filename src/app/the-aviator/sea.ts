import * as THREE from "three";
import { Colors } from "./constants";

export class Sea {
  mesh: THREE.Mesh;
  waves: {
    y: number;
    x: number;
    z: number;
    ang: number;
    amp: number;
    speed: number;
  }[];

  constructor() {
    const geometry = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    const vertices = geometry.attributes.position.array;
    const l = vertices.length / 3; // Assuming 3 components per vertex (x, y, z)

    // Create an array to store new data associated to each vertex
    this.waves = [];

    for (let i = 0; i < l; i++) {
      // Access vertex data directly from attributes array
      const v = new THREE.Vector3(
        vertices[i * 3],
        vertices[i * 3 + 1],
        vertices[i * 3 + 2]
      );

      // Store data associated with the vertex
      this.waves.push({
        y: v.y,
        x: v.x,
        z: v.z,
        ang: Math.random() * Math.PI * 2,
        amp: 5 + Math.random() * 15,
        speed: 0.016 + Math.random() * 0.032,
      });
    }

    const material = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: 0.6,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
  }

  moveWaves() {
    const vertices = this.mesh.geometry.attributes.position.array;
    const l = vertices.length / 3;

    for (let i = 0; i < l; i++) {
      const vIndex = i * 3;

      const vprops = this.waves[i];

      vertices[vIndex] = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      vertices[vIndex + 1] = vprops.y + Math.sin(vprops.ang) * vprops.amp;

      vprops.ang += vprops.speed;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  update() {
    this.moveWaves();
    this.mesh.rotation.z += 0.005;
  }
}
