/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 地图图例实例对象
 */
import Color from '../common/Color';    // 颜色工具类
import config from '../config/LegendConfig';    // 图例配置类
import {
    isArray,    // 判断目标参数是否Array对象
    isString,   // 是否是字符串
    isEmpty,    // 是否为空
    isBoolean,  // 是否为boolean类型
    merge   // 数组合并
} from '../common/Util';
export default class Legend {

    /**
     * Legend 构造函数
     * @param {Object} toolDom 图例dom
     * @param {Object} opts 配置项
     */
    constructor(toolDom, opts) {
        this._opts = opts || config;
        this._dom = this._crateDom(toolDom);
        this.hide();
    }
    
    /**
     * 创建图例dom
     * @param {Object} toolDom 
     */
    _crateDom(toolDom) {
        let div = document.createElement('div');
        div.classList.add('zcmap-legend');
        toolDom.appendChild(div);
        return div;
    }

    /**
     * 图例显示
     */
    show() {
        this._dom.style.display = 'inline-block';
    }

    /**
     * 图例隐藏
     */
    hide() {
        this._dom.style.display = 'none';
    }

    /**
     * 小数格式化
     * @param {*} num 小数
     */
    _toFixed(num) {
        return isNaN(num) ? num : parseFloat(num).toFixed(this._opts.toFixed);
    }

    /**
     * 设置标题
     * @param {String} title 
     */
    setTitle(title) {
        this._opts.title = title;
        this._render();
    }

    /**
     * 设置配置项
     * @param {Object} opts 
     */
    setOption(opts) {
        this._opts = merge(config, this._opts, opts);
        this._opts.list = this._opts.list || [];
        this._render();
    }

    /**
     * 设置数据项
     * @param {Array} list 
     */
    setItems(list) {
        this._opts.list = list;
        this._render();
    }

    /**
     * 数据验证
     */
    _verify() {
        let {
            show,
            title,
            list,
        } = this._opts;
        if (!isBoolean(show)) {
            throw new TypeError('zcMap: legend options show must be a Boolean');
        }
        if (!isEmpty(title) && !isString(title)) {
            throw new TypeError('zcMap: legend options title must be a String');
        }
        if (!isArray(list)) {
            throw new TypeError('zcMap: legend options list must be a Array');
        }


    }

    /**
     * 图例渲染
     */
    _render() {
        this._verify();
        let {
            show,
            title,
            list
        } = this._opts;
        if (show) {
            this.show();
        } else {
            this.hide();
            return;
        }

        let str = '';
        if (title) {
            str = `<div class="zcmap-legend-title">${title} </div>`;
        }

        str += '<table cellpadding="0" cellspacing="0">';
        list.forEach((val, index) => {
            let text = null,
                backgroundColor = val.backgroundColor;
            let isShow = backgroundColor != null;
            let legendBg = new Color(backgroundColor),
                difference = 0.2;

            let opacity = val.opacity;
            if (opacity) {
                opacity += difference;
            }
            if (legendBg.a) {
                opacity = legendBg.a + difference;
            } else {
                opacity = 1;
            }
            backgroundColor = legendBg.getRgbaValue(opacity);
            if (val.text) {
                text = val.text;
            } else if (this._opts.formatter) {
                if (val.start == val.end) {
                    text = `${this._opts.formatter(val.start, index, val)}`;
                } else {
                    text = `${val.start==null?'-<span class="zcmap-infinity"></span>': this._opts.formatter(val.start, index, val)} ~ ${ val.end==null ?'+<span class="zcmap-infinity"></span>':this._opts.formatter(val.end, index, val)}`;
                }

            } else {
                //相等
                if (val.start == val.end) {
                    text = `${this._toFixed(val.start)}`;
                } else {
                    text = `${val.start==null?'-<span class="zcmap-infinity"></span>': this._toFixed(val.start)} ~ ${ val.end==null ?'+<span class="zcmap-infinity"></span>':this._toFixed(val.end)}`;
                }
            }
            let td = isShow ? ` <td style="background:${backgroundColor}; width:17px;height:17px;"></td>` : '';
            str += `
                <tr>
                   ${td}
                    <td class="zcmap-legend-text">
                       ${text}
                    </td>
                </tr>
                `;
        });
        str += '</table>';
        if (list.length <= 0) {
            this.hide();
        }
        this._dom.innerHTML = str;

    }

    /**
     * 释放对象
     */
    dispose() {
        this._dom.parentNode.removeChild(this._dom);
        this._opts = null;
        this._dom = null;

    }
}