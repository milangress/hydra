import { defineConfig } from 'vite'
import { execSync } from 'child_process'

// Get git info at build time
const getGitBranch = () => {
    try {
        return execSync('git branch --show-current').toString().trim()
    } catch (e) {
        return 'unknown'
    }
}

const getGitCommit = () => {
    try {
        return execSync('git log -1 --pretty=format:"%h - %s"').toString().trim()
    } catch (e) {
        return 'unknown'
    }
}

const getBuildDate = () => {
    const date = new Date()
    return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
}
const getNodeEnv = () => {
    return process.env.NODE_ENV
}
const getNodeVersion = () => {
    return process.version
}

export default defineConfig({
    //define: { global: {} },
    base: '',
    define: {
        'process.env': {},
        // 'global.window': 'window'
        // global: {}
        '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
        '__GIT_BRANCH__': JSON.stringify(getGitBranch()),
        '__GIT_COMMIT__': JSON.stringify(getGitCommit()),
        '__BUILD_DATE__': JSON.stringify(getBuildDate()),
        '__NODE_ENV__': JSON.stringify(getNodeEnv()),
        '__NODE_VERSION__': JSON.stringify(getNodeVersion())
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
})