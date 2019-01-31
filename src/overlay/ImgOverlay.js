/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.30
 * Version: 0.0.1
 * Description: 自定义图标类型，建议使用svg格式效果更佳
 */
import Parameter from './base/Parameter';	// 接口定义，参数解析类
import ImgConfig from './../config/ImgConfig';	// 自定义图标类型配置类
import {
    isString,	// 是否是字符串
    merge,	// 数组合并
    typeOf	// 类型判断
} from './../common/Util';
import State from './../config/OnStateConfig';	// 图层状态类

/*
 * 点的绘制
 */
export default class ImgOverlay extends Parameter {
	
	/**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(opts) {
        super(ImgConfig, opts);
        this._cacheImg = {}; //缓存图片对象
        this._state = null;
    }
    
    /**
     * 绘制画布
     */
    _toDraw() {
        this._drawMap();
    }
    
    /**
     * 设置当前样式，会造成画布重绘.
     * @param {Object} opts 配置项
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
    }
    
    /**
     * 设置当前状态
     * @param {Number} val 状态值
     */
    _setState(val) {
        this._state = val;
        this._eventConfig.onState.call(this, this._state);
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
            pixel = null;
        }

        this.refresh();

    }
    
    /**
     * 绘制当前图层
     */
    _drawMap() {

        this._setState(State.computeBefore);
        this._postMessage('HeatOverlay.pointsToPixels', this._getTransformData(), (pixels, margin) => {
            if (this._eventType == 'onmoving') {
                return;
            }
            this._setState(State.conputeAfter);

            this._setWorkerData(pixels);
            this._translation(margin.left - this._margin.left, margin.top - this._margin.top);
            margin = null;
            pixels = null;

        });
    }

	/**
     * 判断鼠标坐标是否在范围内
     * @param {*} mouseX 鼠标X轴坐标
     * @param {*} mouseY 鼠标Y轴坐标
     * @param {*} x 目标对象 x
     * @param {*} y 目标对象 y
     * @param {*} w 目标对象 w
     * @param {*} h 目标对象 h
     */
    _isMouseOver(x, y, imgX, imgY, imgW, imgH) {
        return !(x < imgX || x > imgX + imgW || y < imgY || y > imgY + imgH);
    }
    
     /**
     * 根据鼠标像素坐标获取数据项
     * @param {*} mouseX 
     * @param {*} mouseY 
     */
    _getTarget(x, y) {
        let pixels = this._workerData;

        for (let i = 0, len = pixels.length; i < len; i++) {
            let item = pixels[i];
            let pixel = item.geometry.pixel;
            let style = this._setDrawStyle(item, i);
            let img;
            if (isString(img)) {
                img = this._cacheImg[style.icon];
            } else {
                img = style.icon;
            }

            //img  Not Loaded return 
            if (!img) break;
            if (style.width && style.height) {
                let xy = this._getDrawXY(pixel, style.offsets.left, style.offsets.top, style.width, style.height, 1);

                if (this._isMouseOver(x, y, xy.x, xy.y, style.width, style.height)) {
                    return {
                        index: i,
                        item: item
                    };
                }
            } else {

                let xy = this._getDrawXY(pixel, style.offsets.left, style.offsets.top, style.width, style.height);
                if (this._isMouseOver(x, y, xy.x, xy.y, img.width, img.height)) {

                    return {
                        index: i,
                        item: item
                    };
                }

            }

        }
        return {
            index: -1,
            item: null
        };


    }
    
     /**
     * 查询选中列表的索引
     * @param {*} item 
     */
    _findIndexSelectItem(item) {
        let index = -1;
        if (item) {
            index = this._selectItem.findIndex(function (val) {
                return val && val.lat == item.lat && val.lng == item.lng;
            });
        }

        return index;
    }
    
    /**
     * 刷新当前图层
     */
    refresh() {
        this._setState(State.drawBefore);
        this._clearCanvas();
        this._loopDraw(this._ctx, this._workerData);
        this._setState(State.drawAfter);

    }
    
    
    /**
     * 图标加载
     * @param {*} img 图标
     * @param {*} fun 回调函数
     */
    _loadImg(img, fun) {
        let me = this;
        if (isString(img)) {
            let image = me._cacheImg[img];
            if (!image) {
                let image = new Image();
                image.src = img;
                image.onload = function () {
                    me._cacheImg[img] = image;
                    fun(image);
                };
            } else {
                fun(image);
            }

        } else {
            fun(img);
        }
    }
    
    /**
     * 判断是否百分比
     */
    _isPercent(val) {
        if (val.toString().indexOf('%') > -1) {
            return true;
        } else {
            return false;
        }

    }
    
    /**
     * 获取偏移的坐标
     * @param {*} pixel 像素坐标
     * @param {*} offsetL 左偏移量 
     * @param {*} offsetT 右偏移量
     * @param {*} width 图标宽度
     * @param {*} height 图标的高度
     */
    _getDrawXY(pixel, offsetL, offsetT, width, height) {
        let x = 0,
            y = 0;
        let scaleW = width;
        let scaleH = height;
        let offsetLeft = parseFloat(offsetL);
        let offsetTop = parseFloat(offsetT);

        if (this._isPercent(offsetL)) {
            x = pixel.x + scaleW * offsetLeft / 100;
        } else {
            x = pixel.x + offsetLeft;
        }
        if (this._isPercent(offsetT)) {
            y = pixel.y + scaleH * offsetTop / 100;
        } else {
            y = pixel.y + offsetTop;
        }
        return {
            x: x,
            y: y
        };
    }
    
    /**
     * 根据用户配置，设置用户绘画样式
     * @param {*} item 
     */
    _setDrawStyle(item, i) {
        let normal = this._styleConfig.normal; //正常样式
        let result = merge({}, normal);
        let count = parseFloat(item.count);

        //区间样式
        let splitList = this._styleConfig.splitList,
            len = splitList.length;
        len = splitList.length;
        if (len > 0 && typeOf(count) !== 'number') {
            throw new TypeError(`zcmap: data index Line ${i}, The property count must be of type Number! about geoJSON, visit http://zcmap.talkingdata.com/#/docs/v2/Geojson`);
        }
        for (let i = 0; i < len; i++) {
            let condition = splitList[i];
            if (condition.end == null) {
                if (count >= condition.start) {
                    Object.assign(result, normal, condition);
                    break;
                }
            } else if (count >= condition.start && count < condition.end) {
                Object.assign(result, normal, condition);
                break;
            }
        }

        return result;

    }
    
    /**
     * 循环绘制
     * @param {*} ctx 上下文
     * @param {*} pixels 数据集
     */
    _loopDraw(ctx, pixels) {
        let mapSize = this._map.getSize();
        for (let i = 0, len = pixels.length; i < len; i++) {
            let item = pixels[i];
            let pixel = item.geometry.pixel;
            let style = this._setDrawStyle(item, i);
            if (pixel.x > -style.width && pixel.y > -style.height && pixel.x < mapSize.width + style.width && pixel.y < mapSize.height + style.height) {
                this._loadImg(style.icon, (img) => {
                    if (style.width && style.height) {
                        let xy = this._getDrawXY(pixel, style.offsets.left, style.offsets.top, style.width, style.height);
                        this._drawImage(this._ctx, img, xy.x, xy.y, style.width, style.height);

                    } else {
                        let xy = this._getDrawXY(pixel, style.offsets.left, style.offsets.top, img.width, img.height, 1);
                        this._drawImage(this._ctx, img, xy.x, xy.y, img.width, img.height);
                    }
                });
            }
        }
    }
    
    /**
     * 绘制图标
     * @param {*} ctx 上下文
     * @param {*} img 图标
     * @param {*} x 图标 x
     * @param {*} y 图标 y
     * @param {*} w 图标宽度
     * @param {*} h 图标的高度
     */
    _drawImage(ctx, img, x, y, width, height) {
        ctx.drawImage(img, x, y, width, height);
    }
}