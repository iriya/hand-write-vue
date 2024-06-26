import { createVNode } from './vnode.js'

const createAppAPI = (render) => {
  return function createApp(rootComponent, rootProps) {
    const context = createAppContext()
    let isMounted = false

    const app = {
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      mount(rootContainer) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps)
          vnode.appContext = context

          render(vnode, rootContainer)
          isMounted = true
          app._container = rootContainer
          rootContainer.__vue_app__ = app
        }
      } 
    }
    return app
  }
}

const createAppContext = () => {
  return {
    config: {},
  }
}

export {
  createAppAPI
}