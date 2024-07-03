const reactive = (obj) => {
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)
      // 触发依赖
      trigger(target, key)
      return res
    }
  })
  return proxy
}

let activeEffect = null
const effect = (fn) => {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

class ReactiveEffect {
  constructor(fn) {
    this.fn = fn
    this.deps = []
  }
  run() {
    activeEffect = this
    this.fn()
    activeEffect = null
  }
}

const targetMap = new WeakMap()
const track = (target, key) => {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect)
      activeEffect.deps.push(dep)
    }
  }
}

const trigger = (target, key) => {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      effect.run()
    })
  }
}

export {
  reactive,
  effect,
  ReactiveEffect
}