import glslFunctions from 'hydra-synth/src/glsl/glsl-functions.js'

// External source functions
export const EXTERNAL_SOURCES = {
    initCam: {
      type: 'external',
      params: [
        { name: 'index', type: 'number', default: '0' }
      ]
    },
    initImage: {
      type: 'external',
      params: [
        { name: 'url', type: 'string' }
      ]
    },
    initVideo: {
      type: 'external',
      params: [
        { name: 'url', type: 'string' }
      ]
    },
    initStream: {
      type: 'external',
      params: [
        { name: 'name', type: 'string' }
      ]
    },
    initScreen: {
      type: 'external',
      params: []
    }
  }
  
  // Global variables available in Hydra
  export const HYDRA_GLOBALS = {
    time: { type: 'number' },
    bpm: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    mouse: { 
      type: 'object', 
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      }
    },
    o0: { type: 'output' },
    o1: { type: 'output' },
    o2: { type: 'output' },
    o3: { type: 'output' },
    s0: { type: 'source' },
    s1: { type: 'source' },
    s2: { type: 'source' },
    s3: { type: 'source' }
  }
  
  // Convert GLSL functions to completions format
  function convertToCompletions(functions) {
    const completions = {}
  
    // Add GLSL functions
    functions().forEach(func => {
      completions[func.name] = {
        type: func.type,
        params: func.inputs.map(input => ({
          name: input.name,
          type: input.type,
          default: String(input.default),
        }))
      }
    })
  
    // Add external sources
    Object.entries(EXTERNAL_SOURCES).forEach(([name, info]) => {
      completions[name] = {
        ...info,
      }
    })
  
    return completions
  }
  
  // Get completions from hydra-synth
  export const hydraFunctions = convertToCompletions(glslFunctions)