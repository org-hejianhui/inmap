/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 数据分批间断执行
 */
import {
    chunk   // 数组检查
} from '../../common/Util';
/**
 * 数据分批间断执行
 */
export default class BatchesData {

    /**
     * 构造函数
     * @param {Object} option 
     */
    constructor(option) {
        this.setOption(option);
        this.intervalId = null; // 间隔时间
        this.splitArray = [];   // 分割数组
        this.index = 0;         // 索引
        this.usable = true;     // 启用状态
    }

    /**
     * 设置配置项
     * @param {Object} param0 配置对象
     */
    setOption({
        interval = 400, // 间隔时间
        splitCount = 1500 // 数组大小
    }) {
        this.clear();
        this.interval = interval;
        this.splitCount = splitCount;
    }

    /**
     *是否可用
     *
     * @param {*} Boolean
     * @memberof BatchesData
     */
    setUsable(val) {
        this.usable = val;
    }

    /**
     * 清空
     */
    clear() {
        this.splitArray = [];
        this.index = 0;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

    }

    /**
     * 数据处理
     * @param {*} data 
     * @param {*} callback 
     * @param {*} ctx 
     */
    action(data, callback, ctx) {
       
        if (this.usable) {
            this.clear();
        } else {
            return;
        }
        let {
            splitCount,
            interval,
        } = this;

        this.splitArray = chunk(data, splitCount);

        let loop = () => {
            if (!this.usable) {
                this.clear();
                return;
            }
            let item = this.splitArray[this.index];
            item && callback(ctx, item);

            this.index++;

            if (this.index >= this.splitArray.length) {
                this.clear();
            } else {
                this.intervalId = setTimeout(loop, interval);
            }
        };
        loop();

    }
}