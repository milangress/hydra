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

// Get the path for a member expression
export function pathFor(read, member, name) {
  console.log('pathFor called with:', {
    member: member.type.name,
    name,
    memberParent: member._parent?.type.name
  });
  
  let path = [];
  let current = member;

  // Walk up the tree to build the path
  while (current) {
    console.log('current node:', {
      type: current.type.name,
      parent: current._parent?.type.name,
      firstChild: current.firstChild?.type.name,
      lastChild: current.lastChild?.type.name
    });
    
    // Handle CallExpression
    if (current.type.name === 'CallExpression') {
      let funcName = current.firstChild;
      if (funcName?.type.name === 'VariableName') {
        path.unshift(read(funcName));
      }
      // If this call is part of a chain, continue up
      if (current._parent?.type.name === 'MemberExpression') {
        current = current._parent;
        continue;
      }
    }
    // Handle PropertyName in MemberExpression
    else if (current.type.name === 'MemberExpression') {
      // Get the property name (method name in the chain)
      let prop = current.lastChild;
      if (prop?.type.name === 'PropertyName') {
        path.unshift(read(prop));
      }
      
      // If this member expression has a call expression as its first child,
      // we need to get that function name too
      let expr = current.firstChild;
      if (expr?.type.name === 'CallExpression') {
        let funcName = expr.firstChild;
        if (funcName?.type.name === 'VariableName') {
          path.unshift(read(funcName));
        }
      }
    }
    // Handle base VariableName
    else if (current.type.name === 'VariableName') {
      path.unshift(read(current));
    }
    
    // Move up to parent, but skip ArgList nodes
    do {
      current = current._parent;
    } while (current?.type.name === 'ArgList');
  }

  console.log('Built path:', path);
  return { path, name };
}

// Get the completion path and current name being completed
export function completionPath(node, context) {
  let read = (node) => context.state.doc.sliceString(node.from, node.to);
  let inner = syntaxTree(context.state).resolveInner(context.pos, -1);

  console.log('completionPath called with:', {
    nodeType: inner.type.name,
    parent: inner._parent?.type.name,
    grandparent: inner._parent?._parent?.type.name
  });

  // Don't complete in certain contexts
  if (DontCompleteInside.has(inner.type.name)) {
    return null;
  }

  // After dot completion
  if ((inner.type.name === '.' || inner.type.name === '?.') && 
      inner._parent?.type.name === 'MemberExpression') {
    return pathFor(read, inner._parent, '');
  }
  
  // Property name completion
  if (inner.type.name === 'PropertyName') {
    return pathFor(read, inner._parent, read(inner));
  }

  // ArgList completion (specific to Hydra)
  if (inner.type.name === 'ArgList' || inner.type.name === '(') {
    let callExpr = inner.type.name === '(' ? inner._parent._parent : inner._parent;
    console.log('Found CallExpression:', {
      type: callExpr?.type.name,
      parent: callExpr?._parent?.type.name
    });

    if (callExpr?.type.name === 'CallExpression') {
      // Walk up to find the full chain
      let current = callExpr;
      let path = [];
      
      while (current) {
        console.log('Walking up chain:', current.type.name);
        
        if (current.type.name === 'CallExpression') {
          let funcName = current.firstChild;
          if (funcName?.type.name === 'VariableName') {
            path.unshift(read(funcName));
          }
        } else if (current.type.name === 'MemberExpression') {
          let prop = current.lastChild;
          if (prop?.type.name === 'PropertyName') {
            path.unshift(read(prop));
          }
        }
        
        current = current._parent;
      }
      
      console.log('Built chain path:', path);
      return { path, name: '' };
    }
  }

  // Member expression completion
  if (inner.type.name === 'MemberExpression') {
    return pathFor(read, inner, '');
  }

  // Variable name completion
  if (inner.type.name === 'VariableName') {
    return { path: [read(inner)], name: read(inner) };
  }

  // Default case
  return { path: [], name: '' };
}

// Get the current function name from text
export function getCurrentFunction(text) {
  // Match either:
  // 1. functionName( at the start or after whitespace
  // 2. .functionName( in a chain
  const match = text.match(/(?:^|\s)(\w+)\($|\.(\w+)\($/)
  return match ? (match[1] || match[2]) : null
}

// Get the last function in a chain before the current one
export function getLastFunction(text) {
  const parts = text.split('.')
  if (parts.length < 2) return null
  
  // Look at the second-to-last part
  const match = parts[parts.length - 2].match(/(\w+)\(/)
  return match ? match[1] : null
}

export function findFunctionContext(node, context) {
  let line = context.state.doc.lineAt(context.pos)
  let beforeCursor = line.text.slice(0, context.pos - line.from)
  
  let functionName = getCurrentFunction(beforeCursor)
  
  // Count commas before cursor to determine parameter index
  let paramIndex = (beforeCursor.match(/,/g) || []).length

  console.log('Function context:', {
    functionName,
    paramIndex,
    beforeCursor
  })

  return { functionName, paramIndex }
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

