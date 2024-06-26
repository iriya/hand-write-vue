import { createApp, h, reactive } from './package/vue.js'
// import HelloWorld from './HelloWorld.js'

const app = {
  setup() {
    const state = reactive({
      count: 123
    })
    const handleClick = () => {
      state.count++
      console.log(state.count)
    }
    return function render() {
      return h('div', {class: 'wrapper'}, [
        h('div', '这条消息是123'),
        h('p', state.count),
        h('button', {'onClick': handleClick}, 'INCR')
      ])
    }
  }
}

createApp(app).mount('#app')