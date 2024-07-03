import { ShapeFlags, Types, createVNode, normalizeVNode } from './vnode.js'
import { isFunction, isArray } from './shared.js'

const renderComponentRoot = (instance) => {
  const {
    type,
    vnode,
    render,
    proxy,
    props,
    data,
    ctx
  } = instance

  let result
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render.call(proxy, ctx, props))
    } else {
      // functional
      const render = type
      result = normalizeVNode(render.call(proxy, ctx, props))
    }
  } catch (err) {
    handleError(err, instance)
    result = createVNode(Types.Comment)
  }
  return result
}

const handleError = (err, instance) => {
  console.error(err, instance)
}

const callWithErrorHandling = (fn, instance, args) => {
  try {
    return args ? fn(...args) : fn()
  } catch (err) {
    handleError(err, instance)
  }
}

const callWithAsyncErrorHandling = (fn, instance, arg) => {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, arg)
    if (res && isPromise(res)) {
      res.catch(err => {
        handleError(err, instance, type)
      })
    }
    return res
  }

  if (isArray(fn)) {
    const values = []
    for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance, arg))
    }
    return values
  } else {
    warn(
      `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof fn}`,
    )
  }
}

export {
  renderComponentRoot,
  callWithErrorHandling,
  callWithAsyncErrorHandling,
  handleError
}