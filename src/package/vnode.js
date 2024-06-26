import { isString, isObject, isFunction, isArray } from './shared.js'

const ShapeFlags = Object.freeze({
  ELEMENT: 1,
  FUNCTIONAL_COMPONENT: 1 << 1,
  STATEFUL_COMPONENT: 1 << 2,
  TEXT_CHILDREN: 1 << 3,
  ARRAY_CHILDREN: 1 << 4,
  // SLOTS_CHILDREN: 1 << 5,
  // TELEPORT: 1 << 6,
  // SUSPENSE: 1 << 7,
  // COMPONENT_SHOULD_KEEP_ALIVE: 1 << 8,
  // COMPONENT_KEPT_ALIVE: 1 << 9,
  COMPONENT: 1 << 2 | 1 << 1 /*ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT*/
})

const Types = Object.freeze({
  Text: Symbol('Text'),
  Comment: Symbol('Comment'),
  Static: Symbol('Static'),
  Fragment: Symbol('Fragment')
})

const isVNode = (vnode) => {
  return vnode ? vnode.__v_isVNode === true : false
}

const _createVNode = (type, props, children = null) => {
  if (!type) {
    type = Comment
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(type, props)
    if (children) {
      normalizeChildren(cloned, children)
    }
    return cloned
  }
  // if (isClassComponent(type)) {
  //   type = type.__vccOpts
  // }
  // 2.x async/functional component compat

  // class & style normalization.
  // if (props) {
  //   // for reactive or proxy objects, we need to clone it to enable mutation.
  //   let { class: klass, style } = props
  //   if (klass && !isString(klass)) {
  //     props.class = normalizeClass(klass)
  //   }
  //   if (isObject(style)) {
  //     // reactive state objects need to be cloned since they are likely to be
  //     // mutated
  //     if (isProxy(style) && !isArray(style)) {
  //       style = extend({}, style)
  //     }
  //     props.style = normalizeStyle(style)
  //   }
  // }

  // encode the vnode type information into a bitmap
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : isFunction(type)
        ? ShapeFlags.FUNCTIONAL_COMPONENT
        : 0
  return createBaseVNode(type, props, children, shapeFlag, true)
}

const normalizeChildren = (vnode, children) => {
  let type = 0
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'object') {
    // todo
  } else if (isFunction(children)) {
    // todo
  } else {
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.children = children
  vnode.shapeFlag |= type
}

function h(type, propsOrChildren, children) {
  let l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]) // 第二个参数为虚拟dom时，格式为：h('div',h('span'))
      }
      return createVNode(type, propsOrChildren) // 当第二个参数为props时， 格式为： h('div',{color:red})
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2); // 获取第三个（包含第三个）参数，并组成一个数组
    } else if (l === 3 && isVNode(children)) { // 参数长度为3，并且类型为虚拟dom，把它包装成数组格式
      children = [children]
    }
    return createVNode(type, propsOrChildren, children) 
  }
}

const createVNode = (type, props, children = null) => {
  return _createVNode(type, props, children)
}

const createBaseVNode = (type, props = null, children = null, shapeFlag, needFullChildrenNormalization = false) => {
  const vnode = {
    _v_isVNode: true,
    type,
    props,
    children,
    shapeFlag: shapeFlag,
    component: null,
    el: null,
  }
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children)
  } else if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}

const normalizeVNode = (child) => {
  if (child == null || typeof child === 'boolean') {
    // empty placeholder
    return createVNode(Types.Comment)
  } else if (isArray(child)) {
    // fragment
    return createVNode(Types.Fragment, null, child.slice())
  } else if (typeof child === 'object') {
    // already vnode, this should be the most common since compiled templates
    // always produce all-vnode children arrays
    return cloneIfMounted(child)
  } else {
    // strings and numbers
    return createVNode(Text, null, String(child))
  }
}

const cloneIfMounted = (child) => {
  return (child.el === null)
    ? child
    : cloneVNode(child)
}

const cloneVNode = (vnode) => {
  const cloned = {
    ...vnode
  }
  return cloned
}

export {
  ShapeFlags,
  Types,
  h,
  createVNode,
  normalizeVNode,
  isVNode,
  cloneIfMounted
}