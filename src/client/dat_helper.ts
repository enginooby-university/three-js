import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as THREE from '/build/three.module.js'

export function createObjectFolder(gui: GUI, object: THREE.Object3D, objectName: string) {
    const objectFolder = gui.addFolder(objectName)

    createObjectPositionFolder(objectFolder, object)
    createObjectRotationFolder(objectFolder, object)
    createObjectScaleFolder(objectFolder, object)
    objectFolder.add(object, "visible", true)

    return objectFolder
}

export function createCameraFolder(gui: GUI, object: THREE.PerspectiveCamera, objectName: string) {
    const objectFolder = gui.addFolder(objectName)
    objectFolder.open()

    createObjectPositionFolder(objectFolder, object).open()
    createObjectRotationFolder(objectFolder, object).open()
    objectFolder.add(object, "fov", 40, 120, 0.1).onChange(() => object.updateProjectionMatrix())
    objectFolder.add(object, "near", 0.1, 100, 0.1).onChange(() => object.updateProjectionMatrix())
    objectFolder.add(object, "far", 100, 10000, 1).onChange(() => object.updateProjectionMatrix())

    return objectFolder
}

function createObjectPositionFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectPositionFolder = parentFolder.addFolder("position")
    objectPositionFolder.add(object.position, "x", 0, 10, 0.01)
    objectPositionFolder.add(object.position, "y", 0, 10, 0.01)
    objectPositionFolder.add(object.position, "z", 0, 10, 0.01)

    return objectPositionFolder
}

function createObjectScaleFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectScaleFolder = parentFolder.addFolder("scale")
    objectScaleFolder.add(object.scale, "x", 0, 5, 0.1)
    objectScaleFolder.add(object.scale, "y", 0, 5, 0.1)
    objectScaleFolder.add(object.scale, "z", 0, 5, 0.1)

    return objectScaleFolder
}

function createObjectRotationFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectRotationFolder = parentFolder.addFolder("rotation")
    objectRotationFolder.add(object.rotation, "x", 0, Math.PI * 2, 0.01)
    objectRotationFolder.add(object.rotation, "y", 0, Math.PI * 2, 0.01)
    objectRotationFolder.add(object.rotation, "z", 0, Math.PI * 2, 0.01)

    return objectRotationFolder
}