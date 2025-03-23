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

const getLastGitCommitHash = () => {
    try {
        return execSync('git log -1 --format=%H').toString().trim()
    } catch (e) {
        return 'unknown'
    }
}
const getNodeEnv = () => {
    return process.env.NODE_ENV ?? 'unknown'
}
const getNodeVersion = () => {
    return process.version ?? 'unknown'
}

const getGitRemote = () => {
    try {
        return execSync('git remote get-url origin').toString().trim()
    } catch (e) {
        return 'unknown'
    }
}

const getcoolifyfqdn = () => {
    return process.env.COOLIFY_FQDN 
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
        '__NODE_VERSION__': JSON.stringify(getNodeVersion()),
        '__GIT_REMOTE__': JSON.stringify(getGitRemote()),
        '__GIT_COMMIT_HASH__': JSON.stringify(getLastGitCommitHash()),
        '__COOLIFY_FQDN__': JSON.stringify(getcoolifyfqdn())

    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
})