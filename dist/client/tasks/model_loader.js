import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
import * as THREE from '/build/three.module.js';
import { transformControls, attachToDragControls, hideLoadingScreen, showLoadingScreen } from '../client.js';
import { OBJLoader } from '/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '/jsm/loaders/MTLLoader.js';
import { Vector3 } from '/build/three.module.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
export let skybox; //= 'none'
export const setSkybox = (name) => skybox = name;
// group of objects affected by DragControls & TransformControls
export let transformableObjects = [];
export let selectedObjectId = -1;
export const setSelectedObjectId = (index) => selectedObjectId = index;
const directionalLight = new THREE.DirectionalLight();
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
// const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
let plane;
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
let isLoaded = false;
const loadingManager = new THREE.LoadingManager(() => {
    isLoaded = true;
    hideLoadingScreen();
    createDatGUI();
});
let trees = [];
const TREE_SCALE = 0.004;
let monkeys = [];
const MONKEY_SCALE = 1;
export function init() {
    showLoadingScreen();
    isInitialized = true;
    scene.background = new THREE.Color(0x333333);
    createLight();
    createFloor();
    setupControls();
    loadMTLModel('tree', trees, TREE_SCALE, new Vector3(-2, 0, 2));
    loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(2, 1, 2));
    // TODO: this will execute before model loaded => nothing is added to scene!
    // transformableObjects.forEach(child => {
    //     scene.add(child)
    // })
}
export function setupControls() {
    attachToDragControls(transformableObjects);
    transformControls.detach();
    // add to scene to display helpers
    scene.add(transformControls);
}
export function createDatGUI() {
    if (isLoaded) {
        gui = new GUI();
        // TODO: Refactor this
        createGroupFolder('Trees', trees);
        createGroupFolder('Monkeys', monkeys);
    }
}
export function render() {
}
function createGroupFolder(name, group) {
    if (group.length) {
        const groupFolder = gui.addFolder(name);
        for (let i = 0; i < group.length; i++) {
            const singularName = name.substring(0, name.length - 1);
            DatHelper.createObjectFolder(groupFolder, group[i], `${singularName} ${i + 1}`);
        }
    }
}
function loadMTLModel(name, group, scale, position) {
    const mtlLoader = new MTLLoader(loadingManager);
    mtlLoader.load(`./resources/models/${name}.mtl`, (materials) => {
        materials.preload();
        const objLoader = new OBJLoader(loadingManager);
        objLoader.setMaterials(materials);
        objLoader.load(`./resources/models/${name}.obj`, (object) => {
            object.traverse(function (child) {
                if (child.isMesh) {
                    // const material: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial();
                    // (<THREE.Mesh>child).material = material // create a material for each mesh
                    child.castShadow = true;
                    child.scale.set(scale, scale, scale);
                    child.position.set(position.x, position.y, position.z);
                    transformableObjects.push(child);
                }
            });
            scene.add(object);
            group.push(object);
        }, (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        }, (error) => {
            console.log(error);
        });
    }, (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% materials loaded');
    }, (error) => {
        console.log('An error happened');
    });
}
function createLight() {
    directionalLight.position.set(4.5, 21, 13);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.rotation.x = Math.PI / 2;
    scene.add(directionalLight);
    // scene.add(directionalLightHelper)
    // scene.add(lightShadowHelper);
}
function createFloor() {
    planeMaterial.transparent = true;
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    plane.scale.set(1.5, 1.5, 1.5);
    transformableObjects.push(plane);
    scene.add(plane);
}
