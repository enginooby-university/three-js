import { GUI } from '/jsm/libs/dat.gui.module'

export function createObjectGUIFolder(gui: GUI, object: THREE.Object3D, objectName: string){
    const objectFolder = gui.addFolder(objectName)
    const objectPositionFolder=objectFolder.addFolder("position")
    objectPositionFolder.add(object.position, "x", 0, 10, 0.01)
    objectPositionFolder.add(object.position, "y", 0, 10, 0.01)
    objectPositionFolder.add(object.position, "z", 0, 10, 0.01)

    const objectRotationFolder=objectFolder.addFolder("rotation")
    objectRotationFolder.add(object.rotation, "x", 0, Math.PI * 2, 0.01)
    objectRotationFolder.add(object.rotation, "y", 0, Math.PI * 2, 0.01)
    objectRotationFolder.add(object.rotation, "z", 0, Math.PI * 2, 0.01)

    // objectFolder.open()
    // objectPositionFolder.open()
    // objectRotationFolder.open()
}