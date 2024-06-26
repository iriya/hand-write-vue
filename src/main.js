import { createApp, h, reactive } from './package/vue.js'
import HelloWorld from './HelloWorld.js'

const app = {
  setup() {
    const state = reactive({
      count: 123,
      message: 'hello from vue'
    })
    const handleIncr = () => {
      state.count++
    }
    const handleDecr = () => {
      state.count--
    }
    return function render() {
      return h('div', {class: 'wrapper'}, [
        // h('div', '这是固定的'),
        // h('h1', `这条消息来自${state.message}`),
        h('p', state.count),
        h('button', {'onClick': handleIncr}, 'INCR'),
        h('button', {class: 'primary', 'onClick': handleDecr}, 'DECR'),
        h(HelloWorld, {title: '666'})
      ])
    }
  }
}

createApp(app).mount('#app')