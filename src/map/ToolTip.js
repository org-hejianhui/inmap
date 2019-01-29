/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 地图提示框实例对象
 */
import {
    isString,   // 是否是字符串
    isFunction, // 是否是函数
    merge   // 数组合并
} from '../common/Util';
export default class ToolTip {

    /**
     * 地图提示框对象构造函数
     * @param {*} toolDom 工具栏dom
     */
    constructor(toolDom) {
        this._dom = this._create(toolDom);
        this._tooltipTemplate = null;
        this._opts = {};
        this.hide();
    }

    /**
     * 创建地图提示框dom
     * @param {*} toolDom  工具栏dom
     */
    _create(toolDom) {
        let dom = document.createElement('div');
        dom.classList.add('zcmap-tooltip');
        toolDom.appendChild(dom);
        return dom;
    }
    
    /**
     * 提示框模版格式化
     * @param {*} formatter 
     */
    _compileTooltipTemplate(formatter) {
        //语法解析 先暂时不支持ie11
        let RexStr = /\{|\}/g;
        formatter = formatter.replace(RexStr, function (MatchStr) {
            switch (MatchStr) {
                case '{':
                    return 'overItem.';
                case '}':
                    return '';
                default:
                    break;
            }
        });
        this._tooltipTemplate = new Function('overItem', 'return ' + formatter);
    }

    /**
     * 提示框显示位置偏移计算
     * @param {*} c x轴点
     * @param {*} y y轴点 
     */
    show(x, y) {
        let {
            left,
            top
        } = this._opts.offsets;
        this._dom.style.left = x + left + 'px';
        this._dom.style.top = y + top + 'px';
        this._dom.style.display = 'block';
    }

    /**
     * 居中显示内容
     * @param {*} text 文本内容
     * @param {*} x x轴点
     * @param {*} y y轴点
     */
    showCenterText(text, x, y) {
        this._dom.innerHTML = text;
        this._dom.style.display = 'block';
        this._dom.style.visibility = 'hidden';
        let width = this._dom.offsetWidth;
        this._dom.style.left = x - (width / 2) + 'px';
        this._dom.style.top = y + 'px';
        this._dom.style.visibility = 'visible';
    }

    /**
     * 显示内容
     * @param {*} text 文本内容
     * @param {*} x x轴点
     * @param {*} y y轴点
     */
    showText(text, x, y) {
        this._dom.innerHTML = text;
        this._dom.style.left = x + 'px';
        this._dom.style.top = y + 'px';
        this._dom.style.display = 'block';
    }

    /**
     * 隐藏提示框
     */
    hide() {
        this._dom.style.display = 'none';
    }

    /**
     * 设置配置项
     * @param {Object} opts 
     */
    setOption(opts) {
        let result = merge(this._opts, opts);
        let {
            formatter,
            customClass
        } = result;

        if (isString(formatter)) { //编译字符串
            this._compileTooltipTemplate(result.formatter);
        }

        if (this._opts.customClass) {
            this._dom.classList.remove(this._opts.customClass);
        }

        this._dom.classList.add(customClass);
        this._opts = result;
    }

    /**
     * 提示框组件渲染
     * @param {*} event 
     * @param {*} overItem 
     */
    render(event, overItem) {
        if (!this._opts.show) return;
        if (overItem) {
            let formatter = this._opts.formatter;
            if (isFunction(formatter)) {
                this._dom.innerHTML = formatter(overItem);
            } else if (isString(formatter)) {
                this._dom.innerHTML = this._tooltipTemplate(overItem);
            }
            this.show(event.offsetX, event.offsetY);
        } else {
            this.hide();
        }

    }

    /**
     * 释放对象
     */
    dispose() {
        this._dom.parentNode.removeChild(this._dom);
        this._tooltipTemplate = null;
        this._opts = null;
        this._dom = null;
    }
}