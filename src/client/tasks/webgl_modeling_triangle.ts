import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string //= 'none'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

let triangle: THREE.Mesh
const geometry: THREE.Geometry = new THREE.Geometry()
const material: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial()

export function init() {
    isInitialized = true

    scene.background = new THREE.Color(0x333333)

    var geometry = new THREE.Geometry();
    const v1 = new THREE.Vector3(0, 0, 0);
    const v2 = new THREE.Vector3(1, 0, 0);
    const v3 = new THREE.Vector3(1, 1, 0);

    geometry.vertices.push(v1)
    geometry.vertices.push(v2)
    geometry.vertices.push(v3)

    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.computeFaceNormals();

    material.transparent = true
    triangle = new THREE.Mesh(geometry, material)

    transformableObjects.push(triangle)
    setupControls()
    transformableObjects.forEach(child => scene.add(child))
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI() {
    gui = new GUI()
    gui.width = 232

    DatHelper.createObjectFolder(gui, triangle, "Triangle")
    DatHelper.createMaterialFolder(gui, material)
}

export function render() {
}
