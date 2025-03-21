import { visit } from 'unist-util-visit'
import { defaultHandlers } from 'remark-rehype'

export function removeSingleSpace() {
  // TODO: Give a specific type
  return (tree: any) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/\u00A0/g, '')
    })
  }
}

// Custom plugin that converts empty lines to a single space.
export function preserveEmptyParagraphs() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'p' && (!node.children || node.children.length === 0)) {
        node.children = [{ type: 'text', value: '\u00A0' }] // Add a non-breaking space
      }
    })
  }
}

// modefied version of https://github.com/syntax-tree/mdast-util-to-hast/blob/main/lib/handlers/code.js
// that outputs a data-language attribute instead of a CSS class (e.g.: language-typescript)
export function code(state: any, node: any) {
  const value = node.value ? `${node.value}\n` : ''
  /** @type {Properties} */
  const properties: any = {}

  if (node.lang) {
    // changed line
    properties['data-language'] = node.lang
  }

  // Create `<code>`.
  /** @type {Element} */
  let result: any = {
    type: 'element',
    tagName: 'code',
    properties,
    children: [{ type: 'text', value }],
  }

  if (node.meta) {
    result.data = { meta: node.meta }
  }

  state.patch(node, result)
  result = state.applyData(node, result)

  // Create `<pre>`.
  result = {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [result],
  }
  state.patch(node, result)
  return result
}

/**
 * Matches any video markdown and converst them to nodes.
 */
export function videos(state: any, node: any) {
  console.log(`node: `, node)
  if (node.type !== 'paragraph') {
    return defaultHandlers.paragraph(state, node)
  }

  if (!node.children?.[0]?.value) return defaultHandlers.paragraph(state, node)

  const text = node.children[0].value
  const regex = /!\[(.*?)\]\((.*?)\s*"width=(.*?)"\)/;
  const videoMatch = text.match(regex)
  console.log(`Found video: `, videoMatch)

  if (videoMatch) {
    const result = {
      type: 'element',
      tagName: 'iframe',
      properties: {
        src: videoMatch[2],
        title: videoMatch[1],
      },
      children: [],
    }

    console.log(`result: `, result)
    state.patch(node, result)
    return state.applyData(node, result)
  }
  return defaultHandlers.paragraph(state, node)
}
