import { baseCreateRenderer } from './render.js'
import { h } from './vnode.js'
import { nodeOps } from './dom.js'
import { patchProp } from './patchprop.js'
import { extend } from './shared.js'
import { reactive } from './reactive.js'

const createApp = (...args) => {
  const app = createRender().createApp(...args)
  const { mount } = app
  const { normalizeContainer } = nodeOps
  app.mount = (el) => {
    const container = normalizeContainer(el)
    if (!container) return
    container.innerHTML = ''
    const proxy = mount(container)
    return proxy
  }
  return app
}

const renderOption = extend({ patchProp }, nodeOps)
const createRender = () => {
  return baseCreateRenderer(renderOption)
}

export {
  createApp,
  h,
  reactive
}
