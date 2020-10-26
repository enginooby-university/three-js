import * as THREE from '/build/three.module.js';
import * as Task1 from './webgl_modeling_triangle.js';
import * as Task2 from './webgl_modeling_table.js';
let camera;
let scene;
const renderer = new THREE.WebGLRenderer();
// let controls: OrbitControls
init();
animate();
function init() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 5;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // controls = new OrbitControls(camera, renderer.domElement)
    // Choosing default scene
    scene = Task2.scene;
}
function animate() {
    requestAnimationFrame(animate);
    render();
    // controls.update()
}
function render() {
    Task1.render();
    Task2.render();
    renderer.render(scene, camera);
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
const button1 = document.getElementById('task1');
const button2 = document.getElementById('task2');
button1.onclick = function () {
    scene = Task1.scene;
};
button2.onclick = function () {
    scene = Task2.scene;
};
/* END EVENTS */
