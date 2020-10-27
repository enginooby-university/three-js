import * as THREE from '/build/three.module.js'
import * as Helper from './helpers.js'
import { GUI } from '/jsm/libs/dat.gui.module'


export const scene: THREE.Scene = new THREE.Scene()

export let gui: GUI
const table = new THREE.Group()

const LEG_WIDTH: number = 0.05
const LEG_HEIGHT: number = 1.5
const LEG_X: number = 0.8
const LEG_Z: number = 0.3

const faceGeometry = new THREE.BoxGeometry(2, 0.2, 1)
const legGeometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32)

let faceMesh: THREE.Mesh
let leg1Mesh: THREE.Mesh
let leg2Mesh: THREE.Mesh
let leg3Mesh: THREE.Mesh
let leg4Mesh: THREE.Mesh

const faceMaterial: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial()
const leg1Material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const leg2Material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const leg3Material = new THREE.MeshBasicMaterial({ color: 0x0f00f0 });
const leg4Material = new THREE.MeshBasicMaterial({ color: 0xf000ff });

init()

export function init() {
    faceMesh = new THREE.Mesh(faceGeometry, faceMaterial)
    leg1Mesh = new THREE.Mesh(legGeometry, leg1Material)
    leg2Mesh = new THREE.Mesh(legGeometry, leg2Material)
    leg3Mesh = new THREE.Mesh(legGeometry, leg3Material)
    leg4Mesh = new THREE.Mesh(legGeometry, leg4Material)

    faceMesh.position.y = 0.8
    leg1Mesh.position.x = LEG_X
    leg1Mesh.position.z = LEG_Z
    leg2Mesh.position.x = -LEG_X
    leg2Mesh.position.z = -LEG_Z
    leg3Mesh.position.x = -LEG_X
    leg3Mesh.position.z = LEG_Z
    leg4Mesh.position.x = LEG_X
    leg4Mesh.position.z = -LEG_Z

    table.add(faceMesh)
    table.add(leg1Mesh)
    table.add(leg2Mesh)
    table.add(leg3Mesh)
    table.add(leg4Mesh)

    table.position.y = 0.8

    scene.add(table)
}

export function createDatGUI(){
    gui = new GUI()
    Helper.createObjectGUIFolder(gui, table, "Table")
    Helper.createObjectGUIFolder(gui, leg1Mesh, "Leg 1")
    Helper.createObjectGUIFolder(gui, leg1Mesh, "Leg 2")
    Helper.createObjectGUIFolder(gui, leg1Mesh, "Leg 3")
    Helper.createObjectGUIFolder(gui, leg1Mesh, "Leg 4")
}

export function render() {
    table.rotation.y += 0.01
}
