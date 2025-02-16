import {syntaxTree} from "@codemirror/language"

// Node types we care about for completion
export const ScopeNodes = new Set([
  "Script", "Block", "FunctionExpression", 
  "FunctionDeclaration", "ArrowFunction",
  "MethodDeclaration"
])

export const ExpressionNodes = new Set([
  "CallExpression", "MemberExpression",
  "BinaryExpression", "UnaryExpression"
])

export const DontCompleteInside = new Set([
  "String", "LineComment", "BlockComment",
  "TemplateString"
])

// Helper to read text from a node
export function readNodeText(node, context) {
  return context.state.doc.sliceString(node.from, node.to);
}


// Get the current function name from text
export function getCurrentFunction(text) {
  // Find the last opening parenthesis
  const lastParenIndex = text.lastIndexOf('(');
  if (lastParenIndex === -1) return null;

  // Look backwards for the function name
  const beforeParen = text.slice(0, lastParenIndex);
  const match = beforeParen.match(/[a-zA-Z_$][a-zA-Z0-9_$]*$/);
  return match ? match[0] : null;
}

export function findFunctionContext(node, context) {
  const beforeCursor = context.state.doc.sliceString(0, context.pos);
  
  // Find the innermost unclosed function call
  let depth = 0;
  let functions = [];
  
  // Scan from left to right
  for (let i = 0; i < beforeCursor.length; i++) {
    const char = beforeCursor[i];
    
    // Look for function names
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
    
    // Track depth and count commas
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

// New context analysis functions
export function isAfterDot(nodeBefore, nodeBeforeBefore, before, lineText) {
  return nodeBefore.type.name === '.' || 
         (nodeBeforeBefore.type.name === '.' && nodeBefore.type.name === 'VariableName') ||
         before.text.startsWith('.') ||
         // Add this case for dots after completed function calls
         (nodeBefore.type.name === 'MemberExpression' && lineText.endsWith('.'));
}

export function isInParameters(nodeMe, nodeBefore, functionName) {
  return nodeMe.type.name === 'ArgList' || 
         nodeBefore.type.name === 'ArgList' || 
         !!functionName;
}



