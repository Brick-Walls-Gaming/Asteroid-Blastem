import * as THREE from "three";
import * as space from "../images/black-space.jpg"
export default class Space {
  constructor() {
    const spaceLaoder = new THREE.TextureLoader();
    const spaceTexture = spaceLaoder.load(space.default);

    const geoSpace = new THREE.SphereGeometry(1000, 25, 25);
    const matSpace = new THREE.MeshPhongMaterial({
      map: spaceTexture,
    });

    this.mesh = new THREE.Mesh(geoSpace, matSpace)
    this.mesh.material.side = THREE.BackSide
  }
}
