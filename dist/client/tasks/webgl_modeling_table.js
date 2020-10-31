import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as THREE from '/build/three.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
const LEG_WIDTH = 0.05;
const LEG_HEIGHT = 1.5;
const LEG_X = 0.8;
const LEG_Z = 0.3;
const FACE_WIDTH = 2;
const FACE_HEIGHT = 0.2;
const FACE_DEPTH = 0.5 * FACE_WIDTH;
const faceGeometry = new THREE.BoxGeometry(FACE_WIDTH, FACE_HEIGHT, FACE_DEPTH);
const legGeometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32);
let faceMaterial;
let leg1Material;
let leg2Material;
let leg3Material;
let leg4Material;
const table = new THREE.Group();
let face;
let leg1;
let leg2;
let leg3;
let leg4;
export function init() {
    isInitialized = true;
    face = createFace();
    leg1 = createLeg(0x00ff00, leg1Material, LEG_X, 0, LEG_Z);
    leg2 = createLeg(0xffff00, leg2Material, -LEG_X, 0, -LEG_Z);
    leg3 = createLeg(0x00fff0, leg3Material, LEG_X, 0, -LEG_Z);
    leg4 = createLeg(0xf000ff, leg4Material, -LEG_X, 0, LEG_Z);
    scene.background = new THREE.Color(0x333333);
    table.position.y = 0.8;
    scene.add(table);
}
function createFace() {
    faceMaterial = new THREE.MeshNormalMaterial();
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.y = 0.8;
    table.add(face);
    return face;
}
function createLeg(color, material, x, y, z) {
    material = new THREE.MeshBasicMaterial({ color: color });
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.x = x;
    leg.position.y = y;
    leg.position.z = z;
    table.add(leg);
    return leg;
}
export function createDatGUI() {
    gui = new GUI();
    DatHelper.createObjectFolder(gui, table, "Table");
    const faceFolder = DatHelper.createObjectFolder(gui, face, "Face");
    const leg1Folder = DatHelper.createObjectFolder(gui, leg1, "Leg 1");
    const leg2Folder = DatHelper.createObjectFolder(gui, leg2, "Leg 2");
    const leg3Folder = DatHelper.createObjectFolder(gui, leg3, "Leg 3");
    const leg4Folder = DatHelper.createObjectFolder(gui, leg4, "Leg 4");
    if (typeof leg1Material !== 'undefined') {
        DatHelper.createMaterialFolder(leg1Folder, leg1Material);
        DatHelper.createMaterialFolder(leg2Folder, leg2Material);
        DatHelper.createMaterialFolder(leg3Folder, leg3Material);
        DatHelper.createMaterialFolder(leg4Folder, leg4Material);
    }
}
export function render() {
    table.rotation.y += 0.01;
}
