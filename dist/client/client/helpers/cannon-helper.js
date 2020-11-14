import * as THREE from '/build/three.module.js';
class CannonHelper {
    constructor() { }
    static createTrimesh(geometry) {
        if (!geometry.attributes) {
            geometry = new THREE.BufferGeometry().fromGeometry(geometry);
        }
        const vertices = geometry.attributes.position.array;
        const indices = Object.keys(vertices).map(Number);
        return new CANNON.Trimesh(vertices, indices);
    }
    static createConvexPolyhedron(geometry) {
        if (!geometry.vertices) {
            geometry = new THREE.Geometry().fromBufferGeometry(geometry);
            geometry.mergeVertices();
            geometry.computeBoundingSphere();
            geometry.computeFaceNormals();
        }
        const points = geometry.vertices.map(function (v) {
            return new CANNON.Vec3(v.x, v.y, v.z);
        });
        const faces = geometry.faces.map(function (f) {
            return [f.a, f.b, f.c];
        });
        return new CANNON.ConvexPolyhedron(points, faces);
    }
    static offsetCenterOfMass(body, centreOfMass) {
        body.shapeOffsets.forEach(function (offset) {
            centreOfMass.vadd(offset, centreOfMass);
        });
        centreOfMass.scale(1 / body.shapes.length, centreOfMass);
        body.shapeOffsets.forEach(function (offset) {
            offset.vsub(centreOfMass, offset);
        });
        const worldCenterOfMass = new CANNON.Vec3();
        body.vectorToWorldFrame(centreOfMass, worldCenterOfMass);
        body.position.vadd(worldCenterOfMass, body.position);
    }
}
export default CannonHelper;
