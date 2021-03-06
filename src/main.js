import * as THREE from "three";
import * as Ammo from "ammo.js";
import Planet from "./modules/Planet";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Spaceship from "./modules/Spaceship";
import Space from "./modules/Space";
import Laser from "./modules/Laser";
import getRandomInt from "./helpers/getRandomInt";

let // physics variables
  AMMO,
  physicsWorld,
  intervalId = null,
  clock = new THREE.Clock(),
  moveDirection = { left: 0, right: 0, forward: 0, back: 0, up: 0, down: 0 },
  previousMove,
  tmpTrans,
  tmpPos = new THREE.Vector3(),
  tmpQuat = new THREE.Quaternion(),
  ammoTmpPos = null,
  ammoTmpQuat = null,
  spaceshipMoveDirection = { left: 0, right: 0, forward: 0, back: 0 },
  // createScene function variables
  scene,
  camera,
  fov,
  aspect,
  near,
  far,
  HEIGHT,
  WIDTH,
  renderer,
  container,
  // createLight variables
  hemisphereLight,
  shadowLight,
  ambientLight,
  // Object variables
  space,
  planet,
  spaceship,
  laser1,
  laser2,
  bBoxSpaceship,
  mouse = { x: 0, y: 0 };
const planets = [];
const lasers = [];
const rigidBodies = [];
const STATE = { DISABLE_DEACTIVATION: 4 };
const FLAGS = { CF_KINEMATIC_OBJECT: 2 };

// Loop variables
let requestId;
let counter = 1;

Ammo().then((AmmoLib) => {
  AMMO = AmmoLib;
  init();
});

function init() {
  createPhysicsWorld();

  tmpTrans = new AMMO.btTransform();
  ammoTmpPos = new AMMO.btVector3();
  ammoTmpQuat = new AMMO.btQuaternion();

  // set up the scene, the camera and the renderer
  createScene();

  // add the lights
  createLights();

  // add the objects
  createSpace();
  createPlanet();
  createSpaceship();

  //createLaser();

  // When the mouse moves, call the given function

  // document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("mousedown", () => {
    intervalId = setInterval(createLaser, 300);
  });
  document.addEventListener("mouseup", () => {
    clearInterval(intervalId);
    intervalId = null;
  });
  window.addEventListener("keydown", handleKeyDown, false);
  window.addEventListener("keyup", handleKeyUp, false);

  // start a loop that will update the objects' positions
  // and render the scene on each frame
  loop();
}

function createPhysicsWorld() {
  //algorithms for full collision detection
  let collisionConfiguration = new AMMO.btDefaultCollisionConfiguration();

  //dispatch calculations for overlapping pairs/ collisions.
  let dispatcher = new AMMO.btCollisionDispatcher(collisionConfiguration);

  //broadphase collision detection list of all possible colliding pairs
  let overlappingPairCache = new AMMO.btDbvtBroadphase();

  //causes the objects to interact properly, like gravity, forces, collisions
  let constraintSolver = new AMMO.btSequentialImpulseConstraintSolver();

  // create physics world from these parameters. See bullet physics docs for info
  physicsWorld = new AMMO.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    constraintSolver,
    collisionConfiguration
  );

  // add gravity
  physicsWorld.setGravity(new AMMO.btVector3(0, -12, 0));
}

function updatePhysics(deltaTime) {
  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rigid bodies
  for (let i = 0; i < rigidBodies.length; i++) {
    let objThree = rigidBodies[i];
    let objAmmo = objThree.userData.physicsBody;
    let ms = objAmmo.getMotionState();
    if (ms) {
      ms.getWorldTransform(tmpTrans);
      let p = tmpTrans.getOrigin();
      let q = tmpTrans.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      //objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
  detectCollision();
}

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
}

function handleWindowResize() {
  // Update height and width of renderer and camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  renderer.setSize(WIDTH, HEIGHT);

  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleKeyDown(event) {
  let keyCode = event.keyCode;

  switch (keyCode) {
    case 87: //W: FORWARD
      spaceshipMoveDirection.forward = 3;
      break;

    case 83: //S: BACK
      spaceshipMoveDirection.back = 3;
      break;

    case 65: //A: LEFT
      spaceshipMoveDirection.left = 3;
      break;

    case 68: //D: RIGHT
      spaceshipMoveDirection.right = 3;
      break;
  }
}

function handleKeyUp(event) {
  let keyCode = event.keyCode;

  switch (keyCode) {
    case 87: //W: FORWARD
      spaceshipMoveDirection.forward = 0;
      break;

    case 83: //S: BACK
      spaceshipMoveDirection.back = 0;
      break;

    case 65: //A: LEFT
      spaceshipMoveDirection.left = 0;
      break;

    case 68: //D: RIGHT
      spaceshipMoveDirection.right = 0;
      break;
  }
}

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
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // Define the resolution of the shadow; higher is better but more costly
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  // Add light to the scene
  scene.add(hemisphereLight);
  scene.add(shadowLight);
}

function createSpace() {
  space = new Space();

  scene.add(space.mesh);
}

function createPlanet() {
  let mass = 1;

  const horizontalPos = getRandomInt(-250, 250);
  planet = new Planet();

  planet.mesh.position.set(horizontalPos, 200, 0);

  scene.add(planet.mesh);

  planets.push(planet);
  //console.log(planet.mesh.userData)

  //AMMO
  let transform = new AMMO.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new AMMO.btVector3(
      planet.mesh.position.x,
      planet.mesh.position.y,
      planet.mesh.position.z
    )
  );
  transform.setRotation(
    new AMMO.btQuaternion(
      planet.mesh.quaternion.x,
      planet.mesh.quaternion.y,
      planet.mesh.quaternion.z,
      planet.mesh.quaternion.w
    )
  );
  let motionState = new AMMO.btDefaultMotionState(transform);

  let colShape = new AMMO.btSphereShape(planet.mesh.geometry.parameters.radius);
  colShape.setMargin(0.05);

  let localInertia = new AMMO.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new AMMO.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia
  );
  let body = new AMMO.btRigidBody(rbInfo);

  physicsWorld.addRigidBody(body);
  rigidBodies.push(planet.mesh);

  planet.mesh.userData.physicsBody = body;

  body.threeObject = planet;

  planet.mesh.userData.tag = "planet";
}

function createSpaceship() {
  let mass = 1;
  spaceship = new Spaceship();

  spaceship.mesh.position.y -= 10;

  scene.add(spaceship.mesh);

  let transform = new AMMO.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new AMMO.btVector3(
      spaceship.mesh.position.x,
      spaceship.mesh.position.y,
      spaceship.mesh.position.z
    )
  );
  transform.setRotation(
    new AMMO.btQuaternion(
      spaceship.mesh.quaternion.x,
      spaceship.mesh.quaternion.y,
      spaceship.mesh.quaternion.z,
      spaceship.mesh.quaternion.w
    )
  );
  let motionState = new AMMO.btDefaultMotionState(transform);

  let colShape = new AMMO.btBoxShape(new AMMO.btVector3(20, 45, 20));
  colShape.setMargin(0.05);

  let localInertia = new AMMO.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new AMMO.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia
  );

  let body = new AMMO.btRigidBody(rbInfo);

  body.setActivationState(STATE.DISABLE_DEACTIVATION);
  body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);

  physicsWorld.addRigidBody(body);
  spaceship.mesh.userData.physicsBody = body;

  rigidBodies.push(spaceship.mesh);

  body.threeObject = spaceship;

  spaceship.mesh.userData.tag = "spaceship";
}

function removeSpaceShip() {
  const spaceshipInScene = scene.getObjectById(spaceship.mesh.id);
  const rbIdx = rigidBodies.indexOf(spaceship.mesh);

  scene.remove(spaceshipInScene);
  //physicsWorld.destroy(spaceship.mesh.userData.body);

  if (rbIdx > -1) {
    rigidBodies.splice(rbIdx, 1);
  }
}

function removeObject(object, objectArr) {
  if (object) {
    const objectInScene = scene.getObjectById(object.mesh.id);
    const objectIdx = objectArr.indexOf(object);
    const rbIdx = rigidBodies.indexOf(object.mesh);

    object.mesh.geometry.dispose();
    object.mesh.material.dispose();
    scene.remove(objectInScene);
    //physicsWorld.destroy(object.mesh.userData.body)

    if (objectIdx > -1) {
      objectArr.splice(objectIdx, 1);
    }
    if (rbIdx > -1) {
      rigidBodies.splice(rbIdx, 1);
    }
  }
}

function createLaser() {
  let mass = 1;
  let laser1OriginX = spaceship.mesh.position.x + 7;
  let laserOriginY = spaceship.mesh.position.y + 45;
  let laser2OriginX = spaceship.mesh.position.x - 7;

  laser1 = new Laser();
  laser2 = new Laser();

  laser1.mesh.position.set(laser1OriginX, laserOriginY, 0);
  laser2.mesh.position.set(laser2OriginX, laserOriginY, 0);
  scene.add(laser1.mesh);
  scene.add(laser2.mesh);

  lasers.push(laser1);
  lasers.push(laser2);

  let transform1 = new AMMO.btTransform();
  transform1.setIdentity();
  transform1.setOrigin(
    new AMMO.btVector3(
      laser1.mesh.position.x,
      laser1.mesh.position.y,
      laser1.mesh.position.z
    )
  );
  transform1.setRotation(
    new AMMO.btQuaternion(
      laser1.mesh.quaternion.x,
      laser1.mesh.quaternion.y,
      laser1.mesh.quaternion.z,
      laser1.mesh.quaternion.w
    )
  );
  let motionState1 = new AMMO.btDefaultMotionState(transform1);

  let transform2 = new AMMO.btTransform();
  transform2.setIdentity();
  transform2.setOrigin(
    new AMMO.btVector3(
      laser2.mesh.position.x,
      laser2.mesh.position.y,
      laser2.mesh.position.z
    )
  );
  transform2.setRotation(
    new AMMO.btQuaternion(
      laser2.mesh.quaternion.x,
      laser2.mesh.quaternion.y,
      laser2.mesh.quaternion.z,
      laser2.mesh.quaternion.w
    )
  );
  let motionState2 = new AMMO.btDefaultMotionState(transform2);

  let colShape = new AMMO.btCylinderShape(
    new AMMO.btVector3(
      laser1.mesh.geometry.parameters.radiusTop,
      laser1.mesh.geometry.parameters.height * 0.5,
      laser1.mesh.geometry.parameters.radiusBottom
    )
  );
  colShape.setMargin(0.05);

  let localInertia = new AMMO.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo1 = new AMMO.btRigidBodyConstructionInfo(
    mass,
    motionState1,
    colShape,
    localInertia
  );

  let rbInfo2 = new AMMO.btRigidBodyConstructionInfo(
    mass,
    motionState2,
    colShape,
    localInertia
  );
  let body1 = new AMMO.btRigidBody(rbInfo1);
  let body2 = new AMMO.btRigidBody(rbInfo2);

  body1.setActivationState(STATE.DISABLE_DEACTIVATION);
  body1.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
  body2.setActivationState(STATE.DISABLE_DEACTIVATION);
  body2.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);

  physicsWorld.addRigidBody(body1);
  laser1.mesh.userData.physicsBody = body1;
  physicsWorld.addRigidBody(body2);
  laser2.mesh.userData.physicsBody = body2;

  rigidBodies.push(laser1.mesh);
  rigidBodies.push(laser2.mesh);

  body1.threeObject = laser1;
  body2.threeObject = laser2;

  laser1.mesh.userData.tag = "laser";
  laser2.mesh.userData.tag = "laser";

  renderer.render(scene, camera);
}

function loop() {
  if (spaceship) {
    let deltaTime = clock.getDelta();

    moveSpaceship();

    moveLaser();

    updatePhysics(deltaTime);

    // if (moveDirection.right === 1) {
    //   spaceship.mesh.position.x += 3;
    // }
    // if (moveDirection.left === 1) {
    //   spaceship.mesh.position.x -= 3;
    // }
    // if (moveDirection.forward === 1) {
    //   spaceship.mesh.position.y += 3;
    // }
    // if (moveDirection.back === 1) {
    //   spaceship.mesh.position.y -= 3;
    // }

    // render the sceneafdwad
    renderer.render(scene, camera);

    // collisions
    if (spaceship) {
      bBoxSpaceship = new THREE.Box3().setFromObject(spaceship.mesh);
      //console.log(bBoxSpaceship);
    }

    // Planet Movement
    planets.forEach((p) => {
      p.posOrNegX === 1
        ? (p.mesh.rotation.x += 0.01)
        : (p.mesh.rotation.x -= 0.01);
      // p.posOrNegY === 1 ? (p.mesh.rotation.y += 0.01) : (p.mesh.rotation.y -= 0.01);
      p.posOrNegZ === 1
        ? (p.mesh.rotation.z += 0.01)
        : (p.mesh.rotation.z -= 0.01);

      p.mesh.position.y -= 0.75;

      p.bBox = new THREE.Box3().setFromObject(p.mesh);
      //console.log(p.mesh.geometry.vertices)

      if (planets.length < 5 && counter % 240 === 0) {
        createPlanet();
        counter = 1;
      }

      if (
        p.mesh.position.y <= -250 ||
        p.mesh.position.y >= 250 ||
        p.mesh.position.z <= -5 ||
        p.mesh.position.z >= 5
      ) {
        removeObject(p, planets);
      }

      // if (bBoxSpaceship.intersectsBox(p.bBox)) {
      //   removeSpaceShip();
      // }
    });

    // Laser Movement
    lasers.forEach((l) => {
      l.mesh.position.y += 1;

      if (l.mesh.position.y >= 200) {
        removeObject(l, lasers);
      }
      l.bBox = new THREE.Box3().setFromObject(l.mesh);
    });

    // MOVE SPACE
    space.mesh.rotation.x -= 0.001;

    counter++;

    // call the loop function again
    requestId = requestAnimationFrame(loop);
  } else cancelAnimationFrame(requestId);
}

function moveLaser() {
  if (lasers.length > 0) {
    for (let l of lasers) {
      let scalingFactor = 0.3;

      let moveX = 0;
      let moveZ = 0;
      let moveY = 1;

      let translateFactor = tmpPos.set(moveX, moveY, moveZ);

      translateFactor.multiplyScalar(scalingFactor);

      l.mesh.translateX(translateFactor.x);
      l.mesh.translateY(translateFactor.y);
      l.mesh.translateZ(translateFactor.z);

      l.mesh.getWorldPosition(tmpPos);
      l.mesh.getWorldQuaternion(tmpQuat);

      let physicsBody = l.mesh.userData.physicsBody;

      let ms = physicsBody.getMotionState();
      if (ms) {
        ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
        ammoTmpQuat.setValue(tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

        tmpTrans.setIdentity();
        tmpTrans.setOrigin(ammoTmpPos);
        tmpTrans.setRotation(ammoTmpQuat);

        ms.setWorldTransform(tmpTrans);
      }
    }
  }
}

function detectCollision() {
  let dispatcher = physicsWorld.getDispatcher();
  let numManifolds = dispatcher.getNumManifolds();

  for (let i = 0; i < numManifolds; i++) {
    let contactManifold = dispatcher.getManifoldByIndexInternal(i);

    let rb0 = AMMO.castObject(contactManifold.getBody0(), AMMO.btRigidBody);
    let rb1 = AMMO.castObject(contactManifold.getBody1(), AMMO.btRigidBody);
    let threeObject0 = rb0.threeObject;
    let threeObject1 = rb1.threeObject;
    if (!threeObject0 && !threeObject1) continue;
    let userData0 = threeObject0 ? threeObject0.mesh.userData : null;
    let userData1 = threeObject1 ? threeObject1.mesh.userData : null;
    let tag0 = userData0 ? userData0.tag : "none";
    let tag1 = userData1 ? userData1.tag : "none";

    let numContacts = contactManifold.getNumContacts();

    for (let j = 0; j < numContacts; j++) {
      let contactPoint = contactManifold.getContactPoint(j);
      let distance = contactPoint.getDistance();

      if (distance > 0.0) continue;
      let velocity0 = rb0.getLinearVelocity();
      let velocity1 = rb1.getLinearVelocity();
      let worldPos0 = contactPoint.get_m_positionWorldOnA();
      let worldPos1 = contactPoint.get_m_positionWorldOnB();
      let localPos0 = contactPoint.get_m_localPointA();
      let localPos1 = contactPoint.get_m_localPointB();

      if (tag0 === "planet" && tag1 === "planet") {
        break;
      }

      console.log(rb0.threeObject, rb1.threeObject);

      switch (tag0) {
        case "laser":
          removeObject(threeObject0, lasers);
          break;
        case "planet":
          removeObject(threeObject0, planets);
          break;
        case "spaceship":
          removeSpaceShip();
          break;
      }
      switch (tag1) {
        case "laser":
          removeObject(threeObject1, lasers);
          break;
        case "planet":
          removeObject(threeObject1, planets);
          break;
        case "spaceship":
          removeSpaceShip();
          break;
      }
    }
  }
}

function moveSpaceship() {
  let scalingFactor = 0.3;

  let moveX = spaceshipMoveDirection.right - spaceshipMoveDirection.left;
  let moveZ = 0;
  let moveY = spaceshipMoveDirection.forward - spaceshipMoveDirection.back;

  let translateFactor = tmpPos.set(moveX, moveY, moveZ);

  translateFactor.multiplyScalar(scalingFactor);

  spaceship.mesh.translateX(translateFactor.x);
  spaceship.mesh.translateY(translateFactor.y);
  spaceship.mesh.translateZ(translateFactor.z);

  spaceship.mesh.getWorldPosition(tmpPos);
  spaceship.mesh.getWorldQuaternion(tmpQuat);

  let physicsBody = spaceship.mesh.userData.physicsBody;

  let ms = physicsBody.getMotionState();
  if (ms) {
    ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
    ammoTmpQuat.setValue(tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

    tmpTrans.setIdentity();
    tmpTrans.setOrigin(ammoTmpPos);
    tmpTrans.setRotation(ammoTmpQuat);

    ms.setWorldTransform(tmpTrans);
  }
}
