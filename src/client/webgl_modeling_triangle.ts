import { GUI } from '/jsm/libs/dat.gui.module'
import * as Helper from './helpers.js'

import * as THREE from '/build/three.module.js'

export const scene: THREE.Scene = new THREE.Scene()
export let gui: GUI

let mesh: THREE.Mesh
const geometry: THREE.Geometry =  new THREE.Geometry()
const material: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial()

init()

export function init(){
    var geometry = new THREE.Geometry();
    const v1 = new THREE.Vector3(0,0,0);
    const v2 = new THREE.Vector3(1,0,0);
    const v3 = new THREE.Vector3(1,1,0);
    
    geometry.vertices.push(v1)
    geometry.vertices.push(v2)
    geometry.vertices.push(v3)
    
    geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
    geometry.computeFaceNormals();
    
    mesh = new THREE.Mesh( geometry, material )

    scene.add(mesh)
}

export function createDatGUI(){
    gui = new GUI()
    Helper.createObjectGUIFolder(gui, mesh, "Triangle")
}

export function render(){
}
