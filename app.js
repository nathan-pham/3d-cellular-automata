import * as THREE from "three";
import { OrbitControls } from "three/OrbitControls";
import CellularAutomata from "./CellularAutomata.js";

// global variables
const width = innerWidth;
const height = innerHeight;
const aspectRatio = width / height;

// create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// create scene & camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
camera.position.z = 100;

const controls = new OrbitControls(camera, renderer.domElement);

const gridSize = 70;
const cellularAutomata = new CellularAutomata(gridSize, gridSize, gridSize);
cellularAutomata.addCellsTo(scene);

renderer.setAnimationLoop(() => {
    cellularAutomata.update();
    controls.update();
    renderer.render(scene, camera);
});
