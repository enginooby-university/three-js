import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as THREE from '/build/three.module.js';
import * as DatHelper from './dat_helper.js';
export const scene = new THREE.Scene();
export let gui;
const table = new THREE.Group();
const LEG_WIDTH = 0.05;
const LEG_HEIGHT = 1.5;
const LEG_X = 0.8;
const LEG_Z = 0.3;
const faceGeometry = new THREE.BoxGeometry(2, 0.2, 1);
const legGeometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32);
let face;
let leg1;
let leg2;
let leg3;
let leg4;
const faceMaterial = new THREE.MeshNormalMaterial();
const leg1Material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const leg2Material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const leg3Material = new THREE.MeshBasicMaterial({ color: 0x0f00f0 });
const leg4Material = new THREE.MeshBasicMaterial({ color: 0xf000ff });
init();
export function init() {
    scene.background = new THREE.Color(0x333333);
    face = new THREE.Mesh(faceGeometry, faceMaterial);
    leg1 = new THREE.Mesh(legGeometry, leg1Material);
    leg2 = new THREE.Mesh(legGeometry, leg2Material);
    leg3 = new THREE.Mesh(legGeometry, leg3Material);
    leg4 = new THREE.Mesh(legGeometry, leg4Material);
    face.position.y = 0.8;
    leg1.position.x = LEG_X;
    leg1.position.z = LEG_Z;
    leg2.position.x = -LEG_X;
    leg2.position.z = -LEG_Z;
    leg3.position.x = -LEG_X;
    leg3.position.z = LEG_Z;
    leg4.position.x = LEG_X;
    leg4.position.z = -LEG_Z;
    table.add(face);
    table.add(leg1);
    table.add(leg2);
    table.add(leg3);
    table.add(leg4);
    table.position.y = 0.8;
    scene.add(table);
}
export function createDatGUI() {
    gui = new GUI();
    DatHelper.createObjectFolder(gui, table, "Table");
    DatHelper.createObjectFolder(gui, leg1, "Leg 1");
    DatHelper.createObjectFolder(gui, leg1, "Leg 2");
    DatHelper.createObjectFolder(gui, leg1, "Leg 3");
    DatHelper.createObjectFolder(gui, leg1, "Leg 4");
}
export function render() {
    table.rotation.y += 0.01;
}
