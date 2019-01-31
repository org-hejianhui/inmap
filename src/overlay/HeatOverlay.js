/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 热力图层
 */
import CanvasOverlay from './base/CanvasOverlay';   // 图层绘制类
import {
    merge,  // 数组合并
    clearPushArray, // 清空数组并添加新内容
    checkGeoJSON    // GeoJSON 格式校验
} from './../common/Util';

import HeatConfig from './../config/HeatConfig';    // 热力图层配置类
import State from './../config/OnStateConfig';  // 绘制图层状态
export default class HeatOverlay extends CanvasOverlay {

    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(ops) {
        super(ops);
        this._data = [];
        this._workerData = [];
        this._setStyle(HeatConfig, ops);
        this._delteOption();
        this._state = null;
    }

    /**
     * 设置当前样式，会造成画布重绘
     * @param {Object} ops HeatOverlayOption
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
    }

    /**
     * 绘制当前图层
     */
    _toDraw() {
        this._drawMap();
    }

    /**
     * 获取渲染的数据集
     */
    getRenderData() {
        return this._workerData;
    }

    /**
     * 获取转换后数据
     */
    _getTransformData() {
        return this._workerData.length > 0 ? this._workerData : this._data;
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
        this._styleConfig = option.style;
        this._eventConfig = option.event;
        this._gradient = option.style.gradient;
        this._palette = this._getColorPaint();
        if (ops.data !== undefined) {
            this.setData(ops.data);
        } else {
            this._map && this.refresh();
        }
        this._tMapStyle(option.skin);

    }

    /**
     * 检查 GeoJSON 数据集
     * @param {Object} data 数据集
     */
    _checkGeoJSON(data) {
        checkGeoJSON(data, this._option.checkDataType.name, this._option.checkDataType.count);
    }
    
    /**
     * 设置当前图层的数据
     * @param {Object} points 数据集
     */
    setData(points) {
        if (points) {
            this._data = points;
            this._checkGeoJSON(points);
        } else {
            this._data = [];
        }
        clearPushArray(this._workerData, []);
        this._map && this._drawMap();
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
     * 屏蔽参数
     */
    _delteOption() {
        this._tooltipConfig = {
            show: false
        };
        this._legendConfig = {
            show: false
        };
    }

    /**
     * 获取最大的数值
     */
    _getMax() {
        let normal = this._styleConfig;
        normal.maxValue = 0;
        for (let i = 0, len = this._data.length; i < len; i++) {
            if (this._data[i].count > normal.maxValue) {
                normal.maxValue = this._data[i].count;
            }
        }
    }

    /**
     * 数据偏移转化
     * @param {*} distanceX X轴偏移
     * @param {*} distanceY Y轴偏移
     */
    _translation(distanceX, distanceY) {
        for (let i = 0; i < this._workerData.length; i++) {
            let pixel = this._workerData[i].geometry.pixel;
            pixel.x = pixel.x + distanceX;
            pixel.y = pixel.y + distanceY;
        }
        this._setState(State.drawBefore);
        this.refresh();
        this._setState(State.drawAfter);

    }

    /**
     * 设置数据项
     * @param {Array} val 数据项
     */
    _setWorkerData(val) {
        this._data = []; //优化
        clearPushArray(this._workerData, val);
    }

    /**
     * 绘制当前图层画布
     */
    _drawMap() {
        this._setState(State.computeBefore);

        this._postMessage('HeatOverlay.pointsToPixels', this._getTransformData(), (pixels, margin) => {

            if (this._eventType == 'onmoving') {
                return;
            }
            this._setWorkerData(pixels);
            this._setState(State.conputeAfter);

            this._translation(margin.left - this._margin.left, margin.top - this._margin.top);

            margin = null;
            pixels = null;

        });
    }

    /**
     * 刷新当前图层
     */
    refresh() {
        this._clearCanvas();

        let normal = this._styleConfig;
        let mapSize = this._map.getSize();
        if (normal.maxValue == 0) {
            this._getMax();
        }
        if (mapSize.width <= 0) {
            return;
        }

        let ctx = this._ctx;
        for (let i = 0, len = this._workerData.length; i < len; i++) {
            let item = this._workerData[i];
            let pixel = item.geometry.pixel;
            if (pixel.x > -normal.radius && pixel.y > -normal.radius && pixel.x < mapSize.width + normal.radius && pixel.y < mapSize.height + normal.radius) {
                let opacity = (item.count - normal.minValue) / (normal.maxValue - normal.minValue);
                opacity = opacity > 1 ? 1 : opacity;
                this._drawPoint(pixel.x, pixel.y, normal.radius, opacity);
            }

        }

        let palette = this._palette;
        let img = ctx.getImageData(0, 0, mapSize.width * this._devicePixelRatio, mapSize.height * this._devicePixelRatio);
        let imgData = img.data;

        let max_opacity = normal.maxOpacity * 255;
        let min_opacity = normal.minOpacity * 255;
        //权重区间
        let max_scope = (normal.maxScope > 1 ? 1 : normal.maxScope) * 255;
        let min_scope = (normal.minScope < 0 ? 0 : normal.minScope) * 255;
        let len = imgData.length;
        for (let i = 3; i < len; i += 4) {
            let alpha = imgData[i];
            let offset = alpha * 4;
            if (!offset) {
                continue;
            }
            imgData[i - 3] = palette[offset];
            imgData[i - 2] = palette[offset + 1];
            imgData[i - 1] = palette[offset + 2];

            // 范围区间
            if (imgData[i] > max_scope) {
                imgData[i] = 0;
            }
            if (imgData[i] < min_scope) {
                imgData[i] = 0;
            }

            // 透明度
            if (imgData[i] > max_opacity) {
                imgData[i] = max_opacity;
            }
            if (imgData[i] < min_opacity) {
                imgData[i] = min_opacity;
            }
        }

        ctx.putImageData(img, 0, 0, 0, 0, mapSize.width * this._devicePixelRatio, mapSize.height * this._devicePixelRatio);
    }

    /**
     * 绘制圆点
     * @param {*} x x轴坐标
     * @param {*} y y轴坐标
     * @param {*} radius 半径范围
     * @param {*} opacity 透明度
     */
    _drawPoint(x, y, radius, opacity) {
        let ctx = this._ctx;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        let gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 获取颜色渐变
     */
    _getColorPaint() {
        let gradientConfig = this._gradient;
        let paletteCanvas = document.createElement('canvas');
        let paletteCtx = paletteCanvas.getContext('2d');

        paletteCanvas.width = 256;
        paletteCanvas.height = 1;

        let gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
        for (let key in gradientConfig) {
            gradient.addColorStop(key, gradientConfig[key]);
        }

        paletteCtx.fillStyle = gradient;
        paletteCtx.fillRect(0, 0, 256, 1);
        return paletteCtx.getImageData(0, 0, 256, 1).data;
    }

}