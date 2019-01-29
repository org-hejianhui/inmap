/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.29
 * Version: 0.0.1
 * Description: 文字图层组件，在地理位置上标记文字，可配置文字大小、颜色、背景阴影、以及鼠标事件等
 */
import Parameter from './base/Parameter';   // 参数解析类
import Config from '../config/LabelConfig'; // 文字图层组件配置类
import State from './../config/OnStateConfig';  // 状态类

export default class LabelOverlay extends Parameter {
    constructor(opts) {
        super(Config, opts);
        this._state = null;
    }

    /**
     * 样式发生变化会触发
     */
    _onOptionChange() {

    }

    /**
     * 数据发生变化会触发
     */
    _onDataChangee() {

    }

    /**
     * 设置样式风格
     * @param {Object} ops 
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
    }

    /**
     * 设置状态
     * @param {*} val 
     */
    _setState(val) {
        this._state = val;
        this._eventConfig.onState.call(this, this._state);
    }

    /**
     * 重新绘制图层
     */
    _toDraw() {
        this._drawMap();
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
        this.refresh();
    }

    /**
     * 重新绘制图层对象
     */
    _drawMap() {
        this._clearCanvas();
        this._setState(State.computeBefore);
        this._postMessage('HeatOverlay.pointsToPixels', this._getTransformData(), (pixels, margin, zoom) => {
            this._setState(State.conputeAfter);
            this._setWorkerData(pixels);
            this._updateOverClickItem();

            if (this._map.getZoom() == zoom) {
                this._translation(margin.left - this._margin.left, margin.top - this._margin.top);
            } else {
                this._translation(0, 0);
            }
            margin = null;
            pixels = null;
        });
    }

    /**
     * 更新图层对象内容
     */
    _updateOverClickItem() {
        let overArr = this._overItem ? [this._overItem] : [];
        let allItems = this._selectItem.concat(overArr);

        for (let i = 0; i < allItems.length; i++) {
            let item = allItems[i];
            let ret = this._workerData.find(function (val) {
                let itemCoordinates = item.geometry.coordinates;
                let valCoordinates = val.geometry.coordinates;
                return val && itemCoordinates[0] == valCoordinates[0] && itemCoordinates[1] == valCoordinates[1] && val.count == item.count;
            });
            item.geometry.pixel = ret.geometry.pixel;
        }
    }

    /**
     * 根据鼠标像素坐标获取数据项
     * @param {*} mouseX 
     * @param {*} mouseY 
     */
    _getTarget(mouseX, mouseY) {
        let data = this._workerData;
        for (let i = 0, len = data.length; i < len; i++) {
            let item = data[i];
            let pixel = item.geometry.pixel;
            let x1 = pixel.x - pixel.width / 2;
            let y1 = pixel.y;
            if (this._isMouseOver(mouseX, mouseY, x1, y1, pixel.width, pixel.height)) {
                return {
                    index: i,
                    item: item
                };
            }

        }
        return {
            index: -1,
            item: null
        };
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
    _isMouseOver(mouseX, mouseY, x, y, w, h) {
        return !(mouseX < x || mouseX > x + w || mouseY < y || mouseY > y + h);
    }

    /**
     * 根据选中的数据项获取索引
     * @param {*} item 
     */
    _findIndexSelectItem(item) {
        let index = -1;
        if (item) {
            index = this._selectItem.findIndex(function (val) {
                let itemCoordinates = item.geometry.coordinates;
                let valCoordinates = val.geometry.coordinates;
                return val && itemCoordinates[0] == valCoordinates[0] && itemCoordinates[1] == valCoordinates[1] && val.count == item.count;
            });
        }
        return index;
    }

    /**
     * 刷新图层
     */
    refresh() {
        this._setState(State.drawBefore);
        this._clearCanvas();
        this._drawLabel(this._ctx, this._workerData);
        this._setState(State.drawAfter);
    }

    /**
     * 
     * @param {*} index 
     * @param {*} item 
     */
    _swopData(index, item) {
        if (index > -1) {
            this._workerData[index] = this._workerData[this._workerData.length - 1];
            this._workerData[this._workerData.length - 1] = item;
        }
    }

    /**
     * 绘制标记文字
     * @param {*} ctx 上下文对象
     * @param {*} pixels 文字数据
     */
    _drawLabel(ctx, pixels) {
        ctx.textBaseline = 'top';
        for (let i = 0; i < pixels.length; i++) {
            let item = pixels[i];
            let pixel = item.geometry.pixel;
            ctx.beginPath();
            let style = this._setDrawStyle(item,true,i);
            ctx.font = style.font;
            ctx.fillStyle = style.color;

            if (style.shadowColor) {
                ctx.shadowColor = style.shadowColor || 'transparent';
                ctx.shadowBlur = style.shadowBlur || 10;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            let byteWidth = ctx.measureText(item.name).width;
            if (!pixel.width) {
                pixel['width'] = byteWidth;
                pixel['height'] = parseInt(style.font);
            }

            ctx.beginPath();
            ctx.fillText(item.name, pixel.x - byteWidth / 2, pixel.y);
            ctx.fill();
        }
    }
}