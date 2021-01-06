import * as THREE from "three";
import * as CANNON from "cannon";
import Planet from "./modules/Planet";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Spaceship from "./modules/Spaceship";
import Space from "./modules/Space";
import getRandomInt from "./helpers/getRandomInt";

window.addEventListener("load", init, false);

function init() {
  // set up the scene, the camera and the renderer
  createScene();

  // add the lights
  createLights();

  // add the objects
  createSpace();
  createPlanet();
  createSpaceship();

  // When the mouse moves, call the given function
  document.addEventListener("mousemove", onMouseMove, false);

  // start a loop that will update the objects' positions
  // and render the scene on each frame
  loop();
}

// createScene function variables
let scene, camera, fov, aspect, near, far, HEIGHT, WIDTH, renderer, container;

function createScene() {
  // Get the width and height of the screen and use them to set up the aspect ratio of the camera and the size of the  renderer
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // Create the scene
  scene = new THREE.Scene();

  // Add fog effect to the scene; same color as the background color used in the style sheet
  //scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  // Create the camera
  aspect = WIDTH / HEIGHT;
  fov = 60;
  near = 1;
  far = 10000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  // Set camera position
  camera.position.set(0, 0, 300);

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true }); // ALPHA: allows transparency to see css background

  // Define the size of the renderer
  renderer.setSize(WIDTH, HEIGHT);

  // Enable shadow rendering
  renderer.shadowMap.enabled = true;

  // Add the DOM element of the renderer to the world container
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  // Listen for screen resize and update camera and renderer size accordingly
  window.addEventListener("resize", handleWindowResize, false);

  const controls = new OrbitControls(camera, world);
  controls.update();
}

function handleWindowResize() {
  // Update height and width of renderer and camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  renderer.setSize(WIDTH, HEIGHT);

  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

// createLight variables
let hemisphereLight, shadowLight, ambientLight;

function createLights() {
  // Hemisphere light with color gradient, first param = sky, second param = ground, third param = intensity
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  // Directional Light shines from specific direction and acts like the sun (all rays are parallel)
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

  // an ambient light modifies the global color of a scene and makes the shadows softer
  ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
  scene.add(ambientLight);

  // Set direction of light
  shadowLight.position.set(150, 350, 350);

  // Allow shadow casting
  shadowLight.castShadow = true;

  // Define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.left = 1;
  shadowLight.shadow.camera.left = 1000;

  // Define the resolution of the shadow; higher is better but more costly
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  // Add light to the scene
  scene.add(hemisphereLight);
  scene.add(shadowLight);
}
let space;

function createSpace() {
  space = new Space();

  scene.add(space.mesh);
}

let planet;
const planets = [];

function createPlanet() {
  const horizontalPos = getRandomInt(-250, 250);
  planet = new Planet();

  planet.mesh.position.set(horizontalPos, 200, 0);

  scene.add(planet.mesh);

  planets.push(planet);
}

let spaceship;

function createSpaceship() {
  spaceship = new Spaceship();

  spaceship.mesh.position.y -= 10;

  scene.add(spaceship.mesh);
}

// function getMousePos(canvas, evt) {
//   const rect = canvas.getBoundingClientRect();
//   return {
//     x: evt.clientX - rect.left,
//     y: evt.clientY - rect.top,
//   };
// }

let mouse = { x: 0, y: 0 };
function onMouseMove(event) {
  // Update the mouse variable
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Make the ship follow the mouse
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  spaceship.mesh.position.copy(pos);

  // Make the sphere follow the mouse
  //	mouseMesh.position.set(event.clientX, event.clientY, 0);
}

// function normalize(v, vmin, vmax, tmin, tmax) {
//   const nv = Math.max(Math.min(v, vmax), vmin);
//   const dv = vmax - vmin;
//   const pc = (nv - vmin) / dv;
//   const dt = tmax - tmin;
//   const tv = tmin + pc * dt;
//   return tv;
// }

function removePlanet(planet) {
  const planetInScene = scene.getObjectById(planet.mesh.id)
  const planetIdx = planets.indexOf(planet)

  planet.mesh.geometry.dispose();
  planet.mesh.material.dispose();
  scene.remove(planetInScene);

  if (planetIdx > -1) {
    planets.splice(planetIdx, 1);
  }
}

let counter = 1
function loop() {
  // render the sceneafdwad
  renderer.render(scene, camera);

  planets.forEach((p) => {
    p.posOrNegX === 1
      ? (p.mesh.rotation.x += 0.01)
      : (p.mesh.rotation.x -= 0.01);
    // p.posOrNegY === 1 ? (p.mesh.rotation.y += 0.01) : (p.mesh.rotation.y -= 0.01);
    p.posOrNegZ === 1
      ? (p.mesh.rotation.z += 0.01)
      : (p.mesh.rotation.z -= 0.01);

    p.mesh.position.y -= 0.75;

    if (planets.length < 5 && counter % 240 === 0) {
      createPlanet()
    counter = 1
     }

    if (p.mesh.position.y <= -250) {

      removePlanet(p);
    }

    counter ++
  });

  // MOVE SPACE
  space.mesh.rotation.x -= 0.001

  // call the loop function again
  requestAnimationFrame(loop);
}
