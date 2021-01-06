import * as THREE from "three";
import { Colors } from "./Colors";

export default class Laser {
    constructor() {
        const geomLaser = new THREE.CylinderGeometry(1,1,10)
        const matLaser = new THREE.MeshPhongMaterial({
            color: Colors.green,
            flatShading: true
        })
        this.mesh = new THREE.Mesh(geomLaser, matLaser)
    }
}