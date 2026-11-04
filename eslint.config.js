// ESLint 9 flat config (replaces .eslintrc.json, which ESLint 9 ignores).
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/package.json',
      '**/package-lock.json',
      'dist/**',
      'test/**'
    ]
  },
  js.configs.recommended,
  {
    files: [ 'src/**/*.js' ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs
      }
    },
    rules: {
      'no-redeclare': [ 'warn' ]
    }
  },
  {
    // Scripts injected into the Apple Music page via executeJavaScript().
    // They run in the page's main world, where MusicKit comes from the site
    // and `ipc` is exposed by preload/client-preload.js via contextBridge.
    files: [ 'src/renderer/**/*.js' ],
    languageOptions: {
      globals: {
        ...globals.browser,
        MusicKit: 'readonly',
        ipc: 'readonly'
      }
    }
  }
];
