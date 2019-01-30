/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.30
 * Version: 0.0.1
 * Description: 散点动画图层组件，散点的动画图层，一般不单独使用，跟其他图层一起使用，增强效果
 */
import CanvasOverlay from './base/CanvasOverlay.js';	// 图层绘制类
import {
    merge,	// 数组合并
    isArray	// 是否是数组
} from './../common/Util';
import config from '../config/PointAnimation';	// 散点动画参数结构


/**
 * 点标记对象
 */
class Marker {
	
	 /**
     * 构造函数
     * @param {Object} opts 配置项
     * @param {Object} data 数据集
     * @param {Object} map 地图对象
     */
    constructor(opts, data, map) {
        this.city = opts.name;
        this.location = new BMap.Point(data.geometry.coordinates[0], data.geometry.coordinates[1]);
        this.pixel = map.pointToPixel(this.location);
        this.color = opts.color;
        this.speed = opts.speed;
        this.radius = 0;
        this.size = opts.size;
    }
    
    /**
     * 点标记绘制
     * @param {Object} context 上下文对象 
     */
    draw(context) {
        let pixel = this.pixel;
        context.save();
        context.beginPath();
        context.strokeStyle = this.color;
        context.moveTo(pixel.x + pixel.radius, pixel.y);
        context.arc(pixel.x, pixel.y, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.closePath();
        context.restore();
        this.radius += this.speed;
        if (this.radius > this.size) {
            this.radius = 0;
        }
    }

}

/**
 * 散点动画图层组件
 */
export default class PointAnimationOverlay extends CanvasOverlay {
	
	/**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(ops) {
        super();
        this._data = [];
        this._styleConfig = null;
        this._markers = [];
        this._render = this._render.bind(this);
        this.setOptionStyle(ops);
    }
    
    /**
     * 图层绘制初始化
     */
    _canvasInit() {
        this._addMarker();
        let now, me = this;
        let then = Date.now();
        let interval = 1000 / 25;
        let delta;
        let _render = this._render;
        (function drawFrame() {
            !me.isDispose && requestAnimationFrame(drawFrame);
            now = Date.now();
            delta = now - then;
            if (delta > interval) {
                then = now - (delta % interval);
                _render();
            }
        }());
    }
    
    /**
     * 设置当前样式，会造成画布重绘
     */
    setOptionStyle(ops) {
        if (!ops) return;
        let option = merge(config, ops);
        this._styleConfig = option.style;
        this._tMapStyle(option.skin);
        if (ops.data === null) {
            option.data = [];
        } else if (ops.data === undefined) {
            option.data = this._data;
        }
        this.setData(option.data);
    }
    
    /**
     * 设置当前图层的数据
     */
    setData(points) {
        if (points) {
            if (!isArray(points)) {
                throw new TypeError('inMap: data must be a Array');
            }
            this._data = points;
        } else {
            this._data = [];
        }

        this._map && this._addMarker();
    }
    
     /**
     * 数据偏移转化
     * @param {*} distanceX X轴偏移
     * @param {*} distanceY Y轴偏移
     */
    _translation(distanceX, distanceY) {

        for (let i = 0; i < this._markers.length; i++) {
            let pixel = this._markers[i].pixel;
            pixel.x = pixel.x + distanceX;
            pixel.y = pixel.y + distanceY;
        }

    }
    
    /**
     * 添加点标记
     */
    _addMarker() {
        this._markers = [];
        for (let i = 0; i < this._data.length; i++) {
            let style = merge(this._styleConfig, this._data[i].style || {});
            this._markers.push(new Marker(style, this._data[i], this._map));
        }

    }
    
    /**
     * 绘制当前图层
     */
    _toDraw() {
        this._addMarker();
        this._canvasResize();
    }
    
    /**
     * 渲染当前图层
     */
    _render() {
        let ctx = this._ctx;
        if (!ctx) {
            return;
        }
        if (!this._animationFlag) {
            this._clearCanvas();
            return;
        }

        let size = this._map.getSize();
        ctx.fillStyle = 'rgba(0,0,0,.95)';
        let prev = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'destination-in';

        ctx.fillRect(0, 0, size.width, size.height);
        ctx.globalCompositeOperation = prev;

        for (let i = 0; i < this._markers.length; i++) {
            let marker = this._markers[i];
            marker.draw(ctx);
        }
    }
}