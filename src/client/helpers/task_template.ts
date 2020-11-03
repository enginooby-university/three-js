import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string //= 'none'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

export function init(){
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    setupControls()
    transformableObjects.forEach(child => {
        scene.add(child)
    })
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI(){
    gui = new GUI()
}

export function render(){
}
