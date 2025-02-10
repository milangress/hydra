import { describe, test, expect, vitest } from 'vitest';
import { 
  pathFor,
  getCurrentFunction,
  getLastFunction,
  findFunctionContext,
  isChainableExpression,
  isAfterDot,
  isInParameters,
  completionPath
} from '../contextAnalizer';

import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

// Helper to create a real CodeMirror state with actual parsing
function createEditorState(doc) {
  return EditorState.create({
    doc,
    extensions: [javascript()]
  });
}

// Helper to get the syntax tree node at a position
function getNodeAt(state, pos) {
  const tree = syntaxTree(state);
  return tree.resolveInner(pos, -1);
}

describe('contextAnalizer', () => {
  describe('getCurrentFunction', () => {
    test('should get function name at cursor', () => {
      expect(getCurrentFunction('osc(')).toBe('osc');
      expect(getCurrentFunction('  rotate(')).toBe('rotate');
      expect(getCurrentFunction('.color(')).toBe('color');
    });

    test.todo('should handle nested function calls', () => {
      expect(getCurrentFunction('osc(noise(')).toBe('noise');
      expect(getCurrentFunction('modulate(osc(')).toBe('osc');
    });

    test.todo('should handle arrow functions', () => {
      expect(getCurrentFunction('scale(()=>')).toBe('scale');
      expect(getCurrentFunction('.brightness(()=>')).toBe('brightness');
    });
  });

  describe('getLastFunction', () => {
    test.todo('should get previous function in chain', () => {
      expect(getLastFunction('osc().color(')).toBe('osc');
      expect(getLastFunction('noise(3,1).rotate(0.7).mult(')).toBe('rotate');
    });

    test.todo('should handle nested chains', () => {
      expect(getLastFunction('osc(30).mult(osc(20).rotate(0.7)).')).toBe('mult');
    });
  });

  describe('isAfterDot', () => {
    test('should detect direct dot', () => {
      const code = 'osc(30).';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isAfterDot(nodeBefore, node, { text: '.' }, code)).toBe(true);
    });

    test.todo('should handle multiline chains', () => {
      const code = 'osc(30,0.01,1)\n.mult(osc(20))\n.';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isAfterDot(nodeBefore, node, { text: '.' }, code)).toBe(true);
    });

    test.todo('should handle spaces after dot', () => {
      const code = 'osc(30). ';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isAfterDot(nodeBefore, node, { text: ' ' }, code)).toBe(true);
    });
  });

  describe('isInParameters', () => {
    test('should detect basic parameter position', () => {
      const code = 'osc(30,';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isInParameters(node, nodeBefore, 'osc')).toBe(true);
    });

    test.todo('should handle nested function parameters', () => {
      const code = 'modulatePixelate(voronoi(4,0.2),';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isInParameters(node, nodeBefore, 'modulatePixelate')).toBe(true);
    });

    test.todo('should handle arrow function parameters', () => {
      const code = 'scale(()=>1+(Math.sin(time*2.5)*';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isInParameters(node, nodeBefore, 'scale')).toBe(true);
    });
  });

  describe('isChainableExpression', () => {
    test('should detect basic chains', () => {
      const code = 'osc(30).color(1,0,0)';
      const state = createEditorState(code);
      const pos = code.indexOf('.color');
      const node = getNodeAt(state, pos);
      
      expect(isChainableExpression(node)).toBe(true);
    });

    test.todo('should handle multiline complex chains', () => {
      const code = `voronoi(2,0.3,0.2).shift(0.5)
        .modulatePixelate(voronoi(4,0.2),32,2)
        .scale(()=>1+(Math.sin(time*2.5)*0.05))
        .diff(voronoi(3).shift(0.6))`;
      const state = createEditorState(code);
      const pos = code.lastIndexOf('.diff');
      const node = getNodeAt(state, pos);
      
      expect(isChainableExpression(node)).toBe(true);
    });

    test.todo('should handle nested array methods', () => {
      const code = '[3,10,2].fast(0.5).smooth(1)';
      const state = createEditorState(code);
      const pos = code.indexOf('.smooth');
      const node = getNodeAt(state, pos);
      
      expect(isChainableExpression(node)).toBe(true);
    });
  });

  describe('findFunctionContext', () => {
    test('should detect start of parameters', () => {
      const code = 'osc(30,0.1,1).color(1,0,0).out()';
      const state = createEditorState(code);
      const pos = 'osc('.length;
      
      const context = findFunctionContext(getNodeAt(state, pos), {
        state,
        pos
      });
      
      expect(context).toEqual({
        functionName: 'osc',
        paramIndex: 0
      });
    });

    test.todo('should handle complex nested expressions', () => {
      const code = `osc(30,0.01,1)
        .mult(osc(20,-0.1,1).modulate(noise(3,1)).rotate(0.7))
        .posterize([3,10,2].fast(0.5).smooth(1))`;
      const state = createEditorState(code);
      const pos = code.indexOf('noise(') + 'noise('.length;
      
      const context = findFunctionContext(getNodeAt(state, pos), {
        state,
        pos
      });
      
      expect(context).toEqual({
        functionName: 'noise',
        paramIndex: 0
      });
    });

    test.todo('should handle arrow functions with math', () => {
      const code = 'scale(()=>1+(Math.sin(time*2.5)*0.05))';
      const state = createEditorState(code);
      const pos = code.indexOf('Math.sin(') + 'Math.sin('.length;
      
      const context = findFunctionContext(getNodeAt(state, pos), {
        state,
        pos
      });
      
      expect(context).toEqual({
        functionName: 'sin',
        paramIndex: 0
      });
    });
  });

  describe('completionPath', () => {
    test.todo('should build path for complex chains', () => {
      const code = `voronoi(2,0.3,0.2).shift(0.5)
        .modulatePixelate(voronoi(4,0.2),32,2)
        .scale(()=>1+(Math.sin(time*2.5)*0.05))
        .diff(voronoi(3).shift(0.6))
        .brightness(0.1).contrast(1.2)`;
      const state = createEditorState(code);
      const pos = code.lastIndexOf('.contrast');
      
      const result = completionPath(getNodeAt(state, pos), {
        state,
        pos
      });
      
      expect(result).toEqual({
        path: ['voronoi', 'shift', 'modulatePixelate', 'scale', 'diff', 'brightness', 'contrast'],
        name: ''
      });
    });

    test.todo('should handle array method chains', () => {
      const code = '.posterize([3,10,2].fast(0.5).smooth(1))';
      const state = createEditorState(code);
      const pos = code.indexOf('.smooth');
      
      const result = completionPath(getNodeAt(state, pos), {
        state,
        pos
      });
      
      expect(result).toEqual({
        path: ['fast', 'smooth'],
        name: ''
      });
    });
  });
}); 