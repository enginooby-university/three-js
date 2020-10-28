import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as THREE from '/build/three.module.js';
import * as DatHelper from './dat_helper.js';
export const scene = new THREE.Scene();
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
const table = new THREE.Group();
let face;
let leg1;
let leg2;
let leg3;
let leg4;
init();
export function init() {
    face = createFace();
    leg1 = createLeg(0x00ff00, LEG_X, 0, LEG_Z);
    leg2 = createLeg(0xffff00, -LEG_X, 0, -LEG_Z);
    leg3 = createLeg(0x00fff0, LEG_X, 0, -LEG_Z);
    leg4 = createLeg(0xf000ff, -LEG_X, 0, LEG_Z);
    scene.background = new THREE.Color(0x333333);
    table.position.y = 0.8;
    scene.add(table);
}
function createFace() {
    const face = new THREE.Mesh(faceGeometry, new THREE.MeshNormalMaterial());
    face.position.y = 0.8;
    table.add(face);
    return face;
}
function createLeg(color, x, y, z) {
    const legMaterial = new THREE.MeshBasicMaterial({ color: color });
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.x = x;
    leg.position.y = y;
    leg.position.z = z;
    table.add(leg);
    return leg;
}
export function createDatGUI() {
    gui = new GUI();
    DatHelper.createObjectFolder(gui, table, "Table");
    DatHelper.createObjectFolder(gui, face, "Face");
    DatHelper.createObjectFolder(gui, leg1, "Leg 1");
    DatHelper.createObjectFolder(gui, leg1, "Leg 2");
    DatHelper.createObjectFolder(gui, leg1, "Leg 3");
    DatHelper.createObjectFolder(gui, leg1, "Leg 4");
}
export function render() {
    table.rotation.y += 0.01;
}
