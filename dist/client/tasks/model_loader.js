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
let addingMode = false; // if not adding model, don't recreate Dat GUI
let addModelController;
const loadingManager = new THREE.LoadingManager(() => {
    isLoaded = true;
    hideLoadingScreen();
    if (!addingMode) { // first loading when init the scene
        createDatGUI();
    }
    else { // add by Dat GUI
        switch (addModelController.getValue()) {
            case 'Monkey':
                addNewModelToGroupFolder(monkeys, monkeyFolder);
                break;
            case 'Tree':
                addNewModelToGroupFolder(trees, treeFolder);
                break;
        }
        addingMode = false; // indicate finish adding
    }
});
const mtlLoader = new MTLLoader(loadingManager); // common
let objLoader; // seperate object for different material
let trees = [];
const TREE_SCALE = 0.004;
let treeFolder;
let monkeys = [];
const MONKEY_SCALE = 1;
let monkeyFolder;
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
        const modelOptions = {
            Monkey: "Monkey",
            Tree: "Tree"
        };
        const selectModel = {
            name: "Tree"
        };
        const addModelFolder = gui.addFolder('Add model');
        addModelController = addModelFolder.add(selectModel, 'name', modelOptions).name('Select');
        addModelFolder.add(DatFunction, 'addModel').name('Click to add');
        addModelFolder.open();
        treeFolder = gui.addFolder('Trees');
        monkeyFolder = gui.addFolder('Monkeys');
        // TODO: Refactor this
        createGroupFolder(trees, treeFolder);
        createGroupFolder(monkeys, monkeyFolder);
    }
}
export function render() {
}
const DatFunction = {
    addModel: function () {
        addingMode = true;
        showLoadingScreen();
        switch (addModelController.getValue()) {
            case 'Monkey':
                loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 1, Math.floor(Math.random() * 5)));
                break;
            case 'Tree':
                loadMTLModel('tree', trees, TREE_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 0, Math.floor(Math.random() * 5)));
                break;
        }
    }
};
function createGroupFolder(group, groupFolder) {
    if (group.length) {
        for (let i = 0; i < group.length; i++) {
            const singularName = groupFolder.name.substring(0, groupFolder.name.length - 1);
            DatHelper.createObjectFolder(groupFolder, group[i], `${singularName} ${i + 1}`);
        }
    }
}
function addNewModelToGroupFolder(group, groupFolder) {
    const newModelIndex = group.length - 1;
    const singularName = groupFolder.name.substring(0, groupFolder.name.length - 1);
    DatHelper.createObjectFolder(groupFolder, group[newModelIndex], `${singularName} ${newModelIndex + 1}`);
}
function loadMTLModel(name, group, scale, position) {
    mtlLoader.load(`./resources/models/${name}.mtl`, (materials) => {
        materials.preload();
        objLoader = new OBJLoader(loadingManager);
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
