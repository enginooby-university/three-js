import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
// let controls: OrbitControls
let boxGeometry: THREE.BoxGeometry
let basicMaterial: THREE.MeshBasicMaterial
let cube: THREE.Mesh
const CUBE_X_SPEED = 0.01;
const CUBE_Y_SPEED = 0.01;
const UP_ARROW_KEY: number = 38
const DOWN_ARROW_KEY: number = 40
const LEFT_ARROW_KEY: number = 37
const RIGHT_ARROW_KEY: number = 39

function init() {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 2

    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // controls = new OrbitControls(camera, renderer.domElement)

    boxGeometry = new THREE.BoxGeometry;

    basicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

    cube = new THREE.Mesh(boxGeometry, basicMaterial)
    scene.add(cube)
}

/* EVENTS */
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

document.addEventListener('keydown', onDocumentKeyDown, false);
function onDocumentKeyDown(event: KeyboardEvent) {
    let keyCode: number = event.keyCode;

    switch (keyCode) {
        case UP_ARROW_KEY:
            cube.position.y += CUBE_Y_SPEED
            break
        case DOWN_ARROW_KEY:
            cube.position.y -= CUBE_Y_SPEED
            break
        case LEFT_ARROW_KEY:
            cube.position.x -= CUBE_X_SPEED
            break
        case RIGHT_ARROW_KEY:
            cube.position.x += CUBE_X_SPEED
            break
    }

    render()
}
/* END EVENTS */

function animate() {
    requestAnimationFrame(animate)

    // controls.update()
    render()
};

function render() {
    renderer.render(scene, camera)
}

init();
render();
// animate(); // only render when updating to improve performance
