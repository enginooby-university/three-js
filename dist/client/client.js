import * as THREE from '/build/three.module.js';
import { Tasks } from './task_management.js';
import { OrbitControls } from '/jsm/controls/OrbitControls.js';
import Stats from '/jsm/libs/stats.module.js';
import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from './helpers/dat_helper.js';
import { VRButton } from '/jsm/webxr/VRButton.js';
let camera;
const CAMERA_FOV = 50; //degrees
const CAMERA_NEAR = 0.001;
const CAMERA_FAR = 1000;
let pause = false;
let currentScene;
let currentSceneIndex = 0;
const canvas = document.getElementById("threejs-canvas");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
const gui = new GUI();
let statsGUIs = [];
let controls;
let sourceLink;
const vrButton = VRButton.createButton(renderer);
const SOURCE_LINK_BASE = 'https://github.com/enginoobz-university/three-js/tree/master/src/client/tasks/';
const STATS_WIDTH = '100%';
const STATS_HEIGHT = '100%';
/* HELPERS */
const AXE_LENGHT = 5;
const axesHelper = new THREE.AxesHelper(AXE_LENGHT);
const GRID_SIZE = 10;
const GRID_DIVISIONS = 10;
const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS);
let cameraHelper;
init();
animate();
function init() {
    camera = createCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.outputEncoding = THREE.sRGBEncoding
    renderer.xr.enabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    //document.body.appendChild(renderer.domElement)
    document.body.appendChild(vrButton);
    vrButton.style.marginBottom = "80px";
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 300;
    createStatsGUI();
    switchScene(2);
    createHelperGUIFolder();
    DatHelper.createCameraFolder(gui, camera, 'Perspective Camera');
}
function createCamera() {
    const newCamera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR);
    newCamera.position.set(6, 6, 10);
    cameraHelper = new THREE.CameraHelper(newCamera);
    cameraHelper.visible = false;
    return newCamera;
}
function createHelperGUIFolder() {
    const helperFolder = gui.addFolder("Helpers");
    helperFolder.addFolder("Axes").add(axesHelper, "visible", true);
    helperFolder.addFolder("Grid").add(gridHelper, "visible", true);
    helperFolder.addFolder("Camera").add(cameraHelper, "visible", false);
    helperFolder.open();
    return helperFolder;
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
    // update source link corresponding to current task (scene)
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[currentSceneIndex][1];
    currentScene.add(axesHelper);
    currentScene.add(gridHelper);
    currentScene.add(cameraHelper);
}
function createStatsGUI() {
    for (let i = 0; i < 3; i++) {
        const statsGUI = Stats();
        statsGUI.showPanel(i); // 0: fps, 1: ms, 2: mb, 3+: custom
        statsGUI.dom.style.top = `${60 * i + 100}px`;
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
    if (renderer.xr.isPresenting) {
        renderer.setAnimationLoop(animate);
    }
    else {
        requestAnimationFrame(animate);
    }
    render();
    // controls.update()
    for (let i = 0; i < statsGUIs.length; i++) {
        statsGUIs[i].update();
    }
}
function render() {
    // only pause updating not rendering
    if (!pause) {
        Array.from(Tasks)[currentSceneIndex][0].render();
    }
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
const description = document.querySelector("#info");
for (let i = 0; i < taskButtons.length; i++) {
    taskButtons[i].addEventListener('click', function () {
        description.innerHTML = taskButtons[i].innerHTML;
        switchScene(i);
    });
}
/* END EVENTS */
/* BUTTONS */
const sourceButton = document.getElementById('source-link');
sourceButton.onclick = function () {
    window.open(sourceLink, '_blank');
};
const captureButton = document.querySelector('#screenshot');
captureButton.addEventListener('click', () => {
    render();
    canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
});
const saveBlob = (function () {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
    };
}());
const pauseButton = document.querySelector("#pause");
const pauseIcon = document.querySelector('#pause-icon');
pauseButton.addEventListener('click', function () {
    pauseIcon.classList.toggle('fa-pause');
    pauseIcon.classList.toggle('fa-play');
    pause = !pause;
});
/* SIDEBAR STUFFS*/
const sidebarOpenButton = document.querySelector(".openbtn");
sidebarOpenButton.addEventListener('click', openNav, false);
const sidebarCloseButton = document.querySelector(".closebtn");
sidebarCloseButton.addEventListener('click', closeNav, false);
const sidebarElement = document.getElementById("mySidebar");
const mainElement = document.getElementById("main");
function openNav() {
    sidebarElement.style.width = "250px";
    mainElement.style.marginLeft = "250px";
    statsGUIs.forEach(stat => {
        stat.dom.style.marginLeft = "250px";
    });
}
openNav();
function closeNav() {
    sidebarElement.style.width = "0";
    mainElement.style.marginLeft = "0";
    statsGUIs.forEach(stat => {
        stat.dom.style.marginLeft = "0";
    });
}
