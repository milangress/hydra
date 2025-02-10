import {syntaxTree} from "@codemirror/language"
import { HYDRA_GLOBALS, EXTERNAL_SOURCES, hydraFunctions } from "./completionData"

import { completionTheme } from "./completionTheme"

// example hydra code
// osc(30,0.01,1)
// .mult(osc(20,-0.1,1).modulate(noise(3,1)).rotate(0.7))
// .posterize([3,10,2].fast(0.5).smooth(1))
// .modulateRotate(o0,()=>mouse.x*0.003)
// .out()

function findFunctionContext(node, context) {
  let current = node;
  let functionName = null;
  let paramIndex = 0;

  // First find the ArgList we're in
  while (current && current._parent) {
    if (current.type.name === 'ArgList') {
      break;
    }
    current = current._parent;
  }

  if (!current) return { functionName: null, paramIndex: 0 };

  // Get the parent CallExpression
  let callExpr = current._parent;
  if (!callExpr || callExpr.type.name !== 'CallExpression') {
    return { functionName: null, paramIndex: 0 };
  }

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

  // If the CallExpression is part of a MemberExpression, get its name
  let parent = callExpr._parent;
  if (parent?.type.name === 'MemberExpression') {
    let propName = parent.lastChild;
    if (propName && propName.type.name === 'PropertyName') {
      functionName = context.state.doc.sliceString(propName.from, propName.to);
      console.log('Found function in member expression:', {
        functionName,
        nodeType: propName.type.name,
        parentType: parent.type.name,
        text: context.state.doc.sliceString(callExpr.from, callExpr.to)
      });
    }
  } else {
    // Otherwise, try to get the name from the CallExpression itself
    if (callExpr.firstChild && callExpr.firstChild.type.name === 'VariableName') {
      functionName = context.state.doc.sliceString(callExpr.firstChild.from, callExpr.firstChild.to);
      console.log('Found direct function call:', {
        functionName,
        nodeType: callExpr.firstChild.type.name,
        text: context.state.doc.sliceString(callExpr.from, callExpr.to)
      });
    }
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

  const heuristics = analyzeHeuristicsToBebuggASTSearches(beforeCursor)

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

  // Initialize function detection variables
  let afterFunction = false
  let lastFunctionName = null
  let node = nodeBefore

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
    grandparentType: nodeBefore._parent?._parent?.type.name,
    afterFunction,
    afterDot,
    lastFunctionName,
    nodeText: context.state.doc.sliceString(nodeBefore.from, nodeBefore.to)
  })

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

  // Check if we're after a function call
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
              apply: name,
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
              apply: name,
            })
          }
        }
        // Add source generators
        for (let [name, info] of Object.entries(hydraFunctions)) {
          if (info.type === 'src') {
            options.push({
              label: `${name}()`,  // Show parentheses in label
              type: info.type,
              apply: name,
            })
          }
        }
      } else {
        options.push({
          label: String(param.default),
          type: param.type,
          apply: String(param.default),
        })
      }
    }
  }
  // At the start of a line or after out(), show source generators
  else if ((afterDot || afterFunction) && !inParameters && lastFunctionName !== 'out') {
    // Show chainable methods
    for (let [name, info] of Object.entries(hydraFunctions)) {
      if (['color', 'coord', 'combine', 'combineCoord'].includes(info.type)) {
        options.push({
          label: `.${name}()`,  // Show parentheses in label
          type: info.type,
          apply: `.${name}`,
        })
      }
    }
    // Add .out() as a chainable method
    options.push({
      label: `.out()`,
      type: 'output',
      apply: '.out()',
    })
  }
  // Only show source generators and globals at the start of a line
  else if (!inParameters && !afterDot && !afterFunction) {
    for (let [name, info] of Object.entries(hydraFunctions)) {
      if (info.type === 'src' || info.type === 'external') {
        options.push({
          label: `${name}()`,  // Show parentheses in label
          type: info.type,
          apply: name,
        })
      }
    }
    // Add globals only if not after out()
    if (lastFunctionName !== 'out') {
      for (let [name, info] of Object.entries(HYDRA_GLOBALS)) {
        options.push({
          label: name,
          type: info.type,
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



// Create the completion extension
export const hydraCompletion = {
  autocomplete: hydraSuggestions
}

// Export the theme separately
export const hydraCompletionTheme = completionTheme 