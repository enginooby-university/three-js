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
function createObjectPositionFolder(parentFolder, object) {
    const objectPositionFolder = parentFolder.addFolder("position");
    objectPositionFolder.add(object.position, "x", 0, 10, 0.01);
    objectPositionFolder.add(object.position, "y", 0, 10, 0.01);
    objectPositionFolder.add(object.position, "z", 0, 10, 0.01);
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
