import {isString} from './Util';

/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 关于地理点坐标类文件.
 */

//Include("BMap.baidu.lang.Class");


/**
 * 基本点类,代表地理点坐标;
 * 坐标支持base64编码
 * @param {Object} lng 墨卡托X(经度).
 * @param {Object} lat 墨卡托Y(纬度);.
 * @return {Point} 返回一个地理点坐标对象.
 */
function Point(lng, lat) {
    // 新增base64支持
    if (isNaN(lng)) {
        
        lng = isNaN(lng) ? 0 : lng;
    }
    if (isString(lng)) {
        lng = parseFloat(lng);
    }
    if (isNaN(lat)) {
        
        lat = isNaN(lat) ? 0 : lat;
    }
    if (isString(lat)) {
        lat = parseFloat(lat);
    }
    this.lng = lng;
    this.lat = lat;
}

/**
 * 点坐标是否在范围
 */
Point.isInRange = function (pt) {
    return pt && pt.lng <= 180 && pt.lng >= -180 && pt.lat <= 74 && pt.lat >= -74;
};

/**
 * 点坐标是否相等
 */
Point.prototype.equals = function (other) {
    return other && this.lat == other.lat && this.lng == other.lng;
};

export default Point;