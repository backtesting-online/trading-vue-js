// Canvas context for text measurments
// Canvas 画布上下文

function Context($p) {
    let el = document.createElement('canvas')
    let ctx = el.getContext("2d")
    ctx.font = $p.font
    return ctx
}

export default Context
