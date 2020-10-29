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

export function createCameraFolder(gui: GUI, perspectiveCamera: THREE.PerspectiveCamera, cameraName: string) {
    const cameraFolder = gui.addFolder(cameraName)
    createObjectPositionFolder(cameraFolder, perspectiveCamera).open()
    createObjectRotationFolder(cameraFolder, perspectiveCamera).open()
    cameraFolder.add(perspectiveCamera, "fov", 40, 120, 0.1).onChange(() => perspectiveCamera.updateProjectionMatrix())
    cameraFolder.add(perspectiveCamera, "near", 0.001, 100, 0.1).onChange(() => perspectiveCamera.updateProjectionMatrix())
    cameraFolder.add(perspectiveCamera, "far", 100, 10000, 1).onChange(() => perspectiveCamera.updateProjectionMatrix())
    cameraFolder.open()

    return cameraFolder
}

export function createMeshPhysicalMaterialFolder(gui: GUI, mesh: THREE.Mesh, meshName: string) {
    const meshFolder = createObjectFolder(gui, mesh, meshName)
    createPhysicalMaterialFolder(meshFolder, <THREE.MeshPhysicalMaterial>mesh.material)

    return meshFolder
}

export function createPhysicalMaterialFolder(gui: GUI, material: THREE.MeshPhysicalMaterial) {
    const data = {
        color: material.color.getHex(),
        emissive: material.emissive.getHex(),
    };

    const materialFolder = gui.addFolder('MeshPhysicalMaterial');
    materialFolder.add(material, 'wireframe');
    materialFolder.add(material, 'fog');
    materialFolder.addColor(data, 'color').onChange(handleColorChange(material.color));
    materialFolder.addColor(data, 'emissive').onChange(handleColorChange(material.emissive));
    materialFolder.add(material, 'roughness', 0, 1);
    materialFolder.add(material, 'metalness', 0, 1);
    materialFolder.add(material, 'reflectivity', 0, 1);
    materialFolder.add(material, 'clearcoat', 0, 1).step(0.01);
    materialFolder.add(material, 'clearcoatRoughness', 0, 1).step(0.01);
    materialFolder.add(material, 'wireframeLinewidth', 0, 10);
    materialFolder.open()

    return materialFolder
}

function handleColorChange(color: THREE.Color) {
    return function (value: any) {
        if (typeof value === 'string') {
            value = value.replace('#', '0x');
        }
        color.setHex(value);
    };
}

function updateMaterial(material: THREE.Material) {
    material.side = Number(material.side)
    material.needsUpdate = true
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