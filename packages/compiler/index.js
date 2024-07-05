import JSXParser from './parser.js'

export default function(content, map, meta) {
  const REGEXP_JSX = /return\s*\(?\s*(<[\s\S]*>)\s*\)?/g
  let matches = REGEXP_JSX.exec(content)
  if (matches) {
    const jsx = matches[1]
    const result = compileJSX(jsx, map, meta)
    console.log(`compile jsx for ${this.resourcePath}\n`, result)
    content = content.replace(jsx, result)
  }
  const importstate = "import { createVNode } from 'hand-write-vue'\n"
  return importstate + content
}

function compileJSX(jsx, map, meta) {
  const xml = JSXParser(jsx)
  return transform(xml)
}

function transform(xml) {
  let type
  if (isHtmlTag(xml.type)) {
    type = `'${xml.type}'`
  } else if (xml.type === '#text') {
    return `'${xml.nodeValue}'`
  } else if (xml.type === '#jsx') {
    return `\`\${${xml.nodeValue}}\``
  } else {
    type = `${xml.type}`
  }
  let props = {}
  for(let key in xml.props) {
    const value = xml.props[key]
    if (typeof value === 'string') {
      props[key] = `'${value}'`
    } else if (typeof value === 'object' && value.type === '#jsx') {
      props[key] = `${value.nodeValue}`
    }
  }
  props = `{${Object.keys(props).map(key => `${key}: ${props[key]}`).join(',')}}`
  let children = []
  xml.children.forEach((child) => {
    children.push(transform(child))
  })
  if (children.filter(child => child.indexOf("createVNode") > -1).length > 0) {
    children = "[" + children.join(",") + "]"
  } else {
    children = children.join("")
    children = children.indexOf("`") > -1 
      ? ("`" + children.replace(/`/g, "").replace(/'/g, "") + "`")
      : ("'" + children.replace(/'/g, "") + "'")
  }
  let result = "createVNode(%type%, %props%, %children%)".replace('%type%', type).replace('%props%', props).replace('%children%', children)
  // console.log(result)
  return result
}

function isHtmlTag(tag) {
  return ['div','h1','p','button'].includes(tag)
}