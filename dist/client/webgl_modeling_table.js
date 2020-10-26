import * as THREE from '/build/three.module.js';
export const scene = new THREE.Scene();
const LEG_WIDTH = 0.05;
const LEG_HEIGHT = 2;
const faceGeometry = new THREE.BoxGeometry(2, 0.2, 1);
const leg1Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32);
const leg2Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32);
const leg3Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32);
const leg4Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32);
let faceMesh;
let leg1Mesh;
let leg2Mesh;
let leg3Mesh;
let leg4Mesh;
let faceMaterial = new THREE.MeshNormalMaterial();
init();
export function init() {
    faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
    leg1Mesh = new THREE.Mesh(leg1Geometry, faceMaterial);
    leg1Mesh.position.x = -1;
    scene.add(faceMesh);
    scene.add(leg1Mesh);
}
export function render() {
}
