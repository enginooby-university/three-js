import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as THREE from '/build/three.module.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
export function init() {
    isInitialized = true;
    scene.background = new THREE.Color(0x333333);
}
export function createDatGUI() {
    gui = new GUI();
}
export function render() {
}
