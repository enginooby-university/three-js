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
    createObjectPositionFolder(cameraFolder, perspectiveCamera)
    createObjectRotationFolder(cameraFolder, perspectiveCamera)
    cameraFolder.add(perspectiveCamera, "fov", 40, 120, 0.1).onChange(() => perspectiveCamera.updateProjectionMatrix())
    cameraFolder.add(perspectiveCamera, "near", 0.001, 100, 0.1).onChange(() => perspectiveCamera.updateProjectionMatrix())
    cameraFolder.add(perspectiveCamera, "far", 100, 10000, 1).onChange(() => perspectiveCamera.updateProjectionMatrix())
    // cameraFolder.open()

    return cameraFolder
}

export function createMeshPhysicalMaterialFolder(gui: GUI, mesh: THREE.Mesh, meshName: string) {
    const meshFolder = createObjectFolder(gui, mesh, meshName)
    createPhysicalMaterialFolder(meshFolder, <THREE.MeshPhysicalMaterial>mesh.material)

    return meshFolder
}

export function createPhysicalMaterialFolder(gui: GUI, material: THREE.MeshPhysicalMaterial) {
    createMaterialFolder(gui, material)
    const data = {
        color: material.color.getHex(),
        emissive: material.emissive.getHex(),
    };

    const physicalMaterialFolder = gui.addFolder('THREE.MeshPhysicalMaterial');
    physicalMaterialFolder.add(material, 'wireframe');
    // physicalMaterialFolder.add(material, 'fog');
    physicalMaterialFolder.addColor(data, 'color').onChange(handleColorChange(material.color));
    physicalMaterialFolder.addColor(data, 'emissive').onChange(handleColorChange(material.emissive));
    physicalMaterialFolder.add(material, 'roughness', 0, 1);
    physicalMaterialFolder.add(material, 'metalness', 0, 1);
    // physicalMaterialFolder.add(material, 'reflectivity', 0, 1);
    // physicalMaterialFolder.add(material, 'clearcoat', 0, 1).step(0.01);
    // physicalMaterialFolder.add(material, 'clearcoatRoughness', 0, 1).step(0.01);
    physicalMaterialFolder.add(material, 'wireframeLinewidth', 0, 10);
    // physicalMaterialFolder.open()

    return physicalMaterialFolder
}

export function createDirectionalLightFolder(gui: GUI, directionalLight: THREE.DirectionalLight) {
    const lightFolder = gui.addFolder('Light')

    createObjectPositionFolder(lightFolder, directionalLight).open()
    createTHREELightFolder(lightFolder, directionalLight).open()
    createTHREEDirectionalLightFolder(lightFolder, directionalLight).open()

    return lightFolder
}

/* UPDATE HELPERS */

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

function updateShadowMapSize(directionalLight: THREE.DirectionalLight, data: any) {
    directionalLight.shadow.mapSize.width = data.shadowMapSizeWidth
    directionalLight.shadow.mapSize.height = data.shadowMapSizeHeight;
    (directionalLight.shadow.map as any) = null;
}

/* SUB-FOLDERS */
export function createTHREELightFolder(gui: GUI, light: THREE.Light) {
    const data = {
        color: light.color.getHex(),
        mapsEnabled: true
    };
    const threeLightFolder = gui.addFolder('THREE.Light')
    threeLightFolder.addColor(data, 'color').onChange(() => { light.color.setHex(Number(data.color.toString().replace('#', '0x'))) });
    threeLightFolder.add(light, 'intensity', 0, 1, 0.01);

    return threeLightFolder
}

function createTHREEDirectionalLightFolder(gui: GUI, directionalLight: THREE.DirectionalLight) {
    const data = {
        color: directionalLight.color.getHex(),
        shadowMapSizeWidth: 2048,
        shadowMapSizeHeight: 2048,
        mapsEnabled: true
    };

    const threeDirectionalLightFolder = gui.addFolder('THREE.DirectionalLight')
    threeDirectionalLightFolder.add(directionalLight.shadow.camera, "left", -10, -1, 0.1).onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
    threeDirectionalLightFolder.add(directionalLight.shadow.camera, "right", 1, 10, 0.1).onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
    threeDirectionalLightFolder.add(directionalLight.shadow.camera, "top", 1, 10, 0.1).onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
    threeDirectionalLightFolder.add(directionalLight.shadow.camera, "bottom", -10, -1, 0.1).onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
    threeDirectionalLightFolder.add(directionalLight.shadow.camera, "near", 0.1, 100).onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
    threeDirectionalLightFolder.add(directionalLight.shadow.camera, "far", 0.1, 100).onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
    threeDirectionalLightFolder.add(data, "shadowMapSizeWidth", [256, 512, 1024, 2048, 4096]).onChange(() => updateShadowMapSize(directionalLight, data))
    threeDirectionalLightFolder.add(data, "shadowMapSizeHeight", [256, 512, 1024, 2048, 4096]).onChange(() => updateShadowMapSize(directionalLight, data))

    return threeDirectionalLightFolder
}

export function createMaterialFolder(gui: GUI, material: THREE.Material) {
    const materialFolder = gui.addFolder('THREE.Material');
    materialFolder.add(material, 'transparent');
    materialFolder.add(material, 'opacity', 0, 1).step(0.01);
    // materialFolder.add(material, 'blending', constants.blendingMode);
    // materialFolder.add(material, 'blendSrc', constants.destinationFactors);
    // materialFolder.add(material, 'blendDst', constants.destinationFactors);
    // materialFolder.add(material, 'blendEquation', constants.equations);
    materialFolder.add(material, 'depthTest');
    materialFolder.add(material, 'depthWrite');
    // materialFolder.add(material, 'polygonOffset');
    // materialFolder.add(material, 'polygonOffsetFactor');
    // materialFolder.add(material, 'polygonOffsetUnits');
    materialFolder.add(material, 'visible');
    // folder.add( material, 'alphaTest', 0, 1 ).step( 0.01 ).onChange( needsUpdate( material, geometry ) );
    // folder.add( material, 'side', constants.side ).onChange( needsUpdate( material, geometry ) );
    // materialFolder.open()

    return materialFolder
}

function createObjectPositionFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectPositionFolder = parentFolder.addFolder("position")
    objectPositionFolder.add(object.position, "x", -50, 50, 0.01).listen()
    objectPositionFolder.add(object.position, "y", -50, 50, 0.01).listen()
    objectPositionFolder.add(object.position, "z", -50, 50, 0.01).listen()

    return objectPositionFolder
}

function createObjectScaleFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectScaleFolder = parentFolder.addFolder("scale")
    objectScaleFolder.add(object.scale, "x", 0, 5, 0.1).listen()
    objectScaleFolder.add(object.scale, "y", 0, 5, 0.1).listen()
    objectScaleFolder.add(object.scale, "z", 0, 5, 0.1).listen()

    return objectScaleFolder
}

function createObjectRotationFolder(parentFolder: GUI, object: THREE.Object3D) {
    const objectRotationFolder = parentFolder.addFolder("rotation")
    objectRotationFolder.add(object.rotation, "x", 0, Math.PI * 2, 0.01).listen()
    objectRotationFolder.add(object.rotation, "y", 0, Math.PI * 2, 0.01).listen()
    objectRotationFolder.add(object.rotation, "z", 0, Math.PI * 2, 0.01).listen()

    return objectRotationFolder
}

const constants = {
    combine: {
        'MultiplyOperation': THREE.MultiplyOperation,
        'MixOperation': THREE.MixOperation,
        'AddOperation': THREE.AddOperation
    },
    side: {
        'FrontSide': THREE.FrontSide,
        'BackSide': THREE.BackSide,
        'DoubleSide': THREE.DoubleSide
    },
    blendingMode: {
        'No': THREE.NoBlending,
        'Normal': THREE.NormalBlending,
        'Additive': THREE.AdditiveBlending,
        'Subtractive': THREE.SubtractiveBlending,
        'Multiply': THREE.MultiplyBlending,
        'Custom': THREE.CustomBlending
    },
    equations: {
        'Add': THREE.AddEquation,
        'Subtract': THREE.SubtractEquation,
        'ReverseSubtract': THREE.ReverseSubtractEquation
    },
    destinationFactors: {
        'Zero': THREE.ZeroFactor,
        'One': THREE.OneFactor,
        'SrcColor': THREE.SrcColorFactor,
        '1-SrcColor': THREE.OneMinusSrcColorFactor,
        'SrcAlphar': THREE.SrcAlphaFactor,
        '1-SrcAlpha': THREE.OneMinusSrcAlphaFactor,
        'DstAlpha': THREE.DstAlphaFactor,
        '1-DstAlpha': THREE.OneMinusDstAlphaFactor
    },
    sourceFactors: {
        'DstColor': THREE.DstColorFactor,
        '1-DstColor': THREE.OneMinusDstColorFactor,
        'SrcAlphaSaturate': THREE.SrcAlphaSaturateFactor
    }
};