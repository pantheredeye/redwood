import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import execa from 'execa'
import chalk from 'chalk'

import c from 'src/lib/colors'
import { getPaths, writeFile } from 'src/lib'

export const command = 'i18n'
export const description = 'Setup i18n'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

const INDEX_JS_PATH = path.join(getPaths().web.src, 'index.js')

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: async () => {
        await execa('yarn', [
          'workspace',
          'web',
          'add',
          'i18n',
          'i18next',
          'i18next-browser-languagedetector',
          'i18next-http-backend',
          'react-i18next'
        ])
      },
    },
    {
      title: 'Configuring i18n...',
      task: () => {
        /**
         * Write i18n.js in web/src
         */
        return writeFile(
          getPaths().web.src,
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'i18n.js.template')
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Adding locale file for \'site\' namespace',
      task () {
        return writeFile(getPaths().web.src + '/locales/en/site.json')
      }
    },
    {
      title: 'Adding import to index.js...',
      task: () => {
        /**
         * Add i18n import to the top of index.js
         */
        let indexJS = fs.readFileSync(INDEX_JS_PATH)
        indexJS = [`import './i18n'`, indexJS].join(`\n`)
        fs.writeFileSync(INDEX_JS_PATH, indexJS)
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n\n   ${chalk.hex('#bf4722')(
          'Quick link to the docs: '
        )}\n - https://react.i18next.com/guides/quick-start/\n - https://github.com/i18next/i18next-browser-languageDetector\n`
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
