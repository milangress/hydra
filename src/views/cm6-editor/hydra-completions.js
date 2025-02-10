import { CompletionContext } from '@codemirror/autocomplete'
import glslFunctions from 'hydra-synth/src/glsl/glsl-functions.js'
import {syntaxTree} from "@codemirror/language"
import { EditorView } from "@codemirror/view"
// Function type to icon mapping
const TYPE_ICONS = {
  src: '🎨', // Source generators
  coord: '📐', // Geometry operations
  color: '🎯', // Color operations
  combine: '🔀', // Blend operations
  combineCoord: '🔄', // Modulate operations
  external: '📡'  // External sources
}


const cssIconClasses = Object.entries(TYPE_ICONS).map(([type, icon]) => {
  return `.cm-completionIcon-${type}:after { content: '${icon}'; }`
})


// Function to get completion class based on type
function getCompletionClass(type, isFunction = false) {
  const baseClass = type === 'src' ? 'hydraSrc' :
                   type === 'color' ? 'hydraColor' :
                   type === 'coord' ? 'hydraCoord' :
                   type === 'combine' ? 'hydraCombine' :
                   type === 'combineCoord' ? 'hydraModulate' :
                   type === 'external' ? 'hydraExternal' :
                   type === 'output' ? 'hydraOutput' :
                   type === 'source' ? 'hydraSource' : 'hydraOther'
  
  return isFunction ? `${baseClass}Func` : baseClass
}

// CSS for completion classes
const cssCompletionClasses = {
  ".cm-completionIcon": {
    marginRight: "1em"
  },
  ".cm-completionIcon.hydraSrcFunc::before": { 
    content: '"ƒ"', color: "#fc6",
  },
  ".cm-completionIcon.hydraColorFunc::before": { 
    content: '"ƒ"', color: "#f66",
  },
  ".cm-completionIcon.hydraCoordFunc::before": { 
    content: '"ƒ"', color: "#6f6",
  },
  ".cm-completionIcon.hydraCombineFunc::before": { 
    content: '"ƒ"', color: "#66f", 
  },
  ".cm-completionIcon.hydraModulateFunc::before": { 
    content: '"ƒ"', color: "#f6f", 
  },
  ".cm-completionIcon.hydraExternalFunc::before": { 
    content: '"ƒ"', color: "#6ff", 
  },
  
  ".cm-completionIcon.hydraOutput::before": { 
    content: '"⚡"', color: "#fc6", 
  },
  ".cm-completionIcon.hydraSource::before": { 
    content: '"⚡"', color: "#6cf", 
  },
  ".cm-completionIcon.hydraOther::before": { 
    content: '"◆"', color: "#999", 
  },

  // Add some general completion styling
  ".cm-completionIcon": { color: "inherit" },
  ".cm-completionLabel": { color: "inherit" },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "4px 8px"
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    background: "#2a2a2a"
  }
}

const iconClasses = {}
Object.entries(TYPE_ICONS).forEach(([type, icon]) => {
  iconClasses[`.cm-completionIcon-${type}::after`] = { content: `"${icon}"` }
})

const completionTheme = EditorView.baseTheme({
  ...iconClasses,
  ...cssCompletionClasses
})

// External source functions
const EXTERNAL_SOURCES = {
  initCam: {
    type: 'external',
    info: 'Initialize webcam as input source',
    params: [
      { name: 'index', type: 'number', default: '0', info: 'Webcam index (0 for default camera)' }
    ]
  },
  initImage: {
    type: 'external',
    info: 'Initialize image as input source',
    params: [
      { name: 'url', type: 'string', info: 'URL of the image' }
    ]
  },
  initVideo: {
    type: 'external',
    info: 'Initialize video as input source',
    params: [
      { name: 'url', type: 'string', info: 'URL of the video' }
    ]
  },
  initStream: {
    type: 'external',
    info: 'Initialize stream as input source',
    params: [
      { name: 'name', type: 'string', info: 'Name of the stream to connect to' }
    ]
  },
  initScreen: {
    type: 'external',
    info: 'Initialize screen capture as input source',
    params: []
  }
}

// Global variables available in Hydra
const HYDRA_GLOBALS = {
  time: { type: 'number', info: 'Current time in seconds' },
  bpm: { type: 'number', info: 'Beats per minute' },
  width: { type: 'number', info: 'Width of the output' },
  height: { type: 'number', info: 'Height of the output' },
  mouse: { 
    type: 'object', 
    info: 'Mouse position',
    properties: {
      x: { type: 'number', info: 'Mouse X position' },
      y: { type: 'number', info: 'Mouse Y position' }
    }
  },
  o0: { type: 'output', info: 'Output buffer 0' },
  o1: { type: 'output', info: 'Output buffer 1' },
  o2: { type: 'output', info: 'Output buffer 2' },
  o3: { type: 'output', info: 'Output buffer 3' },
  s0: { type: 'source', info: 'Source buffer 0' },
  s1: { type: 'source', info: 'Source buffer 1' },
  s2: { type: 'source', info: 'Source buffer 2' },
  s3: { type: 'source', info: 'Source buffer 3' }
}

// Convert GLSL functions to completions format
function convertToCompletions(functions) {
  const completions = {}

  // Add GLSL functions
  functions().forEach(func => {
    completions[func.name] = {
      type: func.type,
      info: `${TYPE_ICONS[func.type]} ${func.name} - ${func.type} function`,
      params: func.inputs.map(input => ({
        name: input.name,
        type: input.type,
        default: String(input.default),
        info: `${input.name} (${input.type})`
      }))
    }
  })

  // Add external sources
  Object.entries(EXTERNAL_SOURCES).forEach(([name, info]) => {
    completions[name] = {
      ...info,
      info: `${TYPE_ICONS.external} ${info.info}`
    }
  })

  return completions
}

// Get completions from hydra-synth
export const hydraFunctions = convertToCompletions(glslFunctions)

function findFunctionContext(node) {
  let current = node;
  let functionName = null;
  let paramIndex = 0;

  // Helper to get function name from node
  function getFunctionNameFromNode(node) {
    if (!node) return null;
    if (node.type.name === 'PropertyName') {
      return node.name;
    }
    if (node.type.name === 'VariableName') {
      return node.name;
    }
    return null;
  }

  // Find the innermost CallExpression that contains our node
  function findContainingCallExpression(node, current) {
    while (current && current._parent) {
      if (current.type.name === 'CallExpression') {
        // Check if this call expression contains our node in its arguments
        let argList = current.getChild('ArgList');
        if (argList) {
          let child = argList.firstChild;
          while (child) {
            if (child === node || child.from <= node.from && child.to >= node.to) {
              return current;
            }
            child = child.nextSibling;
          }
        }
      }
      current = current._parent;
    }
    return null;
  }

  // Walk up the tree to find function context
  while (current && current._parent) {
    if (current.type.name === 'ArgList') {
      // Found parameter list, now find the function name
      let callNode = current._parent;

      // Count commas before our position to determine parameter index
      if (current.firstChild) {
        let child = current.firstChild;
        let pos = node.from;
        while (child) {
          if (child.type.name === ',') {
            if (child.from < pos) {
              paramIndex++;
            }
          }
          child = child.nextSibling;
        }
      }

      // Find the innermost call expression that contains our node
      let targetCallExpr = findContainingCallExpression(node, callNode);
      if (targetCallExpr) {
        // For method calls like osc().color()
        if (targetCallExpr._parent?.type.name === 'MemberExpression') {
          functionName = getFunctionNameFromNode(targetCallExpr._parent.lastChild);
        } else {
          // For direct calls like osc()
          functionName = getFunctionNameFromNode(targetCallExpr.firstChild);
        }
      }

      // If we still don't have a function name, try to find it in the chain
      if (!functionName) {
        let chainNode = current;
        while (chainNode && !functionName) {
          if (chainNode.type.name === 'MemberExpression') {
            functionName = getFunctionNameFromNode(chainNode.lastChild);
            break;
          }
          if (chainNode.type.name === 'CallExpression' && 
              chainNode._parent?.type.name === 'MemberExpression') {
            functionName = getFunctionNameFromNode(chainNode._parent.lastChild);
            break;
          }
          chainNode = chainNode._parent;
        }
      }
      break;
    }
    current = current._parent;
  }

  return { functionName, paramIndex };
}

function isChainableExpression(node) {
  // Check if we're in a continued expression context
  while (node && node._parent) {
    if (node.type.name === 'ExpressionStatement' && 
        node.type.props?.[11]?.name === 'continuedIndent') {
      return true;
    }
    // Also check for member expressions and method chains
    if (node.type.name === 'MemberExpression' || 
        node.type.name === 'PropertyName' ||
        node.type.name === 'CallExpression') {
      return true;
    }
    node = node._parent;
  }
  return false;
}

// Create completion function
export function hydraSuggestions(context) {
  // during tinkering this has to stay here. dont remove!!
  const previousTextSnippet = context.state.doc.slice(context.pos - 5, context.pos).
  toString().replace(/[\n\r]/g, '')
  console.log(`🐍 [ ${previousTextSnippet} ]`) 
  // during tinkering this has to stay here. dont remove!!

  let nodeBeforeBefore = syntaxTree(context.state).resolveInner(context.pos, -5)
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)
  let nodeMe = syntaxTree(context.state).resolveInner(context.pos, 0)
  console.log('nodes', nodeBeforeBefore, nodeBefore, nodeMe)

  let line = context.state.doc.lineAt(context.pos)
  let lineText = line.text
  let cursorCol = context.pos - line.from

  // Debug what's around the cursor
  const beforeCursor = lineText.slice(Math.max(0, cursorCol - 20), cursorCol)
  const afterCursor = lineText.slice(cursorCol, Math.min(lineText.length, cursorCol + 20))
  console.log('Context:', {
    beforeCursor,
    afterCursor,
    fullLine: lineText,
    cursorCol
  })

  // Get the token before the cursor
  let before = context.matchBefore(/[\w.$]*$/)
  if (!before) return null

  // Debug the matched token
  console.log('Token:', {
    text: before.text,
    from: before.from,
    to: before.to
  })

  // Check if we're after a dot using syntax tree
  let afterDot = nodeBefore.type.name === '.' || 
                 (nodeBeforeBefore.type.name === '.' && nodeBefore.type.name === 'VariableName') ||
                 before.text.startsWith('.')

  console.log('afterDot', afterDot)

  // Check if we're in a chainable context
  let inChain = isChainableExpression(nodeBefore)
  console.log('inChain', inChain)

  // Check if we're after a function call
  let afterFunction = false
  let lastFunctionName = null
  let node = nodeBefore

  // Helper to get function name from node
  function getFunctionNameFromNode(node) {
    if (!node) return null;
    if (node.type.name === 'PropertyName') {
      return node.name;
    }
    if (node.type.name === 'VariableName') {
      return node.name;
    }
    return null;
  }

  while (node && node._parent) {
    if (node.type.name === 'CallExpression') {
      // Try to get function name from member expression
      if (node._parent?.type.name === 'MemberExpression') {
        lastFunctionName = getFunctionNameFromNode(node._parent.lastChild);
      } else {
        // Try to get function name directly
        lastFunctionName = getFunctionNameFromNode(node.firstChild);
      }
      afterFunction = true;
      break;
    }
    
    // Check for member expressions in chain
    if (node.type.name === 'MemberExpression') {
      lastFunctionName = getFunctionNameFromNode(node.lastChild);
      afterFunction = true;
      break;
    }

    // Check for property names in chain
    if (node.type.name === 'PropertyName') {
      lastFunctionName = node.name;
      afterFunction = true;
      break;
    }

    node = node._parent;
  }

  console.log('afterFunction', afterFunction, 'lastFunction', lastFunctionName, 'node type', node?.type.name)

  // Find function context using AST
  const { functionName, paramIndex } = findFunctionContext(nodeMe)

  // Check if we're inside function parameters by looking for ArgList node
  const inParameters = nodeMe.type.name === 'ArgList' || 
                      nodeBefore.type.name === 'ArgList' || 
                      !!functionName

  if (inParameters) {
    // Get the actual function name, with better fallback logic
    const actualFunctionName = functionName || lastFunctionName;
    
    console.log('inParameters (AST)', { 
      functionName: actualFunctionName,
      paramIndex, 
      nodeType: nodeMe.type.name,
      nodeStructure: {
        current: nodeMe.type.name,
        parent: nodeMe._parent?.type.name,
        grandparent: nodeMe._parent?._parent?.type.name,
        greatGrandparent: nodeMe._parent?._parent?._parent?.type.name,
        functionNameSource: functionName ? 'direct' : lastFunctionName ? 'chain' : 'none'
      }
    })
  }

  let options = []

  // After a dot or after a function call, show chainable methods
  // But only if we're not after an out() call
  if ((afterDot || afterFunction) && !inParameters && lastFunctionName !== 'out') {
    for (let [name, info] of Object.entries(hydraFunctions)) {
      if (['color', 'coord', 'combine', 'combineCoord'].includes(info.type)) {
        options.push({
          label: `.${name}()`,  // Show parentheses in label
          type: info.type,
          info: `${TYPE_ICONS[info.type]} ${name}() - ${info.type} function`,
          apply: `.${name}`,
          class: getCompletionClass(info.type, true)
        })
      }
    }
    // Add .out() as a chainable method
    options.push({
      label: `.out()`,
      type: 'output',
      info: '⚡ out() - Output to buffer',
      apply: '.out()',
      class: getCompletionClass('output', true)
    })
  }
  // Inside parameters, show parameter-appropriate completions
  else if (inParameters) {
    // Use lastFunctionName as fallback if functionName is not found
    const currentFunction = functionName || lastFunctionName
    const func = hydraFunctions[currentFunction]
    if (func?.params && paramIndex < func.params.length) {
      const param = func.params[paramIndex]
      
      // Special handling for out() and render() - only show output buffers
      if (currentFunction === 'out' || currentFunction === 'render') {
        for (let [name, info] of Object.entries(HYDRA_GLOBALS)) {
          if (info.type === 'output') {
            options.push({
              label: name,
              type: info.type,
              info: info.info,
              apply: name,
              class: getCompletionClass('output')
            })
          }
        }
      }
      // If parameter is tex type, show all source and output options
      else if (param.type === 'sampler2D' || param.type === 'tex') {
        // Add source buffers
        for (let [name, info] of Object.entries(HYDRA_GLOBALS)) {
          if (info.type === 'source' || info.type === 'output') {
            options.push({
              label: name,
              type: info.type,
              info: info.info,
              apply: name,
              class: getCompletionClass(info.type)
            })
          }
        }
        // Add source generators
        for (let [name, info] of Object.entries(hydraFunctions)) {
          if (info.type === 'src') {
            options.push({
              label: `${name}()`,  // Show parentheses in label
              type: info.type,
              info: `${TYPE_ICONS[info.type]} ${name}() - Source generator`,
              apply: name,
              class: getCompletionClass('src', true)
            })
          }
        }
      } else {
        // Regular parameter - show default value and add number suggestions
        if (param.type === 'number') {
          const defaultVal = parseFloat(param.default)
          const suggestions = [0, 0.1, 0.5, 1, 2, 10]
          if (!suggestions.includes(defaultVal)) {
            suggestions.push(defaultVal)
          }
          suggestions.sort((a, b) => a - b)
          
          suggestions.forEach(val => {
            options.push({
              label: String(val),
              type: param.type,
              info: `${param.name}: number = ${val}`,
              apply: String(val),
              class: getCompletionClass('other')
            })
          })
        } else if (param.default !== undefined) {
          options.push({
            label: param.default,
            type: param.type,
            info: `${param.name}: ${param.type} = ${param.default}`,
            apply: param.default,
            class: getCompletionClass('other')
          })
        }
      }
    }
  }
  // At the start of a line or after out(), show source generators
  else {
    for (let [name, info] of Object.entries(hydraFunctions)) {
      if (info.type === 'src' || info.type === 'external') {
        options.push({
          label: `${name}()`,  // Show parentheses in label
          type: info.type,
          info: `${TYPE_ICONS[info.type]} ${name}() - ${info.type === 'src' ? 'Source generator' : 'External source'}`,
          apply: `${name}`,
          class: getCompletionClass(info.type, true)
        })
      }
    }
    // Add globals only if not after out()
    if (lastFunctionName !== 'out') {
      for (let [name, info] of Object.entries(HYDRA_GLOBALS)) {
        options.push({
          label: name,
          type: info.type,
          info: info.info,
          class: getCompletionClass(info.type)
        })
      }
    }
  }

  return {
    from: before.from,
    options,
    validFor: afterDot ? /^\.[\w$]*$/ : /^[\w$]*$/  // More strict regex when after dot
  }
}

// // Create formatted documentation
// function createCompletionInfo(name, info) {
//   if (!info.params?.length) return info.info
  
//   // Create a concise parameter list like: (freq: number = 60, sync: number = 0.1)
//   const params = info.params
//     .map(p => `${p.name}: ${p.type}${p.default ? ` = ${p.default}` : ''}`)
//     .join(', ')
  
//   return `${info.info} (${params})`
// }

// Create the completion extension
export const hydraCompletion = {
  autocomplete: hydraSuggestions
}

// Export the theme separately
export const hydraCompletionTheme = completionTheme 