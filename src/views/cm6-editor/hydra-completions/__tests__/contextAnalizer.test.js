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

    test('should handle nested function calls', () => {
      expect(getCurrentFunction('osc(noise(')).toBe('noise');
      expect(getCurrentFunction('modulate(osc(')).toBe('osc');
    });

    test('should handle method chains', () => {
      expect(getCurrentFunction('osc(30).color(')).toBe('color');
      expect(getCurrentFunction(').rotate(')).toBe('rotate');
      expect(getCurrentFunction('src.initCam(')).toBe('initCam');
    });

    test('should handle array method chains', () => {
      expect(getCurrentFunction('[3,10,2].fast(')).toBe('fast');
      expect(getCurrentFunction('].smooth(')).toBe('smooth');
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

    test('should handle multiline chains', () => {
      const code = 'osc(30,0.01,1)\n.mult(osc(20))\n.';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isAfterDot(nodeBefore, node, { text: '.' }, code)).toBe(true);
    });

    test('should handle spaces after dot', () => {
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

    test('should handle nested function parameters', () => {
      const code = 'modulatePixelate(voronoi(4,0.2),';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      const nodeBefore = getNodeAt(state, pos - 1);
      
      expect(isInParameters(node, nodeBefore, 'modulatePixelate')).toBe(true);
    });

    test('should handle arrow function parameters', () => {
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

    test('should handle multiline complex chains', () => {
      const code = `voronoi(2,0.3,0.2).shift(0.5)
        .modulatePixelate(voronoi(4,0.2),32,2)
        .scale(()=>1+(Math.sin(time*2.5)*0.05))
        .diff(voronoi(3).shift(0.6))`;
      const state = createEditorState(code);
      const pos = code.lastIndexOf('.diff');
      const node = getNodeAt(state, pos);
      
      expect(isChainableExpression(node)).toBe(true);
    });

    test('should handle nested array methods', () => {
      const code = '[3,10,2].fast(0.5).smooth(1)';
      const state = createEditorState(code);
      const pos = code.indexOf('.smooth');
      const node = getNodeAt(state, pos);
      
      expect(isChainableExpression(node)).toBe(true);
    });
  });

  describe('findFunctionContext', () => {
    test('should detect start of parameters', () => {
      const code = 'osc(';
      const state = createEditorState(code);
      const pos = code.length;
      const node = getNodeAt(state, pos);
      
      expect(findFunctionContext(node, {
        state,
        pos
      })).toEqual({
        functionName: 'osc',
        paramIndex: 0
      });
    });

    test('should correctly count parameters in nested calls', () => {
      const code = 'osc(30,noise(3,1),1)';
      const state = createEditorState(code);
      
      // Test cursor in noise function after the first comma
      const noisePos = code.indexOf('noise(3,') + 'noise(3,'.length;
      const noiseContext = findFunctionContext(getNodeAt(state, noisePos), {
        state,
        pos: noisePos
      });
      
      expect(noiseContext).toEqual({
        functionName: 'noise',
        paramIndex: 1
      });

      // Test cursor in outer osc function after the second comma
      const oscPos = code.indexOf('noise(3,1),') + 'noise(3,1),'.length;
      const oscContext = findFunctionContext(getNodeAt(state, oscPos), {
        state,
        pos: oscPos
      });
      
      expect(oscContext).toEqual({
        functionName: 'osc',
        paramIndex: 2
      });
    });

    test('should handle method chains', () => {
      const code = 'osc(30,0.1).color(1,0,0).rotate(0.1)';
      const state = createEditorState(code);
      
      // Test cursor in color function after second comma
      const colorPos = code.indexOf('color(1,0,') + 'color(1,0,'.length;
      const colorContext = findFunctionContext(getNodeAt(state, colorPos), {
        state,
        pos: colorPos
      });
      
      expect(colorContext).toEqual({
        functionName: 'color',
        paramIndex: 2
      });
    });
  });

}); 