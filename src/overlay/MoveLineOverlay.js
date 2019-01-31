/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 连接源点和目标点的弧线动画。MoveLineOverlay是由多个浮层叠加的效果，有线、点、文字、动画等
 */
import MultiOverlay from './base/MultiOverlay';
import PointOverlay from './PointOverlay';
import LineStringOverlay from './LineStringOverlay';
import LineStringAnimationOverlay from './LineStringAnimationOverlay';
import config from './../config/MoveLineConfig';
import {
    merge,
    isFunction,
} from '../common/Util';

/**
 * MoveLineOverlay 图层
 */
export default class MoveLineOverlay extends MultiOverlay {
    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(opts) {
        super();
        this._isDispose = false;
        this._data = opts.data || [];
        this._opts = merge(config, opts);
        this._PointOverlay = this._creataPointOverlay(this._opts);
        this._LineStringOverlay = this._createLineStringOverlay(this._opts);
        this._LineStringAnimationOverlay = this._createLineStringAnimationOverlay(this._opts);
    }

    /**
     * 初始化
     * @param {Object} map  地图对象
     */
    _init(map) {
        map.addOverlay(this._LineStringOverlay);
        map.addOverlay(this._LineStringAnimationOverlay);
        map.addOverlay(this._PointOverlay);
    }

    /**
     * 设置当前样式，会造成画布重绘
     * @param {Object} ops 数据集
     */
    setOptionStyle(opts) {
        if (!opts) return;
        this._opts = merge(this._opts, opts);
        opts.style.point.data && delete opts.style.point.data;
        opts.style.point.line && delete opts.style.point.line;
        opts.style.point.lineAnimation && delete opts.style.point.lineAnimation;
        this._PointOverlay.setOptionStyle(opts.style.point);
        this._LineStringOverlay.setOptionStyle(opts.style.line);
        this._LineStringAnimationOverlay.setOptionStyle(opts.style.lineAnimation);

        if (opts.data !== undefined) {
            this.setData(opts.data);
        }

    }

    /**
     * 设置当前的图层的z-index值。注意：被and添加之后才能调用生效,zcmap默认是按照添加图层的顺序设置层级的
     * @param {Number} zIndex 索引值
     */
    setZIndex(zIndex) {
        this._zIndex = zIndex;

        this._PointOverlay && this._PointOverlay.setZIndex(this._zIndex);
        this._LineStringOverlay && this._LineStringOverlay.setZIndex(this._zIndex + 2);
        this._LineStringAnimationOverlay && this._LineStringAnimationOverlay.setZIndex(this._zIndex + 4);
    }

    /**
     * 设置当前图层的数据
     * @param {Object} data 数据集
     */
    setData(data) {
        if (data) {
            this._data = data;
        } else {
            this._data = [];
        }

        this._PointOverlay.setData(this._getPointData());
        this._LineStringOverlay.setData(this._getLineStringData());
        this._LineStringAnimationOverlay.setData(this._getLineStringData());

    }

    /**
     * 获取对应关键字的数据索引
     * @param {Object} data 数据集
     * @param {String} name 关键字
     */
    _findIndex(data, name) {
        return data.findIndex((item) => {
            return item.name == name;
        });
    }

    /**
     * 获取标记点数据
     */
    _getPointData() {
        let data = [];
        this._data.forEach(item => {
            if (this._findIndex(data, item.from.name) == -1) {
                data.push({
                    name: item.from.name,
                    count: item.count,
                    geometry: {
                        type: 'Point',
                        coordinates: item.from.coordinates
                    },
                    style: {}
                });
            }
            if (this._findIndex(data, item.to.name) == -1) {
                data.push({
                    name: item.to.name,
                    count: item.count,
                    geometry: {
                        type: 'Point',
                        coordinates: item.to.coordinates
                    },
                    style: {}
                });
            }

        });
        return data;

    }

    /**
     * 获取线路数据
     */
    _getLineStringData() {
        return this._data.map(item => {
            return {
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        item.from.coordinates,
                        item.to.coordinates
                    ]
                },
                properties: item,
                count: item.count
            };
        });
    }

    /**
     * 创建标记点图层
     * @param {Object} opts 
     */
    _creataPointOverlay(opts) {

        return new PointOverlay({
            ...opts.style.point,
            data: this._getPointData(),
            zIndex: this._zIndex + 1
        });
    }

    /**
     * 创建线路图层
     * @param {Object} opts 
     */
    _createLineStringOverlay(opts) {

        return new LineStringOverlay({
            ...opts.style.line,
            data: this._getLineStringData(),
            zIndex: this._zIndex + 2
        });
    }

    /**
     * 创建线路动画图层
     * @param {Object} opts 
     */
    _createLineStringAnimationOverlay(opts) {

        return new LineStringAnimationOverlay({
            ...opts.style.lineAnimation,
            data: this._getLineStringData(),
            zIndex: this._zIndex + 3
        });
    }

    /**
     * 释放对象
     */
    dispose() {
        this._PointOverlay.dispose();
        this._LineStringOverlay.dispose();
        this._LineStringAnimationOverlay.dispose();
        let me = this;
        for (let key in me) {
            if (!isFunction(me[key])) {
                me[key] = null;
            }
        }
        me._isDispose = true;
        me = null;
    }

}