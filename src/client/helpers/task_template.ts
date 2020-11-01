import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI

export function init(){
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    setupControls()
}

export function setupControls(){
    attachToDragControls([])
    // transformControls.attach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI(){
    gui = new GUI()
}

export function render(){
}
