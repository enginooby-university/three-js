import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
import * as THREE from '/build/three.module.js';
import { transformControls, attachToDragControls } from '../client.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
let triangle;
const geometry = new THREE.Geometry();
const material = new THREE.MeshNormalMaterial();
export function init() {
    isInitialized = true;
    scene.background = new THREE.Color(0x333333);
    var geometry = new THREE.Geometry();
    const v1 = new THREE.Vector3(0, 0, 0);
    const v2 = new THREE.Vector3(1, 0, 0);
    const v3 = new THREE.Vector3(1, 1, 0);
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    geometry.vertices.push(v3);
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.computeFaceNormals();
    triangle = new THREE.Mesh(geometry, material);
    scene.add(triangle);
    setupControls();
}
export function setupControls() {
    attachToDragControls([triangle]);
    transformControls.attach(triangle);
    // add to scene to display helpers
    scene.add(transformControls);
}
export function createDatGUI() {
    gui = new GUI();
    DatHelper.createObjectFolder(gui, triangle, "Triangle");
    DatHelper.createMaterialFolder(gui, material);
}
export function render() {
}
