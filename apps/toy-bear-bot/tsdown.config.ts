import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/deploy-commands.ts'],
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
  dts: false,
  deps: {
    skipNodeModulesBundle: true,
  },
})
