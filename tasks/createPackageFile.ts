/*
 * adonis-ts-boilerplate
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import ora from 'ora'
import { basename } from 'path'
import { PackageFile } from '@adonisjs/sink'

import { TaskFn } from '../src/contracts'
import { packages } from '../src/boilerplate/packages'
import { logInstall, create, fatal } from '../src/logger'

/**
 * Creates the `package.json` file in the project root and installs
 * required dependencies
 */
const task: TaskFn = async (absPath, _app, state) => {
  const pkg = new PackageFile(absPath)

  pkg.set('name', basename(absPath))
  pkg.set('version', '0.0.0')
  pkg.set('private', true)

  pkg.setScript('build', 'adonis build')
  pkg.setScript('start', 'adonis serve --dev')

  const useYarn = process.env.npm_execpath && process.env.npm_execpath.includes('yarn')

  /**
   * Use yarn when executed as `yarn create`
   */
  if (useYarn) {
    pkg.yarn(true)
  }

  /**
   * Install adonisjs packages for the selected boilerplate
   */
  const boilerPlatePackages = packages[state.boilerplate]
  Object.keys(boilerPlatePackages).forEach((name) => {
    pkg.install(name, boilerPlatePackages[name].version, false)
  })

  /**
   * Required peer dependencies
   */
  pkg.install('reflect-metadata', 'latest', false)
  pkg.install('proxy-addr', 'latest', false)
  pkg.install('source-map-support', 'latest', false)

  /**
   * Dev dependencies
   */
  pkg.install('typescript')
  pkg.install('youch')
  pkg.install('youch-terminal')
  pkg.install('pino-pretty')
  pkg.install('tslint')
  pkg.install('tslint-eslint-rules')
  pkg.install('adonis-preset-ts')

  /**
   * Displaying a spinner, since install packages takes
   * a while
   */
  let spinner: ora.Ora | null = null
  pkg.beforeInstall((list, dev) => {
    if (spinner) {
      spinner.stopAndPersist()
    }
    spinner = ora({ interval: 120 })
    logInstall(list, spinner, dev)
  })

  /**
   * Commit mutations
   */
  const response = await pkg.commitAsync()
  spinner && spinner!.stopAndPersist()

  if (response && response.status === 1) {
    const errorMessage = useYarn ? 'yarn install failed' : 'npm install failed'
    fatal({ message: errorMessage, stack: response.stderr.toString() })
    throw new Error('Installation failed')
  } else {
    create('package.json')
  }
}

export default task
