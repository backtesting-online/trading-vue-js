
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
                // 蜡烛图索引方式
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

        chart_config() {
            return Object.assign({},
                Const.ChartConfig,
                this.$props.chartConfig,
            )
        },
        // 去除 datacube ，返回真正的数据
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
    data() {
        return { reset: 0, tip: null }
    },
    beforeDestroy() {
        this.custom_event({ event: 'before-destroy' })
        this.ctrl_destroy()
    },
    methods: {
        // TODO: reset extensions?
        resetChart(resetRange = true) {
            this.reset++
            let range = this.getRange()
            if (!resetRange && range[0] && range[1]) {
                this.$nextTick(() => this.setRange(...range))
            }
            this.$nextTick(() => this.custom_event({
                event: 'chart-reset', args: []
            }))
        },
        goto(t) {
            // TODO: limit goto & setRange (out of data error)
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                t = ti_map.gt2i(t, this.$refs.chart.ohlcv)
            }
            this.$refs.chart.goto(t)
        },
        setRange(t1, t2) {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                const ohlcv = this.$refs.chart.ohlcv
                t1 = ti_map.gt2i(t1, ohlcv)
                t2 = ti_map.gt2i(t2, ohlcv)
            }
            this.$refs.chart.setRange(t1, t2)
        },
        getRange() {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                // Time range => index range
                return this.$refs.chart.range
                    .map(x => ti_map.i2t(x))
            }
            return this.$refs.chart.range
        },
        getCursor() {

            let cursor = this.$refs.chart.cursor
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                let copy = Object.assign({}, cursor)
                copy.i = copy.t
                copy.t = ti_map.i2t(copy.t)
                return copy
            }
            return cursor
        },
        showTheTip(text, color = "orange") {
            this.tip = { text, color }
        },
        legend_button(event) {
            this.custom_event({
                event: 'legend-button-click', args: [event]
            })
        },
        custom_event(d) {
            if ('args' in d) {
                this.$emit(d.event, ...d.args)
            } else {
                this.$emit(d.event)
            }
            let data = this.$props.data
            let ctrl = this.controllers.length !== 0
            if (ctrl) this.pre_dc(d)
            if (data.tv) {
                // If the data object is DataCube
                data.on_custom_event(d.event, d.args)
            }
            if (ctrl) this.post_dc(d)
        },
        range_changed(r) {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                r = r.map(x => ti_map.i2t(x))
            }
            this.$emit('range-changed', r)
            this.custom_event(
                {event: 'range-changed', args: [r]}
            )
            if (this.onrange) this.onrange(r)
        },
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
                console.log("key: ",  k);
                if (k.indexOf('color') === 0 && k !== 'colors') {
                    let k2 = k.replace('color', '')
                    k2 = k2[0].toLowerCase() + k2.slice(1)
                    if (colors[k2]) continue
                    colors[k2] = this.$props[k]
                }
            }
        },
        mousedown() {
            this.$refs.chart.activated = true
        },
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
