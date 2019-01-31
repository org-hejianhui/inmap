/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 线路的动画图层,一般不单独使用，跟LineStringOverlay 图层一块使用
 */
import CanvasOverlay from './base/CanvasOverlay.js';    // 图层绘制类
import {
    merge,  // 数组合并
    clearPushArray, // 清空数组并添加新内容
    checkGeoJSON    // GeoJSON 格式校验
} from '../common/Util.js';

import LineStringAnimationConfig from './../config/LineStringAnimationConfig';  // 线路的动画图层配置类

/**
 * 标记线
 */
class MarkLine {

    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(opts) {
        this.path = opts.path;
        this.step = 0;
    }

    /**
     * 绘制Marker标记
     * @param {*} context 
     * @param {*} map 
     */
    drawMarker(context, map) {
        this.from.draw(context, map);
        this.to.draw(context, map);
    }

    /**
     * 绘制线
     * @param {*} context 
     * @param {*} styleConfig 
     */
    drawLinePath(context, styleConfig) {
        let pointList = this.path;
        let len = pointList.length;
        context.save();
        context.beginPath();
        context.lineWidth = styleConfig.lineWidth;
        context.strokeStyle = styleConfig.colors[this.id];

        if (!styleConfig.lineType || styleConfig.lineType == 'solid') {
            context.moveTo(pointList[0][0], pointList[0][1]);
            for (let i = 0; i < len; i++) {
                context.lineTo(pointList[i][0], pointList[i][1]);
            }
        } else if (styleConfig.lineType == 'dashed' || styleConfig.lineType == 'dotted') {
            for (let i = 1; i < len; i += 2) {
                context.moveTo(pointList[i - 1][0], pointList[i - 1][1]);
                context.lineTo(pointList[i][0], pointList[i][1]);
            }
        }
        context.stroke();
        context.restore();
    }

    /**
     * 绘制移动的圆点
     * @param {*} context 
     * @param {*} styleConfig 
     */
    drawMoveCircle(context, styleConfig) {
        let pointList = this.path;
        if (pointList.length <= 0) return;
        context.save();
        context.fillStyle = styleConfig.fillColor;
        context.shadowColor = styleConfig.shadowColor;
        context.shadowBlur = styleConfig.shadowBlur;
        context.beginPath();
        context.arc(pointList[this.step][0], pointList[this.step][1], styleConfig.size, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
        context.restore();
        this.step += 1;
        if (this.step >= pointList.length) {
            this.step = 0;
        }
    }
}

/**
 * 线路的动画图层
 */
export default class LineStringAnimationOverlay extends CanvasOverlay {

    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(ops) {
        super(ops);
        this._data = [];
        this._workerData = [];
        this._markLineData = [];
        this._setStyle(LineStringAnimationConfig, ops);
    }

    /**
     * 设置当前样式，会造成画布重绘
     * @param {Object} ops 数据集
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
        this._map && this._drawMap();
    }

    /**
     * 设置样式
     * @param {Object} config 默认配置项
     * @param {Object} ops 参数配置项
     */
    _setStyle(config, ops) {
        ops = ops || {};
        let option = this._option = merge(config, ops);
        this._styleConfig = option.style;
        this._eventConfig = option.event;
        this._tMapStyle(option.skin);

        delete this._option.data;

        if (ops.data !== undefined) {
            this.setData(ops.data);
        } else {
            this._map && this.refresh();
        }

    }

    /**
     * 数据偏移转化
     * @param {*} distanceX X轴偏移
     * @param {*} distanceY Y轴偏移
     */
    _translation(distanceX, distanceY) {
        for (let i = 0; i < this._markLineData.length; i++) {
            let pixels = this._markLineData[i].path;
            for (let j = 0; j < pixels.length; j++) {
                let pixel = pixels[j];
                pixel[0] = pixel[0] + distanceX;
                pixel[1] = pixel[1] + distanceY;
            }
        }
        this.refresh();
    }

    /**
     * 设置当前图层的数据
     * @param {Object} points 数据集
     */
    setData(points) {
        if (points) {
            this._data = points;
            checkGeoJSON(points, this._option.checkDataType.name, this._option.checkDataType.count);
        } else {
            this._data = [];
        }
        clearPushArray(this._workerData);
        this._map && this._drawMap();
    }

    /**
     * 绘制当前图层
     */
    _toDraw() {
        if (!this.animationDraw) {
            this._initAnimation();
        }
        this._drawMap();
    }

    /**
     * 获取转换后数据
     */
    _getTransformData() {
        return this._workerData.length > 0 ? this._workerData : this._data;
    }

    /**
     * 重新绘制当前图层画布
     */
    _drawMap() {
        let zoomUnit = Math.pow(2, 18 - this._map.getZoom());
        let projection = this._map.getMapType().getProjection();
        let mcCenter = projection.lngLatToPoint(this._map.getCenter());
        let nwMc = new BMap.Pixel(mcCenter.x - this._map.getSize().width / 2 * zoomUnit, mcCenter.y + this._map.getSize().height / 2 * zoomUnit); //左上角墨卡托坐标

        let params = {
            points: this._getTransformData(),
            nwMc: nwMc,
            zoomUnit: zoomUnit,
            isAnimation: true,
            lineOrCurve: this._styleConfig.lineOrCurve,
            deltaAngle: this._styleConfig.deltaAngle
        };

        this._animationFlag = false;
        this._postMessage('LineStringOverlay.calculatePixel', params, (pixels, margin) => {
            if (this._eventType == 'onmoving') {
                this._animationFlag = false;
                return;
            }
            this._animationFlag = true;
            clearPushArray(this._workerData, pixels);
            this._createMarkLine(pixels);
            this._translation(margin.left - this._margin.left, margin.top - this._margin.top);
            params = null;
            margin = null;
        });
    }

    /**
     * 创建标记线
     * @param {Object} data 数据项
     */
    _createMarkLine(data) {
        clearPushArray(this._markLineData);
        for (let i = 0; i < data.length; i++) {
            let pixels = data[i].geometry.pixels;
            this._markLineData.push(new MarkLine({
                path: pixels
            }));
        }
    }

    /**
     * 初始化动画效果
     */
    _initAnimation() {
        let now;
        let then = Date.now();
        let interval = 1000 / this._styleConfig.fps;
        let delta;
        let me = this;

        function drawFrame() {
            !me.isDispose && requestAnimationFrame(drawFrame);
            now = Date.now();
            delta = now - then;
            if (delta > interval) {
                then = now - (delta % interval);
                me.refresh();
            }
        }
        this.animationDraw = drawFrame;
        this.animationDraw();

    }

    /**
     * 刷新当前图层
     */
    refresh() {
        let {
            _markLineData,
            _styleConfig
        } = this;

        if (!this._ctx) {
            return;
        }

        if (!this._animationFlag) {
            this._clearCanvas();
            return;
        }
        this._ctx.fillStyle = 'rgba(0,0,0,0.93)';
        let prev = this._ctx.globalCompositeOperation;
        this._ctx.globalCompositeOperation = 'destination-in';
        let size = this._map.getSize();
        this._ctx.fillRect(0, 0, size.width, size.height);
        this._ctx.globalCompositeOperation = prev;

        for (let i = 0; i < _markLineData.length; i++) {
            let markLine = _markLineData[i];
            markLine.drawMoveCircle(this._ctx, _styleConfig, this._map);
        }
    }
}