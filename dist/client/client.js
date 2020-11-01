import * as THREE from '/build/three.module.js';
import { Tasks } from './task_management.js';
import { OrbitControls } from '/jsm/controls/OrbitControls.js';
import Stats from '/jsm/libs/stats.module.js';
import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from './helpers/dat_helper.js';
import { VRButton } from '/jsm/webxr/VRButton.js';
import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';
// import { BloomPass } from '/jsm/postprocessing/BloomPass.js'
import { FilmPass } from '/jsm/postprocessing/FilmPass.js';
import { SMAAPass } from '/jsm/postprocessing/SMAAPass.js';
let camera;
const CAMERA_FOV = 50; //degrees
const CAMERA_NEAR = 0.001;
const CAMERA_FAR = 1000;
let pause = false;
export let muted = true;
let currentScene;
let currentSceneIndex = 0;
const canvas = document.getElementById("threejs-canvas");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
let composer;
// let bloomPass: BloomPass
let filmPass;
const gui = new GUI();
let postProcessingFolder = gui.addFolder("Post processing");
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
const Data = {
    BloomPass: {
        opacity: 1
    },
    FilmPass: {
        grayscale: 0,
        nIntensity: 0,
        sIntensity: 0,
        sCount: 0
    },
};
init();
animate();
function init() {
    camera = createCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.outputEncoding = THREE.sRGBEncoding
    renderer.xr.enabled = true;
    document.body.appendChild(vrButton);
    vrButton.style.marginBottom = "80px";
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    //document.body.appendChild(renderer.domElement)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 300;
    createStatsGUI();
    createHelperGUIFolder();
    DatHelper.createCameraFolder(gui, camera, 'Perspective Camera');
    switchScene(2);
    // createPostProcessingFolder()
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
function createPostProcessingFolder() {
    // gui.removeFolder(bloomFolder)
    // const newBloomPassFolder = gui.addFolder('BloomPass');
    // newBloomPassFolder.add((<any>bloomPass.copyUniforms).opacity, 'value', 0, 2).name('strength').onChange((value) => {
    //     Data.BloomPass.opacity = value
    // })
    // // TODO: update other properties of bloomPass
    // // newBloomPassFolder.add(bloomPass, 'resolution', 1, 256, 1)
    // newBloomPassFolder.open();
    // bloomFolder = newBloomPassFolder
    gui.removeFolder(postProcessingFolder);
    postProcessingFolder = gui.addFolder("Post processing");
    const newFilmPassFolder = postProcessingFolder.addFolder('FilmPass');
    newFilmPassFolder.add(filmPass.uniforms.grayscale, 'value', 0, 1, 1).name('grayscale').onChange((value) => Data.FilmPass.grayscale = value);
    newFilmPassFolder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity').onChange((value) => Data.FilmPass.nIntensity = value);
    // TODO: no-impact properties???
    // newFilmPassFolder.add((<any>filmPass.uniforms).sIntensity, 'value', 0, 1).name('scanline intensity').onChange((value) => Data.FilmPass.sIntensity = value)
    // newFilmPassFolder.add((<any>filmPass.uniforms).sCount, 'value', 0, 1000).name('scanline count').onChange((value) => Data.FilmPass.sCount = value)
    newFilmPassFolder.open();
    postProcessingFolder.open();
}
function switchScene(scenceIndex) {
    const currentTask = Array.from(Tasks)[scenceIndex][0];
    if (!currentTask.isInitialized) {
        currentTask.init();
    }
    // destroy Dat GUI for previous scene (if it exists)
    if (typeof (Array.from(Tasks)[currentSceneIndex][0].gui) !== 'undefined') {
        Array.from(Tasks)[currentSceneIndex][0].gui.destroy();
    }
    currentSceneIndex = scenceIndex;
    // create Dat GUI for current scene
    currentTask.createDatGUI();
    currentScene = currentTask.scene;
    // update source link corresponding to current task (scene)
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[scenceIndex][1];
    currentScene.add(axesHelper);
    currentScene.add(gridHelper);
    currentScene.add(cameraHelper);
    updatePostProcessing();
}
function updatePostProcessing() {
    // reset composer
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(currentScene, camera));
    // bloomPass = new BloomPass(
    //     Data.BloomPass.opacity,    // strength
    //     25,   // kernel size
    //     4,    // sigma ?
    //     256,  // blur render target resolution
    // );
    // composer.addPass(bloomPass);
    filmPass = new FilmPass(Data.FilmPass.nIntensity, Data.FilmPass.sIntensity, Data.FilmPass.sCount, Data.FilmPass.grayscale);
    filmPass.renderToScreen = true;
    composer.addPass(filmPass);
    // for antialias since built-in antialiasing doesn’t work with post-processing
    const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);
    createPostProcessingFolder();
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
    // renderer.render(currentScene, camera)
    composer.render();
}
/* EVENTS */
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // render()
}
/* END EVENTS */
/* BUTTONS - LINKS */
/* Buttons to handle scene switch */
const taskButtons = document.querySelectorAll(".task");
const description = document.querySelector("#info");
for (let i = 0; i < taskButtons.length; i++) {
    taskButtons[i].addEventListener('click', function () {
        const title = taskButtons[i].innerHTML;
        // strip the number (1. ABC -> ABC)
        description.innerHTML = title.substr(title.indexOf(' ') + 1);
        switchScene(i);
    });
}
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
    const tooltiptextElement = document.querySelector('#pause > .tooltip > .tooltiptext');
    if (pause) {
        tooltiptextElement.innerHTML = "Play (P)";
    }
    else {
        tooltiptextElement.innerHTML = "Pause (P)";
    }
});
const audioButton = document.querySelector("#audio");
const audioIcon = document.querySelector("#audio-icon");
audioButton.addEventListener('click', function () {
    audioIcon.classList.toggle('fas-volume-mute');
    audioIcon.classList.toggle('fa-volume-up');
    muted = !muted;
    const tooltiptextElement = document.querySelector('#audio > .tooltip > .tooltiptext');
    if (muted) {
        tooltiptextElement.innerHTML = "Unmute (M)";
    }
    else {
        tooltiptextElement.innerHTML = "Mute (M)";
    }
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
