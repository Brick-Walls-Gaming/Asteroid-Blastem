import * as THREE from "three";
import { Colors } from "./Colors.js";
import * as spaceman from '../images/spaceman.jpg'

export default class Spaceship {
  constructor() {
    this.mesh = new THREE.Object3D();

    // MAIN CABIN
    const mainCabin = new THREE.Object3D();

    const geomMain = new THREE.BoxGeometry(25, 50, 25);
    const matMain = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });
    const spaceshipMain = new THREE.Mesh(geomMain, matMain);
    spaceshipMain.castShadow = true;
    spaceshipMain.receiveShadow = true;
    mainCabin.add(spaceshipMain);

    const cabinWindow = new THREE.Object3D();

    const geomRim = new THREE.TorusGeometry(9, 3, 3, 10);
    const matRim = new THREE.MeshPhongMaterial({
      color: Colors.gray,
      flatShading: true,
    });
    const rim = new THREE.Mesh(geomRim, matRim);
    cabinWindow.add(rim);
    rim.position.set(0, 10, 11);

    const spacemanLoader = new THREE.TextureLoader();
    const spacemanTexture = spacemanLoader.load(spaceman.default)

    const geomGlass = new THREE.CircleGeometry(9, 10);
    const matGlass = new THREE.MeshPhongMaterial({
     map: spacemanTexture
    });
    const glass = new THREE.Mesh(geomGlass, matGlass)
    glass.position.set(0,10,12.51)

    cabinWindow.add(glass)

    mainCabin.add(cabinWindow);

    this.mesh.add(mainCabin);

    // ROCKET TIP
    const tip = new THREE.Object3D();

    const geomTip = new THREE.CylinderGeometry(0, 20, 25, 4);
    const matTip = new THREE.MeshPhongMaterial({
      color: Colors.pink,
      flatShading: true,
    });
    const tip1 = new THREE.Mesh(geomTip, matTip);
    tip1.castShadow = true;
    tip1.receiveShadow = true;
    tip.add(tip1);
    tip1.position.y = 37.5;
    const tip2 = tip1.clone();
    tip.add(tip2);
    tip1.rotation.y = Math.PI / 4;

    this.mesh.add(tip);

    // FINS
    const geomFins = new THREE.CylinderGeometry(0, 25, 25, 4);
    const matFins = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      flatShading: true,
    });
    const fins = new THREE.Mesh(geomFins, matFins);
    fins.castShadow = true;
    fins.receiveShadow = true;
    this.mesh.add(fins);
    fins.position.y = -12.51;

    // EXHAUST
    const geomExhaust = new THREE.CylinderGeometry(15, 10, 10, 4);
    const matExhaust = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    const exhaust = new THREE.Mesh(geomExhaust, matExhaust);
    exhaust.castShadow = true;
    exhaust.receiveShadow = true;
    this.mesh.add(exhaust);
    exhaust.position.y = -30;
    exhaust.rotation.y = Math.PI / 4;
  }
}
