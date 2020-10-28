import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as THREE from '/build/three.module.js'
import * as DatHelper from './dat_helper.js'

export const scene: THREE.Scene = new THREE.Scene()
export let gui: GUI

const LEG_WIDTH: number = 0.05
const LEG_HEIGHT: number = 1.5
const LEG_X: number = 0.8
const LEG_Z: number = 0.3
const FACE_WIDTH: number = 2
const FACE_HEIGHT: number = 0.2
const FACE_DEPTH: number = 0.5 * FACE_WIDTH

const faceGeometry = new THREE.BoxGeometry(FACE_WIDTH, FACE_HEIGHT, FACE_DEPTH)
const legGeometry = new THREE.CylinderGeometry(LEG_WIDTH, LEG_WIDTH, LEG_HEIGHT, 32)

const table = new THREE.Group()
let face: THREE.Mesh
let leg1: THREE.Mesh
let leg2: THREE.Mesh
let leg3: THREE.Mesh
let leg4: THREE.Mesh

init()

export function init() {
    face = createFace()
    leg1 = createLeg(0x00ff00, LEG_X, 0, LEG_Z)
    leg2 = createLeg(0xffff00, -LEG_X, 0, -LEG_Z)
    leg3 = createLeg(0x00fff0, LEG_X, 0, -LEG_Z)
    leg4 = createLeg(0xf000ff, -LEG_X, 0, LEG_Z)

    scene.background = new THREE.Color(0x333333)
    table.position.y = 0.8
    scene.add(table)
}

function createFace() {
    const face = new THREE.Mesh(faceGeometry, new THREE.MeshNormalMaterial())
    face.position.y = 0.8
    table.add(face)

    return face
}

function createLeg(color: string | number | THREE.Color, x: number, y: number, z: number) {
    const legMaterial = new THREE.MeshBasicMaterial({ color: color })
    const leg = new THREE.Mesh(legGeometry, legMaterial)
    leg.position.x = x
    leg.position.y = y
    leg.position.z = z
    table.add(leg)

    return leg
}

export function createDatGUI() {
    gui = new GUI()
    DatHelper.createObjectFolder(gui, table, "Table")
    DatHelper.createObjectFolder(gui, face, "Face")
    DatHelper.createObjectFolder(gui, leg1, "Leg 1")
    DatHelper.createObjectFolder(gui, leg1, "Leg 2")
    DatHelper.createObjectFolder(gui, leg1, "Leg 3")
    DatHelper.createObjectFolder(gui, leg1, "Leg 4")
}

export function render() {
    table.rotation.y += 0.01
}