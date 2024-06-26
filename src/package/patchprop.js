import { isString, isArray, isFunction, isOn, hyphenate, capitalize, camelize, NO_OP } from './shared.js'
import { callWithAsyncErrorHandling } from './renderutils.js'

export const patchProp = (el, key, prevValue, nextValue, parentComponent) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    patchEvent(el, key, prevValue, nextValue, parentComponent)
  }
}

const patchClass = (el, value) => {
  if (value == null) {
    el.removeAttribute('class')
  } else {
    el.className = value
  }
}

const patchStyle = (el, prev, next) => {
  const style = (el).style
  const isCssString = isString(next)
  let hasControlledDisplay = false
  if (next && !isCssString) {
    if (prev) {
      if (!isString(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, '')
          }
        }
      } else {
        for (const prevStyle of prev.split(';')) {
          const key = prevStyle.slice(0, prevStyle.indexOf(':')).trim()
          if (next[key] == null) {
            setStyle(style, key, '')
          }
        }
      }
    }
    for (const key in next) {
      if (key === 'display') {
        hasControlledDisplay = true
      }
      setStyle(style, key, next[key])
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        // #9821
        const cssVarText = (style)[CSS_VAR_TEXT]
        if (cssVarText) {
          ;(next) += ';' + cssVarText
        }
        style.cssText = next
        hasControlledDisplay = displayRE.test(next)
      }
    } else if (prev) {
      el.removeAttribute('style')
    }
  }
  // indicates the element also has `v-show`.
  if (vShowOriginalDisplay in el) {
    // make v-show respect the current v-bind style display when shown
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : ''
    // if v-show is in hidden state, v-show has higher priority
    if ((el)[vShowHidden]) {
      style.display = 'none'
    }
  }
}

const setStyle = (style, name, val) => {
  if (isArray(val)) {
    val.forEach(v => setStyle(style, name, v))
  } else {
    if (val == null) val = ''
    if (name.startsWith('--')) {
      // custom property definition
      style.setProperty(name, val)
    } else {
      const prefixed = autoPrefix(style, name)
      if (importantRE.test(val)) {
        // !important
        style.setProperty(
          hyphenate(prefixed),
          val.replace(importantRE, ''),
          'important',
        )
      } else {
        style[prefixed] = val
      }
    }
  }
}

const prefixes = ['Webkit', 'Moz', 'ms']
const prefixCache = {}
const autoPrefix = (style, rawName) => {
  const cached = prefixCache[rawName]
  if (cached) {
    return cached
  }
  let name = camelize(rawName)
  if (name !== 'filter' && name in style) {
    return (prefixCache[rawName] = name)
  }
  name = capitalize(name)
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name
    if (prefixed in style) {
      return (prefixCache[rawName] = prefixed)
    }
  }
  return rawName
}

const addEventListener = (el, event, handler, options) => {
  el.addEventListener(event, handler, options)
}

const removeEventListener = (el, event, handler, options) => {
  el.removeEventListener(event, handler, options)
}

const veiKey = Symbol('_vei')
const patchEvent = (el, rawName, prevValue, nextValue, instance) => {
  // vei = vue event invokers
  const invokers = el[veiKey] || (el[veiKey] = {})
  const existingInvoker = invokers[rawName]
  if (nextValue && existingInvoker) {
    // patch
    existingInvoker.value = sanitizeEventValue(nextValue, rawName)
  } else {
    const [name, options] = parseName(rawName)
    if (nextValue) {
      // add
      const invoker = (invokers[rawName] = createInvoker(sanitizeEventValue(nextValue, rawName), instance))
      addEventListener(el, name, invoker, options)
    } else if (existingInvoker) {
      // remove
      removeEventListener(el, name, existingInvoker, options)
      invokers[rawName] = undefined
    }
  }
}

let cachedNow = 0
const p = /*#__PURE__*/ Promise.resolve()
const getNow = () =>
  cachedNow || (p.then(() => (cachedNow = 0)), (cachedNow = Date.now()))
const createInvoker = (initialValue, instance) => {
  const invoker = (e) => {
    // async edge case vuejs/vue#6566
    // inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // this no longer happens for templates in Vue 3, but could still be
    // theoretically possible for hand-written render functions.
    // the solution: we save the timestamp when a handler is attached,
    // and also attach the timestamp to any event that was handled by vue
    // for the first time (to avoid inconsistent event timestamp implementations
    // or events fired from iframes, e.g. #2513)
    // The handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    if (!e._vts) {
      e._vts = Date.now()
    } else if (e._vts <= invoker.attached) {
      return
    }
    callWithAsyncErrorHandling(
      patchStopImmediatePropagation(e, invoker.value),
      instance,
      [e],
    )
  }
  invoker.value = initialValue
  invoker.attached = getNow()
  return invoker
}

const patchStopImmediatePropagation = (e, value) => {
  if (isArray(value)) {
    const originalStop = e.stopImmediatePropagation
    e.stopImmediatePropagation = () => {
      originalStop.call(e)
      ;(e)._stopped = true
    }
    return (value).map(
      fn => (e) => !(e)._stopped && fn && fn(e),
    )
  } else {
    return value
  }
}


const sanitizeEventValue = (value, propName) => {
  if (isFunction(value) || isArray(value)) {
    return value
  }
  warn(
    `Wrong type passed as event handler to ${propName} - did you forget @ or : ` +
      `in front of your prop?\nExpected function or array of functions, received type ${typeof value}.`,
  )
  return NO_OP
}

const optionsModifierRE = /(?:Once|Passive|Capture)$/
const parseName = (name) => {
  let options
  if (optionsModifierRE.test(name)) {
    options = {}
    let m
    while ((m = name.match(optionsModifierRE))) {
      name = name.slice(0, name.length - m[0].length)
      ;(options)[m[0].toLowerCase()] = true
    }
  }
  const event = name[2] === ':' ? name.slice(3) : hyphenate(name.slice(2))
  return [event, options]
}