export const isMap = (val) =>
  toTypeString(val) === '[object Map]'
export const isSet = (val) =>
  toTypeString(val) === '[object Set]'

export const isDate = (val) =>
  toTypeString(val) === '[object Date]'
export const isRegExp = (val) =>
  toTypeString(val) === '[object RegExp]'

export const isObject = (obj) => {
  return obj !== null && typeof obj === 'object'
}

export const isPromise = (val) => {
  return (
    (isObject(val) || isFunction(val)) &&
    isFunction((val).then) &&
    isFunction((val).catch)
  )
}

export const objectToString = Object.prototype.toString
export const toTypeString = (value) =>
  objectToString.call(value)

export const toRawType = (value) => {
  // extract "RawType" from strings like "[object RawType]"
  return toTypeString(value).slice(8, -1)
}

export const isPlainObject = (val) =>
  toTypeString(val) === '[object Object]'

export const isIntegerKey = (key) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key

export const isString = (obj) => {
  return typeof obj === 'string'
}

export const isFunction = (obj) => {
  return typeof obj === 'function'
}

export const isArray = Array.isArray

export const EMPTY_OBJ = {}
export const EMPTY_ARR = []

export const NO_OP = () => {}

export const extend = Object.assign

export const isOn = (key) => 
  key.charCodeAt(0) === 111 /* o */ &&
  key.charCodeAt(1) === 110 /* n */ &&
  // uppercase letter
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97)

export const remove = (arr, el) => {
  const i = arr.indexOf(el)
  if (i > -1) {
    arr.splice(i, 1)
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val,
  key
) => hasOwnProperty.call(val, key)


const cacheStringFunction = (fn) => {
  const cache = Object.create(null)
  return ((str) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  })
}
const camelizeRE = /-(\w)/g
/**
 * @private
 */
export const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})
const hyphenateRE = /\B([A-Z])/g
/**
 * @private
 */
export const hyphenate = cacheStringFunction((str) =>
  str.replace(hyphenateRE, '-$1').toLowerCase(),
)

/**
 * @private
 */
export const capitalize = cacheStringFunction((str) => {
  return (str.charAt(0).toUpperCase() + str.slice(1))
})