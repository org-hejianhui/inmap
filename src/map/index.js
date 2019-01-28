/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 地图实例对象
 */
import {
    isString, // 是否是字符串
    merge, // 数组合并
    isArray // 是否是数组
} from './../common/Util';
import {
    WhiteLover, // 白色
    Blueness    // 蓝色
} from './../config/MapStyleConfig';    // 地图风格样式
import MapZoom from './mapZoom';    // 地图缩放对象
import Toolbar from './Toolbar';    // 地图工具对象
import MapConfig from '../config/MapConfig';    // 地图全局配置
import Config from '../config/Config';  // 项目配置
import MultiOverlay from '../overlay/base/MultiOverlay';    // 复杂多图层父类
import './style/index.less';    // 地图样式

export default class Map {

    /**
     * Map 构造函数
     * @param {object} ops 暴漏外部配置项
     */
    constructor(ops) {
        this._map = null;
        this._option = merge(MapConfig, ops);
        this._create();
    }

    /**
     * 地图风格样式
     * @param {object} map 地图对象
     * @param {string|Array} skin 样式皮肤
     */
    _tMapStyle(map, skin) {
        let styleJson = null;
        if (isString(skin)) {
            styleJson = skin == 'Blueness' ? Blueness : WhiteLover;
        } else if (isArray(skin)) {
            styleJson = skin;
        }
        skin && map && map.setMapStyle({
            styleJson: styleJson
        });
    }

    /**
     * 创建Map对象，基于百度地图
     */
    _create() {
        let id = this._option.id;

        let mapDom = isString(id) ? document.getElementById(id) : id;
        let bmap = new BMap.Map(mapDom, {
            enableMapClick: false   //构造底图时，关闭底图可点功能
        });
        bmap.enableScrollWheelZoom(); // 启用滚轮放大缩小
        bmap.disableDoubleClickZoom();  // 禁用双击放大
        bmap.enableKeyboard();  // 启用键盘操作

        //设置皮肤
        this._tMapStyle(bmap, this._option.skin);

        // 创建工具对象
        bmap._inmapToolBar = new Toolbar(mapDom);

        // 设置地图中心点，及缩放比例
        let center = this._option.center;

        bmap.centerAndZoom(new BMap.Point(center[0], center[1]), this._option.zoom.value);
        bmap.setMinZoom(this._option.zoom.min);
        bmap.setMaxZoom(this._option.zoom.max);

        if (this._option.zoom.show) {
            //添加地图级别工具条
            let mapZoom = new MapZoom(bmap, mapDom, this._option.zoom);
            bmap.addEventListener('zoomend', () => {
                mapZoom.setButtonState();
            });
        }
        this._map = bmap;

        // 绑定地图移动结束时触发此事件
        bmap.addEventListener('moveend', () => {
            if (Config.devtools) { //开发模式
                this.printMapInfo();
            }
        });

        // 绑定地图更改缩放级别结束时触发触发此事件
        bmap.addEventListener('zoomend', () => {
            if (Config.devtools) { //开发模式
                this.printMapInfo();
            }
        });

    }
    
    /**
     * 打印日志
     */
    printMapInfo() {
        let center = this._map.getCenter();
        console.log(`Map: center:${JSON.stringify(center)} zoom:${this._map.getZoom()}`);
    }

    /**
     * 获取 Map 对象
     */
    getMap() {
        return this._map;
    }

    /**
     * 增加覆盖物对象
     * @param {object} overlay 覆盖物对象
     */
    add(overlay) {
        if (overlay._isDispose) {
            throw new TypeError('inMap: overlay has been destroyed.');
        } else if (overlay instanceof MultiOverlay) {
            overlay._init(this._map);
        } else {
            this._map.addOverlay(overlay);
        }

    }

    /**
     * 移除覆盖物对象
     * @param {object} overlay 覆盖物对象
     */
    remove(overlay) {
        if (overlay && !overlay._isDispose) {
            overlay.dispose();
        }
        overlay = null;
    }

}