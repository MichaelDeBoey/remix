import * as path from 'node:path'

let __dirname = path.dirname(new URL(import.meta.url).pathname)
let fixturesDir = path.resolve(__dirname, 'assets')

export const fixtures = {
  app: path.resolve(fixturesDir, 'app.tsx'),
  page: path.resolve(fixturesDir, 'page.ts'),
  styles: path.resolve(fixturesDir, 'styles.css'),
  utils: path.resolve(fixturesDir, 'utils.ts'),
}
