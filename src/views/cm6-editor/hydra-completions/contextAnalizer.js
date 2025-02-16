import {syntaxTree} from "@codemirror/language"

/**
 * Sets of node types used for different completion contexts in the CodeMirror syntax tree.
 * These help determine where and how to provide code completions.
 */

// Node types that represent different scoping contexts (functions, blocks, etc)
export const ScopeNodes = new Set([
  "Script", "Block", "FunctionExpression", 
  "FunctionDeclaration", "ArrowFunction",
  "MethodDeclaration"
])

// Node types that can be part of a chainable expression (e.g. osc().color())
export const ExpressionNodes = new Set([
  "CallExpression", "MemberExpression",
  "BinaryExpression", "UnaryExpression"
])

// Node types where we should not provide completions (strings, comments)
export const DontCompleteInside = new Set([
  "String", "LineComment", "BlockComment",
  "TemplateString"
])

/**
 * Helper to extract text from a CodeMirror syntax tree node
 * @param {SyntaxNode} node - The syntax tree node
 * @param {Object} context - The editor context containing state
 * @returns {string} The text content of the node
 */
export function readNodeText(node, context) {
  return context.state.doc.sliceString(node.from, node.to);
}

/**
 * Extracts the name of the function at the current cursor position
 * For example: in "osc(30).color(" it returns "color"
 * 
 * @param {string} text - The text up to the cursor position
 * @returns {string|null} The function name, or null if not in a function
 */
export function getCurrentFunction(text) {
  // Find the last opening parenthesis
  const lastParenIndex = text.lastIndexOf('(');
  if (lastParenIndex === -1) return null;

  // Look backwards for the function name
  const beforeParen = text.slice(0, lastParenIndex);
  const match = beforeParen.match(/[a-zA-Z_$][a-zA-Z0-9_$]*$/);
  return match ? match[0] : null;
}

/**
 * Analyzes the context around the cursor to find which function call we're in
 * and at which parameter index.
 * 
 * For example:
 * - In "osc(|"          -> { functionName: "osc", paramIndex: 0 }
 * - In "osc(30,|"       -> { functionName: "osc", paramIndex: 1 }
 * - In "osc(noise(3,|)" -> { functionName: "noise", paramIndex: 1 }
 * 
 * This handles nested function calls by maintaining a stack of open functions
 * and tracking parenthesis depth to know which function we're currently in:
 * 
 * osc(30, noise(3,1), 1)
 * ^    ^  ^    ^  ^  ^
 * |    |  |    |  |  |
 * |    |  |    |  |  +-- back to osc's params
 * |    |  |    |  +---- close noise
 * |    |  |    +------ inside noise's params
 * |    |  +---------- start noise at depth 1
 * |    +------------ inside osc params
 * +----------------- start osc at depth 0
 * 
 * @param {SyntaxNode} node - The syntax tree node at the cursor
 * @param {Object} context - Editor context with state and cursor position
 * @returns {Object} The function context: { functionName, paramIndex }
 */
export function findFunctionContext(node, context) {
  const beforeCursor = context.state.doc.sliceString(0, context.pos);
  
  // Find the innermost unclosed function call
  let depth = 0;
  let functions = [];
  
  // Scan from left to right
  for (let i = 0; i < beforeCursor.length; i++) {
    const char = beforeCursor[i];
    
    // Look for function names when we see a potential identifier start
    if (/[a-zA-Z_$]/.test(char)) {
      const remaining = beforeCursor.slice(i);
      const match = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\(/);
      if (match) {
        functions.push({
          functionName: match[0].slice(0, -1),
          paramIndex: 0,
          depth: depth
        });
        i += match[0].length - 1; // Skip past the opening paren
        depth++;
        continue;
      }
    }
    
    // Track parenthesis depth and count commas
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
      // Remove functions that have been closed
      while (functions.length > 0 && functions[functions.length - 1].depth >= depth) {
        functions.pop();
      }
    } else if (char === ',' && functions.length > 0) {
      const current = functions[functions.length - 1];
      // Only count commas at the correct depth for the current function
      if (depth === current.depth + 1) {
        current.paramIndex++;
      }
    }
  }
  
  // Return the innermost function that's still open
  if (functions.length > 0) {
    const { functionName, paramIndex } = functions[functions.length - 1];
    return { functionName, paramIndex };
  }
  
  return { functionName: null, paramIndex: 0 };
}

/**
 * Determines if a node is part of a chainable expression
 * For example: osc().color(), [1,2].fast()
 * 
 * @param {SyntaxNode} node - The syntax tree node to check
 * @returns {boolean} True if the node is part of a chainable expression
 */
export function isChainableExpression(node) {
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

/**
 * Checks if we're in a position where method chaining can occur (after a dot)
 * For example: osc(30).| or osc(30). | or osc(30)\n.|
 * 
 * @param {SyntaxNode} nodeBefore - The node before the cursor
 * @param {SyntaxNode} nodeBeforeBefore - The node before nodeBefore
 * @param {Object} before - Context about the text before the cursor
 * @param {string} lineText - The full line of text
 * @returns {boolean} True if we're in a position for method chaining
 */
export function isAfterDot(nodeBefore, nodeBeforeBefore, before, lineText) {
  return nodeBefore.type.name === '.' || 
         (nodeBeforeBefore.type.name === '.' && nodeBefore.type.name === 'VariableName') ||
         before.text.startsWith('.') ||
         // Add this case for dots after completed function calls
         (nodeBefore.type.name === 'MemberExpression' && lineText.endsWith('.'));
}

/**
 * Checks if we're currently inside a function's parameter list
 * For example: osc(|), osc(30,|), or in nested calls
 * 
 * @param {SyntaxNode} nodeMe - The current node
 * @param {SyntaxNode} nodeBefore - The node before the cursor
 * @param {string} functionName - The name of the current function if any
 * @returns {boolean} True if we're inside a parameter list
 */
export function isInParameters(nodeMe, nodeBefore, functionName) {
  return nodeMe.type.name === 'ArgList' || 
         nodeBefore.type.name === 'ArgList' || 
         !!functionName;
}



