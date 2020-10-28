import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'

export const scene: THREE.Scene = new THREE.Scene()
export let gui: GUI

init()

export function init(){
    scene.background = new THREE.Color(0x333333)
}

export function createDatGUI(){
    gui = new GUI()
}

export function render(){
}
