import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as THREE from '/build/three.module.js';
export const scene = new THREE.Scene();
export let gui;
const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox;
let textureName;
let texture_ft;
let texture_bk;
let texture_up;
let texture_dn;
let texture_rt;
let texture_lf;
let materialArray = [];
init();
export function init() {
    textureName = 'arid';
    loadTextures();
    loadMaterials();
    skybox = new THREE.Mesh(skyboxGeometry, materialArray);
    scene.add(skybox);
}
function loadMaterials() {
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));
    for (let i = 0; i < materialArray.length; i++)
        materialArray[i].side = THREE.BackSide;
}
function loadTextures() {
    texture_ft = new THREE.TextureLoader().load(getTexturePath(textureName, 'ft'));
    texture_bk = new THREE.TextureLoader().load(getTexturePath(textureName, 'bk'));
    texture_up = new THREE.TextureLoader().load(getTexturePath(textureName, 'up'));
    texture_dn = new THREE.TextureLoader().load(getTexturePath(textureName, 'dn'));
    texture_rt = new THREE.TextureLoader().load(getTexturePath(textureName, 'rt'));
    texture_lf = new THREE.TextureLoader().load(getTexturePath(textureName, 'lf'));
}
function getTexturePath(textureName, texturePosition) {
    return `../resources/textures/${textureName}/${textureName}_${texturePosition}.jpg`;
}
export function createDatGUI() {
    gui = new GUI();
}
export function render() {
}
