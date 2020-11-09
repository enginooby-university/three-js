import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { FBXLoader } from '/jsm/loaders/FBXLoader.js'

export class FBXModel {
    group: THREE.Group
    mixer: THREE.AnimationMixer
    skeletonHelper: THREE.SkeletonHelper
    animationActions: THREE.AnimationAction[]
    animations: Object = {} // names of animations along with its exclusive tracks
    activeActionIndex: number
    lastActionIndex: number
    position: THREE.Vector3
    bones: THREE.Bone[]
    selectBone: THREE.Bone // selected bone for editing in Dat GUI
    protected name: string = ""
    protected scale: number = 0
    readonly clock: THREE.Clock

    constructor(fbxLoader: FBXLoader, x: number, y: number, z: number) {
        this.initInfo()
        this.group = new THREE.Group()
        this.mixer = new THREE.AnimationMixer(this.group)
        this.skeletonHelper = new THREE.SkeletonHelper(this.group);
        this.clock = new THREE.Clock()
        this.bones = []
        this.selectBone = new THREE.Bone()
        this.animationActions = []
        this.activeActionIndex = 0
        this.lastActionIndex = 0
        this.position = new THREE.Vector3(x, y, z)
        this.loadFBXModel(fbxLoader)
    }

    protected initInfo() {
        this.name = "example"
        this.scale = 0.045
        this.animations = {
            "animation1": [],
            "animation2": [],
            "animation3": [],
        }
    }

    setAction(toActionIndex: number) {
        if (toActionIndex != this.activeActionIndex) {
            this.lastActionIndex = this.activeActionIndex
            this.activeActionIndex = toActionIndex
            // lastAction.stop()
            this.animationActions[this.lastActionIndex].fadeOut(1)
            this.animationActions[this.activeActionIndex].reset()
            this.animationActions[this.activeActionIndex].fadeIn(1)
            this.animationActions[this.activeActionIndex].play()
        }
    }

    getBones() {
        let bones: THREE.Bone[] = []

        this.group.traverse(function (child) {
            // console.log(child);
            if ((<THREE.Bone>child).isBone) {
                bones.push((<THREE.Bone>child))
            }
        })

        // filter duplicatte bones by name
        bones = bones.filter(
            (bone, i, arr) => arr.findIndex(t => t.name === bone.name) === i
        );

        // shorten bone names
        bones.forEach(bone => bone.name = bone.name
            .replace("mixamo", "")
            .replace("rig", "")
            .replace("left", "L_")
            .replace("Left", "L_")
            .replace("right", "R_")
            .replace("Right", "R_")
        )

        this.bones = bones
    }

    createDatGUI(groupFolder: GUI, index: number) {
        const modelFolder = DatHelper.createObjectFolder(groupFolder, this.group, `${this.name} ${index}`)

        const animationOptions = ["default"]
        for (let i = 0; i < Object.keys(this.animations).length; i++) {
            animationOptions[i + 1] = Object.keys(this.animations)[i]
        }
        const selectAnimation = {
            name: "default"
        }
        modelFolder.add(this.skeletonHelper, "visible").name("skeleton")
        modelFolder.add(selectAnimation, 'name', animationOptions).name('animation')
            .onChange(value => this.setAction(animationOptions.indexOf(value)))
            .setValue(animationOptions[1])
        this.creatBoneFolder(modelFolder)
    }

    creatBoneFolder(parentFolder: GUI) {
        const selectBone = {
            name: ''
        }
        const boneParam = {
            xPosition: 0,
            yPosition: 0,
            zPosition: 0,
            xRotation: 0,
            yRotation: 0,
            zRotation: 0,
            xScale: 1,
            yScale: 1,
            zScale: 1,
        }
        const boneFolder = parentFolder.addFolder("Edit bone")
        boneFolder.add(selectBone, 'name', this.bones.map(bone => bone.name))
            .name('Select')
            .onChange(value => this.selectBone = this.bones.find(bone => bone.name === value)!)

        const bonePositionFolder = boneFolder.addFolder("position")
        bonePositionFolder.add(boneParam, 'xPosition', -50, 50, 0.1)
            .name('x')
            .onChange(value => this.selectBone.position.x = value)
        bonePositionFolder.add(boneParam, 'yPosition', -50, 50, 0.1)
            .name('y')
            .onChange(value => this.selectBone.position.y = value)
        bonePositionFolder.add(boneParam, 'zPosition', -50, 50, 0.1)
            .name('z')
            .onChange(value => this.selectBone.position.z = value)
        const boneRotationFolder = boneFolder.addFolder("rotation")
        boneRotationFolder.add(boneParam, 'xRotation', 0, Math.PI * 2, 0.01)
            .name('x')
            .onChange(value => this.selectBone.rotation.x = value)
        boneRotationFolder.add(boneParam, 'yRotation', 0, Math.PI * 2, 0.01)
            .name('y')
            .onChange(value => this.selectBone.rotation.x = value)
        boneRotationFolder.add(boneParam, 'zRotation', 0, Math.PI * 2, 0.01)
            .name('z')
            .onChange(value => this.selectBone.rotation.x = value)
        const boneScaleFolder = boneFolder.addFolder("scale")
        boneScaleFolder.add(boneParam, 'xScale', 0, 5, 0.1)
            .name('x')
            .onChange(value => this.selectBone.scale.x = value)
        boneScaleFolder.add(boneParam, 'yScale', 0, 5, 0.1)
            .name('y')
            .onChange(value => this.selectBone.scale.y = value)
        boneScaleFolder.add(boneParam, 'zScale', 0, 5, 0.1)
            .name('z')
            .onChange(value => this.selectBone.scale.z = value)
    }

    loadFBXModel(fbxLoader: FBXLoader, loadAnimation?: Function) {
        // TODO:  add FBX model to transformable group
        //  let model: THREE.Group = new THREE.Group()
        fbxLoader.load(
            `./resources/models/${this.name}.fbx`,
            (object) => {
                object.traverse(function (child) {
                    // console.log(child);
                    if ((<THREE.SkinnedMesh>child).isSkinnedMesh) {
                        (<THREE.SkinnedMesh>child).receiveShadow = true;
                        (<THREE.SkinnedMesh>child).castShadow = true;
                    }
                })

                // object.children is a list of bones
                this.skeletonHelper = new THREE.SkeletonHelper(object);
                this.mixer = new THREE.AnimationMixer(object);

                // get default animation from model
                const animationAction = this.mixer.clipAction((object as any).animations[0]);
                this.animationActions.push(animationAction)

                object.scale.set(this.scale, this.scale, this.scale)
                this.group = object

                if (loadAnimation !== undefined) {
                    loadAnimation()
                } else {
                    this.loadFBXAnimations(fbxLoader, 0)
                }
            },
            (xhr) => {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        )
    }

    // @param count: index of the animation in animations[]
    loadFBXAnimations(fbxLoader: FBXLoader, count: number) {
        const animationName: string = `${this.name}@${Object.keys(this.animations)[count]}`
        fbxLoader.load(
            `./resources/models/${animationName}.fbx`,
            (object) => {
                // remove specific tracks in the animation clip
                (Object.values(this.animations)[0] as number[]).forEach(index => (object as any).animations[index].tracks.shift())

                // generate animation from the animation clip
                const animationAction = this.mixer.clipAction((object as any).animations[0]);
                this.animationActions.push(animationAction)

                console.log(`${animationName} animation loaded`);

                if (count < Object.keys(this.animations).length - 1) {
                    this.loadFBXAnimations(fbxLoader, count + 1)
                }
            },
            (xhr) => {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        )
    }

    loadFBXAnimation(fbxLoader: FBXLoader, animationName: string, exclusiveTracks?: number[], loadAnotherAnimation?: Function) {
        fbxLoader.load(
            `./resources/models/${animationName}.fbx`,
            (object) => {
                // delete the specific track (VectorKeyframeTrack) that moves the object forward while running
                // console.dir((object as any).animations[0]);
                if (exclusiveTracks !== undefined) {
                    exclusiveTracks.forEach(index => (object as any).animations[index].tracks.shift()
                    )
                }

                // generate animation for model clip.
                const animationAction = this.mixer.clipAction((object as any).animations[0]);
                this.animationActions.push(animationAction)

                console.log(`${animationName} animation loaded`);

                if (loadAnotherAnimation !== undefined) {
                    loadAnotherAnimation()
                }
            },
            (xhr) => {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        )
    }
}