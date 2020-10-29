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

export function createMeshPhysicalMaterialFolder(gui: GUI, mesh: THREE.Mesh, meshName: string) {
    const meshFolder = createObjectFolder(gui, mesh, meshName)
    createPhysicalMaterialFolder(meshFolder, <THREE.MeshPhysicalMaterial>mesh.material)

    return meshFolder
}

export function createPhysicalMaterialFolder(gui: GUI, material: THREE.MeshPhysicalMaterial) {
    const materialFolder = gui.addFolder("Physical material")
    // objectFolder.addColor(object, 'color').onChange(() => { object.color.setHex(Number(object.color.getHex().toString().replace('#', '0x'))) });
    // objectFolder.addColor(object, 'emissive').onChange(() => { object.emissive.setHex(Number(object.emissive.getHex().toString().replace('#', '0x'))) });
    materialFolder.add(material, 'wireframe');
    materialFolder.add(material, 'flatShading').onChange(() => updateMaterial(material))
    materialFolder.add(material, 'reflectivity', 0, 1);
    materialFolder.add(material, 'refractionRatio', 0, 1);
    materialFolder.add(material, 'roughness', 0, 1);
    materialFolder.add(material, 'metalness', 0, 1);
    materialFolder.add(material, 'clearcoat', 0, 1, 0.01)
    materialFolder.add(material, 'clearcoatRoughness', 0, 1, 0.01)
    materialFolder.open()
}

function createObjectPositionFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectPositionFolder = parentFolder.addFolder("position")
    objectPositionFolder.add(object.position, "x", -10, 10, 0.01)
    objectPositionFolder.add(object.position, "y", -10, 10, 0.01)
    objectPositionFolder.add(object.position, "z", -10, 10, 0.01)

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

function updateMaterial(material: THREE.Material) {
    material.side = Number(material.side)
    material.needsUpdate = true
}