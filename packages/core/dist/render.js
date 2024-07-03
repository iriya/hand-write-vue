import { EMPTY_OBJ, extend, NO_OP, isPromise, isFunction, isObject } from './shared.js'
import { createAppAPI } from './createapi.js'
import { ShapeFlags, Types, normalizeVNode, isVNode, cloneIfMounted } from './vnode.js'
import { ReactiveEffect } from './reactive.js'
import { renderComponentRoot, callWithErrorHandling, handleError } from './renderutils.js'
import { PublicInstanceProxyHandlers } from './componentinstance.js'

const baseCreateRenderer = (options) => {
  const { insert, remove, patchProp, createElement, createText, createComment, setText, setElementText, parentNode, nextSibling, setScopeId = NO_OP, insertStaticContent } = options;
  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      patch(container._vnode || null, vnode, container, null)
    }
    container._vnode = vnode
  }
  const unmount = (vnode, parentComponent, doRemove = false) => {
    const { type, shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vnode.component, parentComponent, doRemove)
    } else {
      unmountChildren(children, parentComponent, doRemove)
      if (doRemove) {
        removeFn(vnode)
      }
    }
  }
  const unmountComponent = (instance, parentComponent, doRemove) => {
    const { subTree } = instance
    unmount(subTree, instance, doRemove)
  }
  const removeFn = (vnode) => {
    const { type, el } = vnode
    if (type == Types.Static) {

    }
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      remove(el)
    }
  }
  const patch = (n1, n2, container, parentComponent = null) => {
    if (n1 === n2) {
      return
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    const { type, shapeFlag } = n2
    switch (type) {
      case Types.Text:
        processText(n1, n2, container)
        break
      case Types.Comment:
        processComment(n1, n2, container)
        break
      case Types.Static:
        if (n1 == null) {
          mountStaticNode(n2, container)
        }
        break
      case Types.Fragment:
        processFragment(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, parentComponent)
        }
    }
  }

  const processText = (n1, n2, container) => { }
  const processComment = (n1, n2, container) => { }
  const mountStaticNode = (n2, container) => { }
  const processFragment = (n1, n2, container) => { }
  const processElement = (n1, n2, container, parentComponent) => {
    if (n1 == null) {
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container, parentComponent)
    }
  }
  const mountElement = (vnode, container, parentComponent) => {
    let el
    const { props, shapeFlag } = vnode
    el = (vnode.el = createElement(vnode.type, null, props && props.is, props))
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      setElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent)
    }
    if (props) {
      for (const key in props) {
        patchProp(el, key, null, props[key], parentComponent)
      }
    }
    insert(el, container)
  }
  const unmountChildren = (children, parentComponent, doRemove = false, start = 0) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent)
    }
  }
  const mountChildren = (children, container, parentComponent, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = (children[i] = optimized
        ? cloneIfMounted(children[i])
        : normalizeVNode(children[i]))
      patch(
        null,
        child,
        container,
        parentComponent
      )
    }
  }
  const patchElement = (n1, n2, container, parentComponent) => {
    const el = n2.el = n1.el
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    patchChildren(n1, n2, el, parentComponent)
    patchProps(el, n2, oldProps, newProps)
  }
  const patchChildren = (n1, n2, container, parentComponent, optimized) => {
    const c1 = n1 && n1.children
    const prevShapeFlag = n1 ? n1.shapeFlag : 0
    const c2 = n2.children
    const { shapeFlag } = n2
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1, parentComponent)
      }
      if (c2 !== c1) {
        setElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyedChildren(c1, c2, container, parentComponent, optimized)
        } else {
          unmountChildren(c1, parentComponent, true)
        }
      } else {
        // prev children was text OR null
        // new children is array OR null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          setElementText(container, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, container, parentComponent, optimized)
        }
      }
    }
  }
  const patchKeyedChildren = (c1, c2, container, parentComponent, optimized) => {
    const oldLength = c1.length
    const newLength = c2.length
    const commonLength = Math.min(oldLength, newLength)
    for (let i = 0; i < commonLength; i++) {
      const nextChild = (c2[i] = optimized
        ? cloneIfMounted(c2[i])
        : normalizeVNode(c2[i]))
      patch(c1[i], nextChild, container, parentComponent)
    }
    if (oldLength > newLength) {
      unmountChildren(c1, parentComponent, true, commonLength)
    } else {
      mountChildren(c2, container, parentComponent, optimized, commonLength)
    }
  }
  const patchProps = (el, n2, oldProps, newProps) => {

  }

  const processComponent = (n1, n2, container, parentComponent) => {
    if (n1 == null) {
      mountComponent(n2, container, parentComponent)
    } else {
      patchComponent(n1, n2, parentComponent)
    }
  }
  const mountComponent = (vnode, container, parentComponent) => {
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent))
    setupComponent(instance)
    setupRenderEffect(instance, vnode, container)
  }
  const patchComponent = (n1, n2, parentComponent) => { }
  const createComponentInstance = (vnode, parent) => {
    const type = vnode.type
    const appContext = (parent ? parent.appContext : vnode.appContext) || null
    const instance = {
      vnode,
      type,
      parent,
      appContext,
      root: null,
      next: null,
      subTree: null,
      render: null,
      proxy: null,

      // state
      ctx: EMPTY_OBJ,
      data: EMPTY_OBJ,
      props: EMPTY_OBJ,

      // lifecycle
      isMounted: false,
      isUnmounted: false,
    }
    instance.ctx = instance
    instance.root = parent ? parent.root : instance
    return instance
  }
  const setupComponent = (instance) => {
    const { props, children } = instance.vnode
    initProps(instance, props)
    initSlots(instance, children)
    setupStatefulComponent(instance)
  }
  const initProps = (instance, rawProps) => { 
    const props = {}
    const { defaultProps } = instance.type
    if (defaultProps) {
      for (let key in defaultProps) {
        props[key] = defaultProps[key]
      }
    }
    if (rawProps) {
      for (let key in rawProps) {
        props[key] = rawProps[key]
      }
    }
    instance.props = props
  }
  const initSlots = (instance, children) => { }
  const setupStatefulComponent = (instance) => {
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    const { setup } = instance.type
    if (setup) {
      const setupResult = callWithErrorHandling(setup, instance, [instance.props])
      if (isPromise(setupResult)) {
        setupResult.then(resolvedResult => handleSetupResult(instance, resolvedResult)).catch(e => handleError(e, instance))
      } else {
        handleSetupResult(instance, setupResult)
      }
    }
  }
  const handleSetupResult = (instance, setupResult) => {
    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else if (isObject(setupResult)) {
      if (isVNode(setupResult)) {
        console.warn(`setup() should not return VNodes directly - return a render function instead.`);
      }
      instance.setupState = setupResult
    }
  }

  const setupRenderEffect = (instance, vnode, container) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { el, props } = vnode
        const { parent } = instance
        const subTree = (instance.subTree = renderComponentRoot(instance))
        patch(null, subTree, container, instance)
        vnode.el = subTree.el
        instance.isMounted = true
      } else {
        let { next, parent, vnode } = instance
        if (next) {
          next.el = vnode.el
        } else {
          next = vnode
        }
        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree
        patch(prevTree, nextTree, parent?.el, instance)
      }
    }
    const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
    const update = (instance.update = () => {
      effect.run()
    })
    update()
  }

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type
  }

  return {
    render,
    createApp: createAppAPI(render)
  }
}

export {
  baseCreateRenderer
}
