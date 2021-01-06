import * as THREE from "three";
import { Colors } from "./Colors";
import getRandomInt from "../helpers/getRandomInt";

export default class Planet {
  constructor() {
    const radius = getRandomInt(20, 50);
    const widthSegments = getRandomInt(3, 8);
    const heightSegments = getRandomInt(3, 5);

    const geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments
    );
    const material = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });
    this.mesh = new THREE.Mesh(geometry, material);

    this.posOrNegX = getRandomInt(1, 2);
    this.posOrNegY = getRandomInt(1, 2);
    this.posOrNegZ = getRandomInt(1, 2);
  }
}
