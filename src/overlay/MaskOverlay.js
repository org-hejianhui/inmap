/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.30
 * Version: 0.0.1
 * Description: 多边形图形遮罩
 */
import CanvasOverlay from './base/CanvasOverlay';   // 图层绘制类
import MaskConfig from '../config/MaskConfig';  // 多边形图形遮罩配置类
import State from '../config/OnStateConfig.js'; // 图层绘制状态
import {
    clearPushArray, // 清空数组并添加新内容
    checkGeoJSON,   // GeoJSON 格式校验
    merge   // 数组合并
} from '../common/Util';

export default class MaskOverlay extends CanvasOverlay {
    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(ops) {
        super();
        this._data = [];
        this._workerData = [];
        this._option = {};
        this._setStyle(MaskConfig, ops);
    }

    /**
     * 设置样式
     * @param {Object} config 默认配置项
     * @param {Object} ops 参数配置项
     */
    _setStyle(config, ops) {
        ops = ops || {};
        let option = merge(config, ops);
        this._option = option;
        this._eventConfig = option.event;
        this._styleConfig = option.style;
        if (ops.data !== undefined) {
            this.setData(ops.data);
        } else {
            this._map && this.refresh();
        }
        delete this._option.data;
        this._tMapStyle(option.skin);
    }

    /**
     * 设置当前样式，会造成画布重绘.
     * @param {Object} ops 配置项
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
    }

    /**
     * 设置当前图层的数据
     * @param {Object} points 数据集
     */
    setData(points) {
        if (points) {
            checkGeoJSON(points, false, false);
            this._data = points;
        } else {
            this._data = [];
        }

        this._clearData();
        this._map && this._drawMap();
    }

    /**
     * 获取渲染的数据集
     */
    getRenderData() {
        return this._workerData;
    }

    /**
     * 清空数据
     */
    _clearData() {
        clearPushArray(this._workerData);
    }

    /**
     * 绘制当前图层
     */
    _toDraw() {
        this._drawMap();
    }

    /**
     * 绘制当前图层画布
     */
    _drawMap() {
        this._setState(State.computeBefore);
        let parameter = {
            data: this._getTransformData(),
            enable: false
        };

        this._postMessage('PolygonOverlay.calculatePixel', parameter, (pixels, margin) => {
            if (this._eventType == 'onmoving') {
                return;
            }
            this._setWorkerData(pixels);
            this._setState(State.conputeAfter);
            this._translation(margin.left - this._margin.left, margin.top - this._margin.top);
            pixels = null, margin = null;
        });
    }

    /**
     * 设置数据项
     * @param {Array} val 数据项
     */
    _setWorkerData(val) {
        this._data = [];
        clearPushArray(this._workerData, val);
    }

    /**
     * 获取转换后数据
     */
    _getTransformData() {
        return this._workerData.length > 0 ? this._workerData : this._data;
    }

    /**
     * 数据偏移转化
     * @param {*} distanceX X轴偏移
     * @param {*} distanceY Y轴偏移
     */
    _translation(distanceX, distanceY) {
        for (let i = 0; i < this._workerData.length; i++) {
            let geometry = this._workerData[i].geometry;
            let pixels = geometry.pixels;
            if (geometry.type == 'MultiPolygon') {
                for (let j = 0; j < pixels.length; j++) {
                    let pixelItem = pixels[j];
                    for (let k = 0, len = pixelItem.length; k < len; k++) {
                        let pixels = pixelItem[k];
                        for (let n = 0; n < pixels.length; n++) {
                            let pixel = pixels[n];
                            pixel[0] = pixel[0] + distanceX;
                            pixel[1] = pixel[1] + distanceY;
                        }
                    }
                }
            } else {
                for (let j = 0; j < pixels.length; j++) {
                    let pixelItem = pixels[j];
                    for (let k = 0, len = pixelItem.length; k < len; k++) {
                        let pixel = pixelItem[k];
                        pixel[0] = pixel[0] + distanceX;
                        pixel[1] = pixel[1] + distanceY;
                    }
                }
            }

        }
        this.refresh();
    }

    /**
     * 设置画布绘制状态
     * @param {Number} val 状态
     */
    _setState(val) {
        this._state = val;
        this._eventConfig.onState.call(this, this._state);
    }

    /**
     * 刷新当前图层
     */
    refresh() {

        this._setState(State.drawBefore);
        this._clearCanvas();
        this._drawPolygon(this.getRenderData());
        this._setState(State.drawAfter);
    }

    /**
     * 绘制线
     * @param {Object} pixels 
     * @param {Object} style 
     */
    _drawLine(pixels, style) {
        for (let j = 0; j < pixels.length; j++) {
            if (j == 0) {
                this._ctx.save();
                this._ctx.beginPath();
                let pixelItem = pixels[j];
                this._drawData(pixelItem);
                this._ctx.clip();
                this._clearCanvas();
                if(style.borderColor){
                    this._ctx.strokeStyle = style.borderColor;
                }
                if(style.borderWidth){
                    this._ctx.lineWidth = style.borderWidth;
                }
                this._ctx.stroke();
                this._ctx.restore();
                pixelItem = null;
            }
        }
    }

    /**
     * 绘制面
     * @param {Object} data 数据集
     */
    _drawPolygon(data) {
        let style = this._styleConfig;
        this._ctx.lineCap = 'round';
        this._ctx.lineJoin = 'round';
        this._ctx.miterLimit = 4;
        this._ctx.shadowColor = style.shadowColor || 'transparent';
        this._ctx.shadowBlur = style.shadowBlur || 10;
        this._ctx.shadowOffsetX = 0;
        this._ctx.shadowOffsetY = 0;
        this._ctx.fillStyle = style.backgroundColor;
        let size = this._map.getSize();
        this._ctx.fillRect(0, 0, size.width, size.height);
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            let geometry = item.geometry;
            let pixels = geometry.pixels;
            this._ctx.beginPath();
            if (geometry.type == 'MultiPolygon') {
                for (let k = 0; k < pixels.length; k++) {
                    this._drawLine(pixels[k], style);
                }

            } else {
                this._drawLine(pixels, style);
            }

        
        }
        this._ctx.closePath();
    }

    /**
     * 绘制当前图层数据
     * @param {Object} pixelItem 数据集
     */
    _drawData(pixelItem) {
        if (pixelItem.length == 0)
            return;
        let pixel = pixelItem[0];
        this._ctx.moveTo(pixel[0], pixel[1]);
        for (let k = 1, len = pixelItem.length; k < len; k++) {
            let item = pixelItem[k];
            if (pixel[0] != item[0] && pixel[1] != item[1]) {
                this._ctx.lineTo(pixelItem[k][0], pixelItem[k][1]);
                pixel = item;
            }
        }
    }
}