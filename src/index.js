import TradingVue from './TradingVue.vue'
import DataCube from './helpers/datacube.js'
import Overlay from './mixins/overlay.js'
import Tool from './mixins/tool.js'
import Interface from './mixins/interface.js'
import Utils from './stuff/utils.js'
import Constants from './stuff/constants.js'
import Candle from './components/primitives/candle.js'
import Volbar from './components/primitives/volbar.js'
import Line from './components/primitives/line.js'
import Pin from './components/primitives/pin.js'
import Price from './components/primitives/price.js'
import Ray from './components/primitives/ray.js'
import Seg from './components/primitives/seg.js'

import { layout_cnv, layout_vol } from
    './components/js/layout_cnv.js'

const primitives = {
    Candle, Volbar, Line, Pin, Price, Ray, Seg
}

// 给 TradingVue 插件注册 install 方法
TradingVue.install = function (Vue) {
    Vue.component(TradingVue.name, TradingVue)
}

if (typeof window !== 'undefined' && window.Vue) {
    // 安装 TradingVue 插件
    window.Vue.use(TradingVue)
    // 导出组件到全局对象上
    window.TradingVueLib = {
        TradingVue, Overlay, Utils, Constants,
        Candle, Volbar, layout_cnv, layout_vol,
        DataCube, Tool, Interface, primitives
    }
}

export default TradingVue

export {
    TradingVue, Overlay, Utils, Constants,
    Candle, Volbar, layout_cnv, layout_vol,
    DataCube, Tool, Interface, primitives
}
