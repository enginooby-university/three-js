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
const directionalLight = new THREE.DirectionalLight();
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
init();
export function init() {
    generateSkybox();
    physicalMaterial.metalness = 1;
    physicalMaterial.roughness = 0.6;
    physicalMaterial.transparent = true;
    createBall(-2, 1, 0);
    createBall(0, 1, 0);
    createBall(2, 1, 0);
    scene.add(directionalLight);
    scene.add(directionalLightHelper);
}
export function createDatGUI() {
    gui = new GUI();
    gui.add(Name, 'Skybox', options.skybox).onChange(() => generateSkybox());
    DatHelper.createPhysicalMaterialFolder(gui, physicalMaterial);
}
export function render() {
}
function createBall(x, y, z) {
    const newBall = new THREE.Mesh(sphereGeometry, physicalMaterial);
    newBall.position.x = x;
    newBall.position.y = y;
    newBall.position.z = z;
    scene.add(newBall);
    return newBall;
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
