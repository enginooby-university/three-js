import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'

export const scene: THREE.Scene = new THREE.Scene()
export let gui: GUI

const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox: THREE.Mesh

let texture_ft: THREE.Texture
let texture_bk: THREE.Texture
let texture_up: THREE.Texture
let texture_dn: THREE.Texture
let texture_rt: THREE.Texture
let texture_lf: THREE.Texture

let materialArray: THREE.MeshBasicMaterial[]

let Name = {
    Skybox: "arid"
}

const options = {
    skybox: {
        "Arid": "arid",
        "Cocoa": "cocoa",
        "Dust": "dust",
    }
}

const BALL_RADIUS: number = 0.5
let sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64)
let physicalMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({})

const directionalLight = new THREE.DirectionalLight()
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);

let plane: THREE.Mesh
const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 10)
const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({color: 0xdddddd})

init()

export function init() {
    generateSkybox()

    physicalMaterial.metalness = 1
    physicalMaterial.roughness = 0.6
    physicalMaterial.transparent = true
    createBall(-2, 1, 0)
    createBall(0, 1, 0)
    createBall(2, 1, 0)

    directionalLight.position.set(4.5, 21, 13)
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.rotation.x = Math.PI / 2

    scene.add(directionalLight)
    scene.add(directionalLightHelper)
    scene.add(lightShadowHelper);

    plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotateX(-Math.PI / 2)
    plane.position.y = -0.01
    plane.receiveShadow = true;
    scene.add(plane)
}

export function createDatGUI() {
    gui = new GUI()
    gui.add(Name, 'Skybox', options.skybox).onChange(() => generateSkybox())
    DatHelper.createDirectionalLightFolder(gui, directionalLight)
    const ballFolder: GUI = gui.addFolder("Balls")
    DatHelper.createPhysicalMaterialFolder(ballFolder, physicalMaterial)
    DatHelper.createObjectFolder(gui, plane, 'Floor')   
}

export function render() {
    lightShadowHelper.update()

}

function createBall(x: number, y: number, z: number) {
    const newBall: THREE.Mesh = new THREE.Mesh(sphereGeometry, physicalMaterial)
    newBall.position.x = x
    newBall.position.y = y
    newBall.position.z = z
    newBall.castShadow = true

    scene.add(newBall)

    return newBall
}

function generateSkybox() {
    loadTextures()
    loadMaterials()
    skybox = new THREE.Mesh(skyboxGeometry, materialArray)
    scene.remove(skybox)
    scene.add(skybox)
}

function loadMaterials() {
    materialArray = []
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }))

    for (let i = 0; i < materialArray.length; i++) {
        materialArray[i].side = THREE.BackSide
    }
}

function loadTextures() {
    texture_ft = new THREE.TextureLoader().load(getTexturePath('ft'))
    texture_bk = new THREE.TextureLoader().load(getTexturePath('bk'))
    texture_up = new THREE.TextureLoader().load(getTexturePath('up'))
    texture_dn = new THREE.TextureLoader().load(getTexturePath('dn'))
    texture_rt = new THREE.TextureLoader().load(getTexturePath('rt'))
    texture_lf = new THREE.TextureLoader().load(getTexturePath('lf'))
}

function getTexturePath(texturePosition: string) {
    return `./resources/textures/${Name.Skybox}/${Name.Skybox}_${texturePosition}.jpg`
}
