import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let pointLight: THREE.PointLight
let spotLight: THREE.SpotLight
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let boxGeometry: THREE.BoxGeometry
let basicMaterial: THREE.MeshBasicMaterial
let standardMaterial: THREE.MeshStandardMaterial
let cube: THREE.Mesh
const SPOTLIGHT_X_SPEED: number = 0.01
const SPOTLIGHT_Y_SPEED: number = 0.01
const W_KEY: number = 87
const S_KEY: number = 83
const A_KEY: number = 65
const D_KEY: number = 68

function init() {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 4
    camera.position.y = 4
    camera.position.x = 4

    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)

    spotLight = new THREE.SpotLight()
    spotLight.color.setHex(0x00ffff)
    spotLight.intensity = 7
    spotLight.angle = Math.PI/4
    const spotLightHelper: THREE.SpotLightHelper = new THREE.SpotLightHelper(spotLight);
    scene.add(spotLightHelper)
    scene.add(spotLight)

    pointLight = new THREE.PointLight()
    pointLight.color.setHex(0xff0000)
    pointLight.intensity = 5
    pointLight.position.x = 1
    const pointLightHelper: THREE.PointLightHelper = new THREE.PointLightHelper(pointLight);
    scene.add(pointLightHelper);
    scene.add(pointLight)

    boxGeometry = new THREE.BoxGeometry()

    basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false })
    standardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false })

    cube = new THREE.Mesh(boxGeometry, standardMaterial)
    scene.add(cube)
}

/* EVENTS */
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // render()
}

document.addEventListener('keydown', onDocumentKeyDown, false);
function onDocumentKeyDown(event: KeyboardEvent) {
    let keyCode: number = event.keyCode;
    console.log(keyCode)

    switch (keyCode) {
        case W_KEY:
            spotLight.position.y -= SPOTLIGHT_Y_SPEED
            break
        case S_KEY:
            spotLight.position.y += SPOTLIGHT_Y_SPEED
            break
        case A_KEY:
            spotLight.position.x -= SPOTLIGHT_X_SPEED
            break
        case D_KEY:
            spotLight.position.x += SPOTLIGHT_X_SPEED
            break
    }

    render()
}
/* END EVENTS */

function animate() {
    requestAnimationFrame(animate)

    // cube.rotation.x +=0.01
    // cube.rotation.y +=0.01

    controls.update()
    render()
};

function render() {
    renderer.render(scene, camera)
}

init()
// render()
animate() // only render when updating to improve performance
