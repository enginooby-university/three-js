import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
import * as THREE from '/build/three.module.js';
import { transformControls, attachToDragControls } from '../client.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
export let skybox = 'dust';
export const setSkybox = (name) => skybox = name;
// group of objects affected by DragControls & TransformControls
export let transformableObjects = [];
export let selectedObjectId = -1;
export const setSelectedObjectId = (index) => selectedObjectId = index;
const directionalLight = new THREE.DirectionalLight();
let plane;
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
let belt;
const beltParam = {
    length: 1.5,
    width: 4,
    toFloor: 1,
};
const beltGeometry = new THREE.PlaneGeometry(beltParam.width, beltParam.length);
const beltMaterial = new THREE.MeshPhysicalMaterial({ color: 0x48485c });
const BALL_RADIUS = 0.3;
const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
const ballMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 1,
    roughness: 0.6,
    transparent: true
});
let ball; // in vertical group
export function init() {
    isInitialized = true;
    scene.background = new THREE.Color(0x333333);
    createLight();
    createFloor();
    createBelt();
    createBall();
    transformableObjects.forEach(child => {
        scene.add(child);
    });
    setupControls();
    createDatGUI();
}
export function setupControls() {
    attachToDragControls(transformableObjects);
    transformControls.detach();
    // add to scene to display helpers
    scene.add(transformControls);
}
// const clock: THREE.Clock = new THREE.Clock()
export function render() {
    // ball is falling after appear
    if (ball.position.y > beltParam.toFloor + BALL_RADIUS && ball.position.x < beltParam.width / 2 + BALL_RADIUS) {
        ball.position.y -= 0.1;
        // ball is rotating on the belt
    }
    else if (ball.position.y <= beltParam.toFloor + BALL_RADIUS && ball.position.x < beltParam.width / 2 + BALL_RADIUS) {
        // ball.rotation.x += 0.01
        // update ball height when change beltToFloor dynamically
        ball.position.y = beltParam.toFloor + BALL_RADIUS;
        ball.position.x += 0.05;
        // ball is falling after leave the belt
    }
    else {
        ball.position.x += 0.03;
        ball.position.y -= 0.07;
    }
    // ball touch the floor
    if (ball.position.y <= BALL_RADIUS) {
        // reset ball position
        ball.position.set(-beltParam.width / 2 + BALL_RADIUS, 3, 0);
    }
}
function createDatGUI() {
    gui = new GUI();
    const beltFolder = gui.addFolder("Threadmill belt");
    beltFolder.add(beltParam, 'length', 1.5, 8, 0.1).onChange(value => belt.scale.y = value / 4);
    beltFolder.add(beltParam, 'width', 1, 8, 0.1).onChange(value => belt.scale.x = value / 4);
    beltFolder.add(beltParam, 'toFloor', 0.5, 3, 0.1).name('height').onChange(value => belt.position.y = value);
    DatHelper.createPhysicalMaterialFolder(beltFolder, beltMaterial);
    beltFolder.open();
    const ballFolder = gui.addFolder("Ball");
    DatHelper.createPhysicalMaterialFolder(ballFolder, ballMaterial);
    ballFolder.open();
}
function createBelt() {
    beltMaterial.transparent = true;
    belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.rotateX(-Math.PI / 2);
    belt.position.y = beltParam.toFloor;
    belt.receiveShadow = true;
    transformableObjects.push(belt);
    // scene.add(belt)
}
function createBall() {
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(-beltParam.width / 2 + BALL_RADIUS, 3, 0);
    ball.castShadow = true;
    transformableObjects.push(ball);
    return ball;
}
function createLight() {
    directionalLight.position.set(4.5, 21, 13);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.rotation.x = Math.PI / 2;
    scene.add(directionalLight);
}
function createFloor() {
    planeMaterial.transparent = true;
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    transformableObjects.push(plane);
    scene.add(plane);
}
