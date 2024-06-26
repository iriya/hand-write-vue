import { hasOwn } from './shared.js'

const PublicInstanceProxyHandlers = {
  get(instance, key) {
    const { ctx, data, props } = instance

    // 判断是否是setup返回的对象
    if (key[0] === "$") {
      return
    }

    // 判断是否是data中的属性
    if (data !== void 0 && hasOwn(data, key)) {
      return data[key]
    }

    // 判断是否是props中的属性
    if (hasOwn(props, key)) {
      return props[key]
    }

    return ctx[key]
  },
  
  set(instance, key, value) {
    const { ctx, data } = instance

    if (data !== void 0 && hasOwn(data, key)) {
      data[key] = value
      return true
    }

    if (hasOwn(instance.props, key)) {
      console.warn(`Attempting to mutate prop "${key}". Props are readonly.`)
      return false
    }

    if (key[0] === '$' && key.slice(1) in instance) {
      __DEV__ &&
      console.warn(
          `Attempting to mutate public property "${key}". ` +
            `Properties starting with $ are reserved and readonly.`,
        )
      return false
    } else {
      ctx[key] = value
    }
    return true
  },

  has(instance, key) {
    const { ctx, data } = instance;
    return (
      (data !== EMPTY_OBJ && hasOwn(data, key)) ||
      hasOwn(ctx, key)
    )
  },
}

export {
  PublicInstanceProxyHandlers
}