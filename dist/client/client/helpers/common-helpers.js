class Helper {
    constructor() { }
    static toRadian(degree) {
        return degree * Math.PI / 180;
    }
    static toDegree(radian) {
        return radian * 180 / Math.PI;
    }
}
export default Helper;
