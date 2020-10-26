import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'

export const scene: THREE.Scene = new THREE.Scene()

const LEG_WIDTH: number = 0.05;
const LEG_HEIGHT: number = 2;

const faceGeometry = new THREE.BoxGeometry(2, 0.2, 1)
const leg1Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32)
const leg2Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32)
const leg3Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32)
const leg4Geometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32)

let faceMesh: THREE.Mesh
let leg1Mesh: THREE.Mesh
let leg2Mesh: THREE.Mesh
let leg3Mesh: THREE.Mesh
let leg4Mesh: THREE.Mesh

let faceMaterial: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial()

init()

export function init() {
    faceMesh = new THREE.Mesh(faceGeometry, faceMaterial)
    leg1Mesh = new THREE.Mesh(leg1Geometry, faceMaterial)


    leg1Mesh.position.x = -1

    scene.add(faceMesh)
    scene.add(leg1Mesh)
}

export function render() {

}