import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'
import { OBJLoader } from '/jsm/loaders/OBJLoader.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string //= 'none'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

const directionalLight = new THREE.DirectionalLight()
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
// const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);

let plane: THREE.Mesh
const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 10)
const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })

const loadingManager = new THREE.LoadingManager(() => {
    hideLoadingScreen()
});
const objLoader = new OBJLoader(loadingManager);

export function init() {
    showLoadingScreen()
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    createLight()
    createFloor()
    setupControls()

    objLoader.load(
        './resources/models/tree.obj',
        (object) => {
            object.traverse(function (child) {
                if ((<THREE.Mesh>child).isMesh) {
                    const material: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial();
                    (<THREE.Mesh>child).castShadow = true;
                    (<THREE.Mesh>child).scale.set(0.005, 0.005, 0.005);
                    (<THREE.Mesh>child).material = material // create a material for each mesh
                    transformableObjects.push(<THREE.Mesh>child)
                }
            })
            scene.add(object);
        },
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
            console.log(error);
        }
    )

    // TODO: this will execute before model loaded => nothing is added to scene!
    // transformableObjects.forEach(child => {
    //     scene.add(child)
    // })
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI() {
    gui = new GUI()
}

export function render() {
}


function createLight() {
    directionalLight.position.set(4.5, 21, 13)
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.rotation.x = Math.PI / 2

    scene.add(directionalLight)
    // scene.add(directionalLightHelper)
    // scene.add(lightShadowHelper);
}

function createFloor() {
    planeMaterial.transparent = true
    plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotateX(-Math.PI / 2)
    plane.position.y = -0.01
    plane.receiveShadow = true;

    transformableObjects.push(plane)
    scene.add(plane)
}