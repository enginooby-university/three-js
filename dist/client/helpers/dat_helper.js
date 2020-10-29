export function createObjectFolder(gui, object, objectName) {
    const objectFolder = gui.addFolder(objectName);
    createObjectPositionFolder(objectFolder, object);
    createObjectRotationFolder(objectFolder, object);
    createObjectScaleFolder(objectFolder, object);
    objectFolder.add(object, "visible", true);
    return objectFolder;
}
export function createCameraFolder(gui, perspectiveCamera, cameraName) {
    const cameraFolder = gui.addFolder(cameraName);
    createObjectPositionFolder(cameraFolder, perspectiveCamera).open();
    createObjectRotationFolder(cameraFolder, perspectiveCamera).open();
    cameraFolder.add(perspectiveCamera, "fov", 40, 120, 0.1).onChange(() => perspectiveCamera.updateProjectionMatrix());
    cameraFolder.add(perspectiveCamera, "near", 0.001, 100, 0.1).onChange(() => perspectiveCamera.updateProjectionMatrix());
    cameraFolder.add(perspectiveCamera, "far", 100, 10000, 1).onChange(() => perspectiveCamera.updateProjectionMatrix());
    cameraFolder.open();
    return cameraFolder;
}
export function createMeshPhysicalMaterialFolder(gui, mesh, meshName) {
    const meshFolder = createObjectFolder(gui, mesh, meshName);
    createPhysicalMaterialFolder(meshFolder, mesh.material);
    return meshFolder;
}
export function createPhysicalMaterialFolder(gui, material) {
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
    materialFolder.open();
    return materialFolder;
}
function handleColorChange(color) {
    return function (value) {
        if (typeof value === 'string') {
            value = value.replace('#', '0x');
        }
        color.setHex(value);
    };
}
function updateMaterial(material) {
    material.side = Number(material.side);
    material.needsUpdate = true;
}
function createObjectPositionFolder(parentFolder, object) {
    const objectPositionFolder = parentFolder.addFolder("position");
    objectPositionFolder.add(object.position, "x", -10, 10, 0.01);
    objectPositionFolder.add(object.position, "y", -10, 10, 0.01);
    objectPositionFolder.add(object.position, "z", -10, 10, 0.01);
    return objectPositionFolder;
}
function createObjectScaleFolder(parentFolder, object) {
    const objectScaleFolder = parentFolder.addFolder("scale");
    objectScaleFolder.add(object.scale, "x", 0, 5, 0.1);
    objectScaleFolder.add(object.scale, "y", 0, 5, 0.1);
    objectScaleFolder.add(object.scale, "z", 0, 5, 0.1);
    return objectScaleFolder;
}
function createObjectRotationFolder(parentFolder, object) {
    const objectRotationFolder = parentFolder.addFolder("rotation");
    objectRotationFolder.add(object.rotation, "x", 0, Math.PI * 2, 0.01);
    objectRotationFolder.add(object.rotation, "y", 0, Math.PI * 2, 0.01);
    objectRotationFolder.add(object.rotation, "z", 0, Math.PI * 2, 0.01);
    return objectRotationFolder;
}
