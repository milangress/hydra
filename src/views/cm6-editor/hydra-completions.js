import { CompletionContext } from '@codemirror/autocomplete'
import glslFunctions from 'hydra-synth/src/glsl/glsl-functions.js'
import {syntaxTree} from "@codemirror/language"
import { EditorView } from "@codemirror/view"
// Function type to icon mapping
const TYPE_ICONS = {
  src: '🎨 ', // Source generators
  coord: '📐 ', // Geometry operations
  color: '🎯 ', // Color operations
  combine: '🔀 ', // Blend operations
  combineCoord: '🔄 ', // Modulate operations
  external: '📡 ',  // External sources
  output: '⚡ '  // Output buffers
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

const mapClasses = Object.entries(TYPE_ICONS).map(([type, icon]) => {
  return `.cm-completionIcon-${type}:after { content: '${icon}'; }`
})

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
  ".cm-completionIcon": { 
    color: "inherit",
    width: "1em",
    marginRight: "0.5em",
  },
  ".cm-completionLabel": { color: "inherit" },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "4px 8px",
    marginRight: "0.5em",
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
  ...mapClasses,
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

function findFunctionContext(node, context) {
  let current = node;
  let functionName = null;
  let paramIndex = 0;

  // Helper to get function name from node
  function getFunctionNameFromNode(node) {
    if (!node) return null;
    if (node.type.name === 'PropertyName') {
      // Get the actual text content of the node
      return context.state.doc.sliceString(node.from, node.to);
    }
    if (node.type.name === 'VariableName') {
      return context.state.doc.sliceString(node.from, node.to);
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
            // Get the actual text of the last child
            let lastChild = chainNode.lastChild;
            if (lastChild) {
              functionName = context.state.doc.sliceString(lastChild.from, lastChild.to);
              console.log('Found function in chain:', {
                type: lastChild.type.name,
                text: functionName,
                node: lastChild
              });
            }
            break;
          }
          if (chainNode.type.name === 'CallExpression' && 
              chainNode._parent?.type.name === 'MemberExpression') {
            let lastChild = chainNode._parent.lastChild;
            if (lastChild) {
              functionName = context.state.doc.sliceString(lastChild.from, lastChild.to);
              console.log('Found function in call expression:', {
                type: lastChild.type.name,
                text: functionName,
                node: lastChild
              });
            }
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

function analyzeHeuristics(text, silent = false) {
  const openParens = (text.match(/\(/g) || []).length
  const closeParens = (text.match(/\)/g) || []).length
  
  // More detailed parameter detection
  const maybeParameters = {
    active: (openParens % 2 !== closeParens % 2) || /\([^)]*$/.test(text),
    reason: openParens !== closeParens ? 'unbalanced_parens' : 
            /\([^)]*$/.test(text) ? 'inside_parens' : null
  }

  const lastThree = text.slice(-3)
  // More detailed method chain detection
  const maybeMethodChainFunc = {
    active: /[)\.]$/.test(lastThree) || /\.\w*$/.test(text),
    reason: /[)\.]$/.test(lastThree) ? 'ends_with_dot_or_paren' :
            /\.\w*$/.test(text) ? 'partial_method_name' : null
  }

  // More detailed source detection
  const maybeSource = {
    active: /^[\s\n]*$/.test(text) || /\bout\(\)[;\s]*$/.test(text) || text.length === 0,
    reason: /^[\s\n]*$/.test(text) ? 'line_start' :
            /\bout\(\)[;\s]*$/.test(text) ? 'after_out' :
            text.length === 0 ? 'empty' : null
  }

  if (!silent && (maybeParameters.active || maybeMethodChainFunc.active || maybeSource.active)) {
    console.warn('Heuristics Analysis:', {
      maybeParameters,
      maybeMethodChainFunc,
      maybeSource
    })
  }
  return { maybeParameters, maybeMethodChainFunc, maybeSource }
}

// Helper for structured logging
function logDecision(phase, details) {
  console.warn(`🔍 [${phase}]`, details)
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

  const heuristics = analyzeHeuristics(beforeCursor)

  // Get the token before the cursor
  let before = context.matchBefore(/[\w.$]*$/)
  if (!before) return null

  // Debug the matched token
  console.log('Token:', {
    text: before.text,
    from: before.from,
    to: before.to
  })

  // Initialize options array here
  let options = []

  // Debug node types and structure
  console.log('Node Structure:', {
    nodeBeforeBefore: {
      type: nodeBeforeBefore.type.name,
      text: context.state.doc.sliceString(nodeBeforeBefore.from, nodeBeforeBefore.to),
      parent: nodeBeforeBefore._parent?.type.name
    },
    nodeBefore: {
      type: nodeBefore.type.name,
      text: context.state.doc.sliceString(nodeBefore.from, nodeBefore.to),
      parent: nodeBefore._parent?.type.name
    },
    nodeMe: {
      type: nodeMe.type.name,
      text: context.state.doc.sliceString(nodeMe.from, nodeMe.to),
      parent: nodeMe._parent?.type.name
    }
  })

  // Check if we're after a dot using syntax tree
  let afterDot = nodeBefore.type.name === '.' || 
                 (nodeBeforeBefore.type.name === '.' && nodeBefore.type.name === 'VariableName') ||
                 before.text.startsWith('.') ||
                 // Add this case for dots after completed function calls
                 (nodeBefore.type.name === 'MemberExpression' && lineText.endsWith('.'))

  console.log('Dot Detection:', {
    afterDot,
    conditions: {
      nodeBeforeIsDot: nodeBefore.type.name === '.',
      dotAndVariable: nodeBeforeBefore.type.name === '.' && nodeBefore.type.name === 'VariableName',
      startsWithDot: before.text.startsWith('.'),
      afterCompletedCall: nodeBefore.type.name === 'MemberExpression' && lineText.endsWith('.')
    }
  })

  // Check if we're in a chainable context
  let inChain = isChainableExpression(nodeBefore)
  console.log('Chain Detection:', {
    inChain,
    nodeType: nodeBefore.type.name,
    parentType: nodeBefore._parent?.type.name,
    grandparentType: nodeBefore._parent?._parent?.type.name
  })

  // Check if we're after a function call
  let afterFunction = false
  let lastFunctionName = null
  let node = nodeBefore

  // Helper to get function name from node
  function getFunctionNameFromNode(node) {
    if (!node) return null;
    if (node.type.name === 'PropertyName') {
      // Get the actual text content of the node
      return context.state.doc.sliceString(node.from, node.to);
    }
    if (node.type.name === 'VariableName') {
      return context.state.doc.sliceString(node.from, node.to);
    }
    return null;
  }

  while (node && node._parent) {
    console.log('Node traversal:', {
      currentType: node.type.name,
      parentType: node._parent.type.name,
      text: context.state.doc.sliceString(node.from, node.to)
    });

    if (node.type.name === 'CallExpression' || 
        (node.type.name === 'MemberExpression' && node.lastChild?.type.name === 'CallExpression')) {
      // Try to get function name from member expression
      if (node._parent?.type.name === 'MemberExpression') {
        lastFunctionName = getFunctionNameFromNode(node._parent.lastChild);
      } else {
        // Try to get function name directly
        lastFunctionName = getFunctionNameFromNode(node.firstChild);
      }
      afterFunction = true;
      console.log('Found function call:', {
        lastFunctionName,
        nodeType: node.type.name,
        parentType: node._parent?.type.name
      });
      break;
    }
    
    // Check for member expressions in chain
    if (node.type.name === 'MemberExpression') {
      lastFunctionName = getFunctionNameFromNode(node.lastChild);
      afterFunction = true;
      console.log('Found member expression:', {
        lastFunctionName,
        lastChildType: node.lastChild?.type.name
      });
      break;
    }

    // Check for property names in chain
    if (node.type.name === 'PropertyName') {
      lastFunctionName = node.name;
      afterFunction = true;
      console.log('Found property name:', {
        lastFunctionName,
        nodeText: context.state.doc.sliceString(node.from, node.to)
      });
      break;
    }

    node = node._parent;
  }

  // Find function context using AST first
  const { functionName, paramIndex } = findFunctionContext(nodeMe, context)

  // Add detailed function name resolution logging
  console.log('🔍 Function Name Resolution:', {
    raw: {
      functionName,
      lastFunctionName,
      paramIndex
    },
    nodeInfo: {
      type: nodeMe.type.name,
      text: context.state.doc.sliceString(nodeMe.from, nodeMe.to),
      parent: nodeMe._parent?.type.name
    },
    context: {
      inParameters: !!functionName,
      afterFunction,
      afterDot
    }
  });

  // Check if we're inside function parameters by looking for ArgList node
  const inParameters = nodeMe.type.name === 'ArgList' || 
                      nodeBefore.type.name === 'ArgList' || 
                      !!functionName

  if (inParameters) {
    // Use lastFunctionName as fallback if functionName is not found
    const currentFunction = functionName || lastFunctionName;
    
    // Log the function detection for debugging
    console.log('Function Detection:', {
      currentFunction,
      functionName,
      lastFunctionName,
      nodeType: nodeMe.type.name
    });
    
    const func = hydraFunctions[currentFunction];
    
    if (func?.params && paramIndex < func.params.length) {
      const param = func.params[paramIndex];
      
      console.log('Parameter Info:', {
        function: currentFunction,
        parameter: param,
        index: paramIndex
      });
      
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

  // Parameter completion validation
  if (heuristics.maybeParameters.active) {
    logDecision('Parameter Detection Validation', {
      heuristicSaysParameters: true,
      actuallyInParameters: inParameters,
      mismatch: heuristics.maybeParameters.active !== inParameters,
      heuristicReason: heuristics.maybeParameters.reason,
      actualState: {
        nodeMe: nodeMe.type.name,
        nodeBefore: nodeBefore.type.name,
        functionContext: {
          functionName,
          paramIndex,
          foundVia: functionName ? 'direct' : lastFunctionName ? 'chain' : 'none'
        },
        syntaxEvidence: {
          inArgList: nodeMe.type.name === 'ArgList',
          nodeBeforeIsArgList: nodeBefore.type.name === 'ArgList',
          hasFunction: !!functionName
        }
      }
    })
  }

  // Method chain validation
  if (heuristics.maybeMethodChainFunc.active) {
    const shouldBeChainable = (afterDot || afterFunction) && !inParameters && lastFunctionName !== 'out'
    logDecision('Method Chain Validation', {
      heuristicSaysChain: true,
      actuallyChainable: shouldBeChainable,
      mismatch: heuristics.maybeMethodChainFunc.active !== shouldBeChainable,
      heuristicReason: heuristics.maybeMethodChainFunc.reason,
      actualState: {
        afterDot: {
          value: afterDot,
          evidence: {
            isDot: nodeBefore.type.name === '.',
            dotAndVariable: nodeBeforeBefore.type.name === '.' && nodeBefore.type.name === 'VariableName',
            startsWithDot: before.text.startsWith('.'),
            afterMemberExpr: nodeBefore.type.name === 'MemberExpression' && lineText.endsWith('.')
          }
        },
        afterFunction: {
          value: afterFunction,
          lastFunctionName,
          nodeType: node?.type.name
        },
        blockingConditions: {
          inParameters,
          isOutFunction: lastFunctionName === 'out'
        }
      }
    })
  }

  // Source completion validation
  if (heuristics.maybeSource.active) {
    const shouldShowSources = !inParameters && !afterDot && !afterFunction
    logDecision('Source Completion Validation', {
      heuristicSaysSource: true,
      actuallyShowingSources: shouldShowSources,
      mismatch: heuristics.maybeSource.active !== shouldShowSources,
      heuristicReason: heuristics.maybeSource.reason,
      actualState: {
        blockingConditions: {
          inParameters,
          afterDot,
          afterFunction
        },
        context: {
          nodeType: nodeBefore.type.name,
          lastFunctionName,
          atLineStart: lineText.slice(0, cursorCol).trim().length === 0
        }
      }
    })
  }

  // Log final decision with validation summary
  logDecision('Final Decision Summary', {
    heuristics: {
      suggestedParameters: heuristics.maybeParameters.active,
      suggestedChain: heuristics.maybeMethodChainFunc.active,
      suggestedSource: heuristics.maybeSource.active
    },
    actualDecision: {
      showingParameters: inParameters,
      showingChainMethods: (afterDot || afterFunction) && !inParameters && lastFunctionName !== 'out',
      showingSourceGenerators: !inParameters && !afterDot && !afterFunction
    },
    mismatches: {
      parameters: heuristics.maybeParameters.active !== inParameters,
      chain: heuristics.maybeMethodChainFunc.active !== ((afterDot || afterFunction) && !inParameters && lastFunctionName !== 'out'),
      source: heuristics.maybeSource.active !== (!inParameters && !afterDot && !afterFunction)
    }
  })

  // Log the final completions being returned
  console.log('Returning Completions:', {
    from: before.from,
    validFor: afterDot ? /^\.[\w$]*$/ : /^[\w$]*$/,
    completions: options.map(opt => ({
      label: opt.label,
      type: opt.type,
      apply: opt.apply,
      class: opt.class
    })),
    context: {
      afterDot,
      afterFunction,
      inParameters,
      inChain,
      lastFunctionName
    }
  });

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

// setTimeout(() => {
//   console.log('hydraFunctions', hydraFunctions)
//   debugger
// }, 10000)

// Create the completion extension
export const hydraCompletion = {
  autocomplete: hydraSuggestions
}

// Export the theme separately
export const hydraCompletionTheme = completionTheme 