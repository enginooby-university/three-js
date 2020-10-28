import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'

export const scene: THREE.Scene = new THREE.Scene()
export let gui: GUI

const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox: THREE.Mesh

let textureName: string
let texture_ft: THREE.Texture
let texture_bk: THREE.Texture
let texture_up: THREE.Texture
let texture_dn: THREE.Texture
let texture_rt: THREE.Texture
let texture_lf: THREE.Texture

let materialArray: THREE.Material[] = [];

init()

export function init() {
    textureName = 'arid'
    loadTextures()
    loadMaterials()
    skybox = new THREE.Mesh(skyboxGeometry, materialArray);
    scene.add(skybox);
}

function loadMaterials() {
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }))

    for (let i = 0; i < materialArray.length; i++)
        materialArray[i].side = THREE.BackSide
}

function loadTextures() {
    texture_ft = new THREE.TextureLoader().load(getTexturePath(textureName, 'ft'))
    texture_bk = new THREE.TextureLoader().load(getTexturePath(textureName, 'bk'))
    texture_up = new THREE.TextureLoader().load(getTexturePath(textureName, 'up'))
    texture_dn = new THREE.TextureLoader().load(getTexturePath(textureName, 'dn'))
    texture_rt = new THREE.TextureLoader().load(getTexturePath(textureName, 'rt'))
    texture_lf = new THREE.TextureLoader().load(getTexturePath(textureName, 'lf'))
}

function getTexturePath(textureName: string, texturePosition: string) {
    return `../resources/textures/${textureName}/${textureName}_${texturePosition}.jpg`
}

export function createDatGUI() {
    gui = new GUI()
}

export function render() {
}
