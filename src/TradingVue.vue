
<template>
    <!-- Main component  -->
    <div class="trading-vue" v-bind:id="id"
        @mousedown="mousedown" @mouseleave="mouseleave"
         :style="{
            color: this.chart_props.colors.text,
            font: this.font_comp,
            width: this.width+'px',
            height: this.height+'px'}">
        <toolbar v-if="toolbar"
            ref="toolbar"
            v-on:custom-event="custom_event"
            v-bind="chart_props"
            v-bind:config="chart_config">
        </toolbar>
        <widgets v-if="controllers.length"
            ref="widgets"
            :map="ws" :width="width" :height="height"
            :tv="this" :dc="data">
        </widgets>
        <chart :key="reset"
            ref="chart"
            v-bind="chart_props"
            v-bind:tv_id="id"
            v-bind:config="chart_config"
            v-on:custom-event="custom_event"
            v-on:range-changed="range_changed"
            v-on:legend-button-click="legend_button">
        </chart>
        <transition name="tvjs-drift">
            <the-tip :data="tip" v-if="tip"
                @remove-me="tip = null"/>
        </transition>
    </div>
</template>

<script>

import Const from './stuff/constants.js'
import Chart from './components/Chart.vue'
import Toolbar from './components/Toolbar.vue'
import Widgets from './components/Widgets.vue'
import TheTip from './components/TheTip.vue'
import XControl from './mixins/xcontrol.js'

export default {
    name: 'TradingVue',
    components: {
        Chart, Toolbar, Widgets, TheTip
    },
    // 扩展程序
    mixins: [ XControl ],
    props: {
        // 主图左上角标题
        titleTxt: {
            type: String,
            default: 'TradingVue.js'
        },
        // 最外层元素 ID 值
        id: {
            type: String,
            default: 'trading-vue-js'
        },
        // 最外层的宽度
        width: {
            type: Number,
            default: 800
        },
        // 最外层高度
        height: {
            type: Number,
            default: 421
        },
        // 下面都是颜色值, 有用到，但是还没找到在哪里使用了😂
        colorTitle: {
            type: String,
            default: '#42b883'
        },
        colorBack: {
            type: String,
            default: '#121826'
        },
        colorGrid: {
            type: String,
            default: '#2f3240'
        },
        colorText: {
            type: String,
            default: '#dedddd'
        },
        colorTextHL: {
            type: String,
            default: '#fff'
        },
        colorScale: {
            type: String,
            default: '#838383'
        },
        colorCross: {
            type: String,
            default: '#8091a0'
        },
        colorCandleUp: {
            type: String,
            default: '#23a776'
        },
        colorCandleDw: {
            type: String,
            default: '#e54150'
        },
        colorWickUp: {
            type: String,
            default: '#23a77688'
        },
        colorWickDw: {
            type: String,
            default: '#e5415088'
        },
        colorWickSm: {
            type: String,
            default: 'transparent' // deprecated
        },
        colorVolUp: {
            type: String,
            default: '#79999e42'
        },
        colorVolDw: {
            type: String,
            default: '#ef535042'
        },
        colorPanel: {
            type: String,
            default: '#565c68'
        },
        colorTbBack: {
            type: String
        },
        colorTbBorder: {
            type: String,
            default: '#8282827d'
        },
        colors: {
            type: Object
        },
        // 字体样式
        font: {
            type: String,
            default: Const.ChartConfig.FONT
        },
        // 是否开启工具栏
        toolbar: {
            type: Boolean,
            default: false
        },
        // 图表数据
        data: {
            type: Object,
            required: true
        },
        // overlays 类
        overlays: {
            type: Array,
            default: function () { return [] }
        },
        // Overwrites ChartConfig values,
        // see constants.js
        // 覆盖 ChartConfig 值，
        // 查看常量.js
        chartConfig: {
            type: Object,
            default: function () { return {} }
        },
        // 指标名称旁边的按钮列表，库中有些自定义的内容
        legendButtons: {
            type: Array,
            default: function () { return [] }
        },
        // 有两种索引，默认是时间索引，可以设置为蜡烛图索引
        indexBased: {
            type: Boolean,
            default: false
        },
        // 扩展
        extensions: {
            type: Array,
            default: function () { return [] }
        },
        // 看是在 xcontrol.js 中会用到的一个配置
        xSettings: {
            type: Object,
            default: function () { return {} }
        },
        // 皮肤名称
        skin: {
            type: String // Skin Name
        },
        // 从 UTC 偏移的小时量
        timezone: {
            type: Number,
            default: 0
        }
    },
    computed: {
        // Copy a subset of TradingVue props
        // 复制一部分 TradingVue 的 props
        chart_props() {
            // toolbar 所占用的宽度，图表宽度要减去这个宽度
            let offset = this.$props.toolbar ?
                this.chart_config.TOOLBAR : 0

            let chart_props = {
                title_txt: this.$props.titleTxt,
                // 把 extensions 的 overlays 的东西也放进去了
                overlays: this.$props.overlays.concat(this.mod_ovs),
                // 真正的 data 数据
                data: this.decubed,
                // 最外层宽度
                width: this.$props.width - offset,
                // 最外层高度
                height: this.$props.height,
                // 字体
                font: this.font_comp,
                // 指标名称旁边的按钮列表
                buttons: this.$props.legendButtons,
                //  是否开启工具栏
                toolbar: this.$props.toolbar,
                // 蜡烛图索引方式， 是否是 indexBased
                ib: this.$props.indexBased || this.index_based || false,
                // 颜色 Maps
                colors: Object.assign({}, this.$props.colors ||
                    this.colorpack),
                // 皮肤原型
                skin: this.skin_proto,
                // 从 UTC 偏移的小时量
                timezone: this.$props.timezone
            }

            this.parse_colors(chart_props.colors)
            return chart_props
        },
        // 图表配置，合并配置文件与用户传递的配置信息
        chart_config() {
            return Object.assign({},
                Const.ChartConfig,
                this.$props.chartConfig,
            )
        },
        // 去除 datacube ，返回真正的数据
        // TODO: 要仔细研究下 datacube 是干嘛的
        decubed() {
            let data = this.$props.data
            // 发现传递的数据是经过 dataCube 处理过的
            // 初始化下，然后返回真正的数据
            if (data.data !== undefined) {
                data.init_tvjs(this)
                return data.data
            } else {
                return data
            }
        },
        // 蜡烛图索引的方式
        index_based() {
            const base = this.$props.data
            if (base.chart) {
                return base.chart.indexBased
            }
            else if (base.data) {
                return base.data.chart.indexBased
            }
            return false
        },
        // 从 extensions 中获取 overlays
        mod_ovs() {
            let arr = []
            for (var x of this.$props.extensions) {
                arr.push(...Object.values(x.overlays))
            }
            return arr
        },
        // 字体
        font_comp() {
            return this.skin_proto && this.skin_proto.font ?
                this.skin_proto.font : this.font
        }
    },
    // 自己的 data
    data() {
        return {
            // 作为 chat 组件的 key, 在重置图表时会更新这个值
            reset: 0,
            // tip 组件的信息 (提示信息相关)
            tip: null,
        }
    },
    // 组件销毁之前执行
    beforeDestroy() {
        this.custom_event({ event: 'before-destroy' })
        this.ctrl_destroy()
    },
    methods: {
        // TODO: reset extensions?
        // TODO：重置扩展？
        // 用于重置图表的范围数据
        resetChart(resetRange = true) {
            this.reset++
            // 获取当前图表的时间范围对应的时间戳
            let range = this.getRange()
            // 不需要重置图表的话，就把图表的范围还原成之前的范围
            if (!resetRange && range[0] && range[1]) {
                this.$nextTick(() => this.setRange(...range))
            }
            // 触发图表重置事件
            this.$nextTick(() => this.custom_event({
                event: 'chart-reset', args: []
            }))
        },
        // 跳转到某个时间戳
        goto(t) {
            // TODO: limit goto & setRange (out of data error)
            // 限制 goto & setRange (out of data error)
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                t = ti_map.gt2i(t, this.$refs.chart.ohlcv)
            }
            this.$refs.chart.goto(t)
        },
        // 设置图表当前的时间访问 （参数是时间戳）
        setRange(t1, t2) {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                const ohlcv = this.$refs.chart.ohlcv
                // time => index
                t1 = ti_map.gt2i(t1, ohlcv)
                t2 = ti_map.gt2i(t2, ohlcv)
            }
            this.$refs.chart.setRange(t1, t2)
        },
        // 获取当前图表的时间范围对应的时间戳
        getRange() {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                // index -> time
                return this.$refs.chart.range
                    .map(x => ti_map.i2t(x))
            }
            return this.$refs.chart.range
        },
        // 获取光标位置信息
        getCursor() {
            let cursor = this.$refs.chart.cursor
            // index base 还得转换下呢
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                let copy = Object.assign({}, cursor)
                copy.i = copy.t
                // 根据索引转换成对应的时间戳
                copy.t = ti_map.i2t(copy.t)
                return copy
            }
            return cursor
        },
        // 显示提示
        showTheTip(text, color = "orange") {
            this.tip = { text, color }
        },
        // 指标名称右侧图表点击的回调事件
        legend_button(event) {
            this.custom_event({
                event: 'legend-button-click', args: [event]
            })
        },
        custom_event(d) {
            // 触发事件，并携带对应的参数, 通知父组件
            if ('args' in d) {
                this.$emit(d.event, ...d.args)
            } else {
                this.$emit(d.event)
            }
            let data = this.$props.data
            // TODO: 像是和 extension list 相关
            // 如果存在的话，事件也要通知他们
            let ctrl = this.controllers.length !== 0
            // 在 datacube 通知之前通知
            if (ctrl) this.pre_dc(d)
            if (data.tv) {
                // 如果数据对象是DataCube, 通知他
                data.on_custom_event(d.event, d.args)
            }
            // 在 datacube 通知之后通知
            if (ctrl) this.post_dc(d)
        },

        range_changed(r) {
            // r 是个数组，值时范围的索引
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                r = r.map(x => ti_map.i2t(x))
            }
            // 触发父组件的 range-changed 事件
            this.$emit('range-changed', r)
            // 触发事件总线的 range-changed
            this.custom_event(
                {event: 'range-changed', args: [r]}
            )
            // TODO: 像是触发 datacube 的 range_changed 方法 
            if (this.onrange) this.onrange(r)
        },

        // TODO: 不知道干嘛用的 ，应该和 datacube 有些关系
        set_loader(dc) {
            this.onrange = r => {
                let pf = this.chart_props.ib ? '_ms' : ''
                let tf = this.$refs.chart['interval' + pf]
                dc.range_changed(r, tf)
            }
        },

        // 解析 props 中的 color 属性，并将对应的 color 复制到参数 colors 中
        parse_colors(colors) {
            for (var k in this.$props) {
                if (k.indexOf('color') === 0 && k !== 'colors') {
                    let k2 = k.replace('color', '')
                    k2 = k2[0].toLowerCase() + k2.slice(1)
                    if (colors[k2]) continue
                    colors[k2] = this.$props[k]
                }
            }
        },
        // 鼠标在图表上按下就触发
        mousedown() {
            this.$refs.chart.activated = true
        },
        // 鼠标在图表上离开或失焦就触发
        mouseleave() {
            this.$refs.chart.activated = false
        }
    }
}
</script>
<style>
/* Anit-boostrap tactix */
.trading-vue *, ::after, ::before {
    box-sizing: content-box;
}
.trading-vue img {
    vertical-align: initial;
}
</style>
