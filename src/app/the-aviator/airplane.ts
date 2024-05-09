import * as THREE from "three";
import { Colors } from "./constants";
import type { TheAviatorExperience } from "./experience";
import { normalize } from "./utils";

export const mousePosition = { x: 0, y: 0 };

export class Airplane {
  mesh: THREE.Object3D;
  propeller: THREE.Mesh;
  is_flying = false;
  experience: TheAviatorExperience;
  pilot: Pilot;

  constructor(experience: TheAviatorExperience) {
    this.experience = experience;
    this.mesh = new THREE.Object3D();

    const cockpit_geom = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
    const cockpit_mat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });
    const cockpit = new THREE.Mesh(cockpit_geom, cockpit_mat);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // const positionAttribute = cockpit_geom.getAttribute("position");

    // positionAttribute.setY(10, positionAttribute.getY(10) - 10);
    // positionAttribute.setZ(10, positionAttribute.getZ(10) + 20);

    // positionAttribute.setY(8, positionAttribute.getY(8) - 10);
    // positionAttribute.setZ(8, positionAttribute.getZ(8) - 20);

    // positionAttribute.setY(6, positionAttribute.getY(6) + 30);
    // positionAttribute.setZ(6, positionAttribute.getZ(6) + 20);

    // positionAttribute.setY(7, positionAttribute.getY(7) + 30);
    // positionAttribute.setZ(7, positionAttribute.getZ(7) - 20);

    // positionAttribute.setY(7, positionAttribute.getY(7) + 30);
    // positionAttribute.setZ(7, positionAttribute.getZ(7) - 20);
    // positionAttribute.needsUpdate = true;
    //

    // const box = new THREE.BoxHelper(cockpit, 0xffff00);
    // this.mesh.add(box);

    const engine_geom = new THREE.BoxGeometry(20, 20, 40);
    const engine_mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true,
    });
    const engine = new THREE.Mesh(engine_geom, engine_mat);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    const plane_tail_geom = new THREE.BoxGeometry(15, 20, 5);
    // const plane_tail_MAT = new THREE.MeshPhongMaterial({col});
    const plane_tail = new THREE.Mesh(plane_tail_geom, cockpit_mat);
    plane_tail.position.set(-35, 25, 0);
    plane_tail.castShadow = true;
    plane_tail.receiveShadow = true;
    this.mesh.add(plane_tail);

    const wing_geom = new THREE.BoxGeometry(40, 8, 150);
    // const wing_MAT = new THREE.MeshPhongMaterial({col});
    const wing = new THREE.Mesh(wing_geom, cockpit_mat);
    wing.position.set(-35, 25, 0);
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);

    const propeller_geom = new THREE.BoxGeometry(20, 10, 10);
    const propeller_mat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    this.propeller = new THREE.Mesh(propeller_geom, propeller_mat);
    this.propeller.position.set(50, 0, 0);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;
    this.mesh.add(this.propeller);

    const blade_geom = new THREE.BoxGeometry(1, 100, 20);
    const blade_mat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });

    const blade = new THREE.Mesh(blade_geom, blade_mat);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;

    this.propeller.add(blade);

    this.pilot = new Pilot();
    this.pilot.mesh.position.y = 40;
    this.mesh.add(this.pilot.mesh);

    this.addListeners();
  }

  fly() {
    this.is_flying = true;
  }

  stopFlying() {
    this.is_flying = false;
  }

  update() {
    if (this.is_flying) {
      this.propeller.rotation.x += 0.3;

      // let's move the airplane between -100 and 100 on the horizontal axis,
      // and between 25 and 175 on the vertical axis,
      // depending on the mouse position which ranges between -1 and 1 on both axes;
      // to achieve that we use a normalize function
      //
      const tx = normalize(mousePosition.x, -1, 1, -100, 100);
      const ty = normalize(mousePosition.y, -1, 1, -25, 175);

      this.mesh.position.y += (ty - this.mesh.position.y) * 0.1;
      // this.mesh.position.x = tx;
      //

      this.mesh.rotation.z = (ty - this.mesh.position.y) * 0.0128;
      this.mesh.rotation.x = (this.mesh.position.y - ty) * 0.0064;

      this.pilot.updateHairs();
    }
  }

  addListeners() {
    document.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      false
    );
  }

  handleMouseMove(event: MouseEvent) {
    // here we are converting the mouse position value received
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis:

    const tx = -1 + (event.clientX / this.experience.sizes.width) * 2;

    // for the vertical axis, we need to inverse the formula
    // because the 2D y-axis goes the opposite direction of the 3D y-axis

    var ty = 1 - (event.clientY / this.experience.sizes.height) * 2;

    mousePosition.x = tx;
    mousePosition.y = ty;
  }
}

class Pilot {
  mesh = new THREE.Object3D();
  hairsTop = new THREE.Object3D();
  angleHairs = 0;

  constructor() {
    this.mesh.name = "pilot";

    const body_geom = new THREE.BoxGeometry(15, 15, 15);
    const body_mat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    const body = new THREE.Mesh(body_geom, body_mat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    const face_geom = new THREE.BoxGeometry(10, 10, 10);
    const face_mat = new THREE.MeshLambertMaterial({ color: Colors.pink });
    const face = new THREE.Mesh(face_geom, face_mat);
    this.mesh.add(face);

    const hair_geom = new THREE.BoxGeometry(4, 4, 4);
    const hair_mat = new THREE.MeshLambertMaterial({ color: Colors.brown });
    const hair = new THREE.Mesh(hair_geom, hair_mat);
    hair.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2, 0));
    // this.mesh.add(hair);

    const hairs = new THREE.Object3D();

    this.hairsTop = new THREE.Object3D();

    for (let i = 0; i < 12; i++) {
      const h = hair.clone();
      const col = i % 3;
      const row = Math.floor(i / 3);

      const sPZ = -4;
      const sPX = -4;

      h.position.set(sPX + row * 4, 0, sPZ + col * 4);
      this.hairsTop.add(h);
    }

    const hair_side_geom = new THREE.BoxGeometry(12, 4, 2);
    hair_side_geom.applyMatrix4(new THREE.Matrix4().makeTranslation(-6, 0, 0));

    const hair_side_r = new THREE.Mesh(hair_side_geom, hair_mat);
    const hair_side_l = hair_side_r.clone();
    hair_side_r.position.set(8, -2, 6);
    hair_side_l.position.set(8, -2, -6);
    hairs.add(hair_side_r, hair_side_l);

    const hair_back_geom = new THREE.BoxGeometry(2, 8, 10);
    const hair_back = new THREE.Mesh(hair_back_geom, hair_mat);
    hair_back.position.set(-1, -4, 0);
    hairs.add(hair_back);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    const glass_geom = new THREE.BoxGeometry(5, 5, 5);
    const glass_mat = new THREE.MeshLambertMaterial({ color: Colors.brown });
    const glass_r = new THREE.Mesh(glass_geom, glass_mat);
    glass_r.position.set(6, 0, 3);
    const glass_l = glass_r.clone();
    glass_l.position.z = -glass_r.position.z;

    const glass_a_geom = new THREE.BoxGeometry(11, 1, 11);
    const glass_a = new THREE.Mesh(glass_a_geom, glass_mat);
    this.mesh.add(glass_r, glass_l, glass_a);

    var ear_geom = new THREE.BoxGeometry(2, 3, 2);
    var ear_l = new THREE.Mesh(ear_geom, face_mat);
    ear_l.position.set(0, 0, -6);
    var ear_r = ear_l.clone();
    ear_r.position.set(0, 0, 6);
    this.mesh.add(ear_l, ear_r);
  }

  updateHairs() {
    const hairs = this.hairsTop.children;
    var l = hairs.length;
    for (let i = 0; i > l; i++) {
      const h = hairs[i];
      h.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25;
    }
    this.angleHairs += 0.16;
  }
}
