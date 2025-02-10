import {syntaxTree} from "@codemirror/language"
import { HYDRA_GLOBALS, hydraFunctions } from "./completionData"
import { completionTheme } from "./completionTheme"
import {
  findFunctionContext,
  isChainableExpression,
  isAfterDot,
  isInParameters,  
} from "./contextAnalizer"

// example hydra code
// osc(30,0.01,1)
// .mult(osc(20,-0.1,1).modulate(noise(3,1)).rotate(0.7))
// .posterize([3,10,2].fast(0.5).smooth(1))
// .modulateRotate(o0,()=>mouse.x*0.003)
// .out()

//osc(30).color(0,0,1).out()



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

  // Find function context using AST
  const { functionName, paramIndex } = findFunctionContext(nodeMe, context)

  // Initialize options array
  let options = []

  // Check context using the new helper functions
  let afterDot = isAfterDot(nodeBefore, nodeBeforeBefore, before, lineText)
  let inChain = isChainableExpression(nodeBefore)
  let inParameters = isInParameters(nodeMe, nodeBefore, functionName)

  // If we're in parameters, show parameter completions
  if (inParameters) {
    const func = hydraFunctions[functionName];
    
    if (func?.params && paramIndex < func.params.length) {
      const param = func.params[paramIndex];
      
      // Special handling for out() and render()
      if (functionName === 'out' || functionName === 'render') {
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
              label: `${name}()`,
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
  else if ((afterDot || inChain) && !inParameters) {
    // Show chainable methods
    for (let [name, info] of Object.entries(hydraFunctions)) {
      if (['color', 'coord', 'combine', 'combineCoord'].includes(info.type)) {
        options.push({
          label: `.${name}()`,
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
  else if (!inParameters && !afterDot && !inChain) {
    for (let [name, info] of Object.entries(hydraFunctions)) {
      if (info.type === 'src' || info.type === 'external') {
        options.push({
          label: `${name}()`,
          type: info.type,
          apply: name,
        })
      }
    }
    // Add globals only if not after out()
    if (functionName !== 'out') {
      for (let [name, info] of Object.entries(HYDRA_GLOBALS)) {
        options.push({
          label: name,
          type: info.type,
        })
      }
    }
  }

  return {
    from: before.from,
    options,
    validFor: afterDot ? /^\.[\w$]*$/ : /^[\w$]*$/
  }
}

// Create the completion extension
export const hydraCompletion = {
  autocomplete: hydraSuggestions
}

// Export the theme separately
export const hydraCompletionTheme = completionTheme 