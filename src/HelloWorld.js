import { h } from 'hand-write-vue'

const HelloWorld = {
  defaultProps: {
    title: 'ABCD1234fox',
    sunset: 18
  },
  setup(props) {
    return function render() {
      return h('div', 'hello from ' + props.title + ', sunset=' + props.sunset)
    }
  }
}

export default HelloWorld
