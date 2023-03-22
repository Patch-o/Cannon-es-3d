import * as THREE from "three";
import * as CANNON from 'cannon-es';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

const renderer = new THREE.WebGL1Renderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.5,
  4000
);

const orbit = new OrbitControls(camera, renderer.domElement);

camera.position.set(10, 0, 2);
orbit.update();

const light = new THREE.PointLight("white", 2);
scene.add(light);
light.position.set(0, 100, 0);

const lightRef = new THREE.PointLightHelper(light, 10, "#a5b819");
scene.add(lightRef);

//DECLARAMOS OBJETOS RENDERIZADOS*

//suelo
const groundGeo = new THREE.BoxGeometry(500, 500, 0.2);
const groundMat = new THREE.MeshStandardMaterial({
  wireframe: false,
  color: "#c94f4f",
  side: THREE.DoubleSide,
  emissive: true,
  metalness: 0.79,
  roughness: 0.02,
  vertexColors: false,
  alphaTest: 0.1,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
scene.add(ground);

//objetos-> repetimos en cannon

//caja
const boxGeo = new THREE.BoxGeometry(5, 5, 5);
const boxMat = new THREE.MeshPhysicalMaterial({
  wireframe: false,
  // side: THREE.DoubleSide,
  color: "#2e563f",
  metalness: 1,
  reflectivity: 10,
  roughness: 0.2,
});
const box = new THREE.Mesh(boxGeo, boxMat);
scene.add(box);

//pelota
const sphereGeo = new THREE.SphereGeometry(5);
const sphereMat = new THREE.MeshPhysicalMaterial({
  wireframe: false,
  // side: THREE.DoubleSide,
  color: "#2e563f",
  metalness: 0.2,
  reflectivity: 10,
  roughness: 0.02,
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

//DECLARAMOS EL MUNDO FISICO =>cannon XD
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0.002, -9.81, 0),
});

//INTRODUCIMOS OBJETOS FISICOS en relacion a los renderizados*

//suelo

//suelo:material props
const groundPhysMat = new CANNON.Material();

const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(250, 250, 0.1)),
  //mass: 0
  type: CANNON.Body.STATIC,
  material: groundPhysMat,
});
world.addBody(groundBody);
// suelo infinito⤴️ cambiado a caja fina para hacer d suelo real

//TODO CAMBIO DE ROTACION'y posicion creo...' SE DECLARA EN CANNON Y THREE COPIA
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

//caja
const boxPhysMat = new CANNON.Material();

const boxBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5)),
  position: new CANNON.Vec3(5, 120, 0),
  material: boxPhysMat,
});
world.addBody(boxBody);

//REACCION MATERIALES 'caja=>plano'
const groundBoxCollis = new CANNON.ContactMaterial(groundPhysMat, boxPhysMat, {
  friction: 0.0002,
  restitution: 0.5,
});
world.addContactMaterial(groundBoxCollis);

//declaramos rotacion y rozamiento
boxBody.angularVelocity.set(2, 4, 1);
boxBody.angularDamping = 0.2;

//pelota
const spherePhysMat = new CANNON.Material();

const sphereBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(5),
  position: new CANNON.Vec3(10, 90, 0),
  material: spherePhysMat,
});
world.addBody(sphereBody);

//REACCION BOLA PLANO
const groundSphereCollis = new CANNON.ContactMaterial(
  groundPhysMat,
  spherePhysMat,
  {
    restitution: 0.9,
    friction: 1,
  }
);
world.addContactMaterial(groundSphereCollis);

//Para simular rozamiento
sphereBody.linearDamping = 0.2;

//DECLARAMOS EL TIEMPO
const timeStep = 1 / 60;

//////////////////NUEVO TUTO: CREAR BOLAS AL CLICK//////////////////////////////

//DECLARACION DE VARIABLES

const mouse = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", function (e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  planeNormal.copy(camera.position).normalize();
  plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, intersectionPoint);
});

window.addEventListener("click", function (e) {
  const bouncyGeo = new THREE.SphereGeometry(2);
  const bouncyMat = new THREE.MeshStandardMaterial({
    color: "#a5b819",
    roughness: 0.2,
    metalness: 0.5,
  });
  const bouncy = new THREE.Mesh(bouncyGeo, bouncyMat);
  scene.add(bouncy);
  bouncy.position.copy(intersectionPoint);

  const bouncyBody = new CANNON.Body({
    mass: 1,
    shape: CANNON.Sphere(2),
  });
  world.addBody(bouncyBody);
});

function animate() {
  world.step(timeStep);

  //FUSIONAMOS MESH Y CUERPO FISICO
  //SETTING POSITION OF THE MESH BY COPYING POSITION OF THE BODY

  //suelo
  ground.position.copy(groundBody.position);
  //sets and keeps updating the position of the mesh by coping the orientation of the body
  ground.quaternion.copy(groundBody.quaternion);

  //caja
  box.position.copy(boxBody.position);
  box.quaternion.copy(boxBody.quaternion);

  //pelota
  sphere.position.copy(sphereBody.position);
  sphere.quaternion.copy(sphereBody.quaternion);

  // light.position.x += Math.sin(Math.abs(time/1000));
  // light.position.z -= Math.cos(Math.abs(time/1000));
  // light.position.z -= Math.cos(time/20);

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
