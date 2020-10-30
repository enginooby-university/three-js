import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
import * as THREE from '/build/three.module.js';
export const scene = new THREE.Scene();
export let gui;
const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox;
let texture_ft;
let texture_bk;
let texture_up;
let texture_dn;
let texture_rt;
let texture_lf;
let materialArray;
let Name = {
    Skybox: "arid"
};
const options = {
    skybox: {
        "Arid": "arid",
        "Cocoa": "cocoa",
        "Dust": "dust",
    }
};
const BALL_RADIUS = 0.5;
let sphereGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
let physicalMaterial = new THREE.MeshPhysicalMaterial({});
let ball1;
const directionalLight = new THREE.DirectionalLight();
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
let plane;
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
const ROPE_LENGHT = 3.5;
let rope1;
init();
export function init() {
    generateSkybox();
    physicalMaterial.metalness = 1;
    physicalMaterial.roughness = 0.6;
    physicalMaterial.transparent = true;
    ball1 = createBall(-(BALL_RADIUS * 2), 1, 0);
    createBall(0, 1, 0);
    createBall(BALL_RADIUS * 2, 1, 0);
    rope1 = createRope(-(BALL_RADIUS * 2), 5, 0);
    createRope(0, 5, 0);
    createRope((BALL_RADIUS * 2), 5, 0);
    directionalLight.position.set(4.5, 21, 13);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.rotation.x = Math.PI / 2;
    scene.add(directionalLight);
    scene.add(directionalLightHelper);
    scene.add(lightShadowHelper);
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    scene.add(plane);
}
export function createDatGUI() {
    gui = new GUI();
    gui.add(Name, 'Skybox', options.skybox).onChange(() => generateSkybox());
    DatHelper.createDirectionalLightFolder(gui, directionalLight);
    const ballFolder = gui.addFolder("Balls");
    DatHelper.createPhysicalMaterialFolder(ballFolder, physicalMaterial);
    DatHelper.createObjectFolder(gui, plane, 'Floor');
    // sphereGeometry.translate(0, ROPE_LENGHT / 2, 0)
    DatHelper.createObjectFolder(gui, ball1, "Ball 1");
    DatHelper.createObjectFolder(gui, rope1, "Rope 1");
}
export function render() {
    lightShadowHelper.update();
    // rope1.rotation.z += 0.01
}
function createBall(x, y, z) {
    const newBall = new THREE.Mesh(sphereGeometry, physicalMaterial);
    newBall.position.set(x, y, z);
    newBall.castShadow = true;
    scene.add(newBall);
    return newBall;
}
function createRope(x, y, z) {
    const ropeGeometry = new THREE.CylinderGeometry(0.03, 0.03, ROPE_LENGHT);
    ropeGeometry.translate(0, -ROPE_LENGHT / 2, 0);
    const ropeMaterial = new THREE.MeshBasicMaterial({ color: 0xA52A2A });
    const newRope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    // newRope.position.y = 1.5
    newRope.position.set(x, y, z);
    newRope.castShadow = true;
    scene.add(newRope);
    return newRope;
}
function generateSkybox() {
    loadTextures();
    loadMaterials();
    skybox = new THREE.Mesh(skyboxGeometry, materialArray);
    scene.remove(skybox);
    scene.add(skybox);
}
function loadMaterials() {
    materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));
    for (let i = 0; i < materialArray.length; i++) {
        materialArray[i].side = THREE.BackSide;
    }
}
function loadTextures() {
    texture_ft = new THREE.TextureLoader().load(getTexturePath('ft'));
    texture_bk = new THREE.TextureLoader().load(getTexturePath('bk'));
    texture_up = new THREE.TextureLoader().load(getTexturePath('up'));
    texture_dn = new THREE.TextureLoader().load(getTexturePath('dn'));
    texture_rt = new THREE.TextureLoader().load(getTexturePath('rt'));
    texture_lf = new THREE.TextureLoader().load(getTexturePath('lf'));
}
function getTexturePath(texturePosition) {
    return `./resources/textures/${Name.Skybox}/${Name.Skybox}_${texturePosition}.jpg`;
}
