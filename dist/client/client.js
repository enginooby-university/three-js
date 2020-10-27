import * as THREE from '/build/three.module.js';
import { Tasks } from './tasks.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
let camera;
let currentScene;
let currentSceneIndex = 0;
const canvas = document.getElementById("threejs-canvas");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
// const gui = new GUI()
let statsGUIs = [];
let controls;
let sourceLink;
/* HELPERS */
const AXE_LENGHT = 5;
const axesHelper = new THREE.AxesHelper(AXE_LENGHT);
const GRID_SIZE = 10;
const GRID_DIVISIONS = 10;
const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS);
let cameraHelper;
const SOURCE_LINK_BASE = 'https://github.com/enginoobz-university/three-js/tree/master/src/client/';
const STATS_WIDTH = '110%';
const STATS_HEIGHT = '110%';
init();
animate();
function init() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 5;
    camera.position.y = 3;
    camera.position.x = 3;
    // cameraHelper = new THREE.CameraHelper(camera)
    // Helper.createObjectGUIFolder(gui, camera, 'Camera')
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    createStatsGUI();
    // (Array.from(Tasks)[1][0].gui as GUI).destroy()
    switchScene(1);
}
function switchScene(scenceIndex) {
    // destroy Dat GUI for previous scene (if it exists)
    if (typeof (Array.from(Tasks)[currentSceneIndex][0].gui) !== 'undefined') {
        Array.from(Tasks)[currentSceneIndex][0].gui.destroy();
    }
    currentSceneIndex = scenceIndex;
    // create Dat GUI for current scene
    Array.from(Tasks)[currentSceneIndex][0].createDatGUI();
    currentScene = Array.from(Tasks)[currentSceneIndex][0].scene;
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[currentSceneIndex][1];
    currentScene.add(axesHelper);
    currentScene.add(gridHelper);
    // currentScene.add(cameraHelper)
}
function createStatsGUI() {
    for (let i = 0; i < 3; i++) {
        const statsGUI = Stats();
        statsGUI.showPanel(i); // 0: fps, 1: ms, 2: mb, 3+: custom
        statsGUI.dom.style.top = `${60 * i + 50}px`;
        statsGUIs.push(statsGUI);
        document.body.appendChild(statsGUI.dom);
        const children = statsGUI.dom.childNodes;
        children.forEach(child => {
            child.style.width = STATS_WIDTH;
            child.style.height = STATS_HEIGHT;
        });
    }
}
function animate() {
    requestAnimationFrame(animate);
    render();
    // controls.update()
    for (let i = 0; i < statsGUIs.length; i++) {
        statsGUIs[i].update();
    }
}
function render() {
    Array.from(Tasks)[currentSceneIndex][0].render();
    renderer.render(currentScene, camera);
}
/* EVENTS */
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // render()
}
/* Buttons to handle scene switch */
const taskButtons = document.querySelectorAll(".task");
for (let i = 0; i < taskButtons.length; i++) {
    taskButtons[i].addEventListener('click', function () {
        switchScene(i);
    });
}
const sourceButton = document.getElementById('source-link');
sourceButton.onclick = function () {
    window.open(sourceLink, '_blank');
};
/* END EVENTS */
