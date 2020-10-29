export function createObjectFolder(gui, object, objectName) {
    const objectFolder = gui.addFolder(objectName);
    createObjectPositionFolder(objectFolder, object);
    createObjectRotationFolder(objectFolder, object);
    createObjectScaleFolder(objectFolder, object);
    objectFolder.add(object, "visible", true);
    return objectFolder;
}
export function createCameraFolder(gui, object, objectName) {
    const objectFolder = gui.addFolder(objectName);
    objectFolder.open();
    createObjectPositionFolder(objectFolder, object).open();
    createObjectRotationFolder(objectFolder, object).open();
    objectFolder.add(object, "fov", 40, 120, 0.1).onChange(() => object.updateProjectionMatrix());
    objectFolder.add(object, "near", 0.1, 100, 0.1).onChange(() => object.updateProjectionMatrix());
    objectFolder.add(object, "far", 100, 10000, 1).onChange(() => object.updateProjectionMatrix());
    return objectFolder;
}
export function createMeshPhysicalMaterialFolder(gui, mesh, meshName) {
    const meshFolder = createObjectFolder(gui, mesh, meshName);
    createPhysicalMaterialFolder(meshFolder, mesh.material);
    return meshFolder;
}
export function createPhysicalMaterialFolder(gui, material) {
    const materialFolder = gui.addFolder("Physical material");
    // objectFolder.addColor(object, 'color').onChange(() => { object.color.setHex(Number(object.color.getHex().toString().replace('#', '0x'))) });
    // objectFolder.addColor(object, 'emissive').onChange(() => { object.emissive.setHex(Number(object.emissive.getHex().toString().replace('#', '0x'))) });
    materialFolder.add(material, 'wireframe');
    materialFolder.add(material, 'flatShading').onChange(() => updateMaterial(material));
    materialFolder.add(material, 'reflectivity', 0, 1);
    materialFolder.add(material, 'refractionRatio', 0, 1);
    materialFolder.add(material, 'roughness', 0, 1);
    materialFolder.add(material, 'metalness', 0, 1);
    materialFolder.add(material, 'clearcoat', 0, 1, 0.01);
    materialFolder.add(material, 'clearcoatRoughness', 0, 1, 0.01);
    materialFolder.open();
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
function updateMaterial(material) {
    material.side = Number(material.side);
    material.needsUpdate = true;
}
