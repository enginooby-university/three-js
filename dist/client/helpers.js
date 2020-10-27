import * as THREE from '/build/three.module.js';
export function createObjectGUIFolder(gui, object, objectName) {
    let objectFolder;
    if (objectName !== undefined) {
        objectFolder = gui.addFolder(objectName);
    }
    else {
        objectFolder = gui.addFolder(Object.keys({ object })[0]);
    }
    const objectPositionFolder = objectFolder.addFolder("position");
    objectPositionFolder.add(object.position, "x", 0, 10, 0.01);
    objectPositionFolder.add(object.position, "y", 0, 10, 0.01);
    objectPositionFolder.add(object.position, "z", 0, 10, 0.01);
    const objectRotationFolder = objectFolder.addFolder("rotation");
    objectRotationFolder.add(object.rotation, "x", 0, Math.PI * 2, 0.01);
    objectRotationFolder.add(object.rotation, "y", 0, Math.PI * 2, 0.01);
    objectRotationFolder.add(object.rotation, "z", 0, Math.PI * 2, 0.01);
    if (!(object instanceof THREE.Camera)) {
        const objectScaleFolder = objectFolder.addFolder("scale");
        objectScaleFolder.add(object.scale, "x", -5, 5, 0.1);
        objectScaleFolder.add(object.scale, "y", -5, 5, 0.1);
        objectScaleFolder.add(object.scale, "z", -5, 5, 0.1);
        objectFolder.add(object, "visible", true);
    }
    else {
        objectFolder.open();
        objectPositionFolder.open();
        objectRotationFolder.open();
    }
}
