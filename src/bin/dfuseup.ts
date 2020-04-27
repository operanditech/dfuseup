#!/usr/bin/env node

import Docker from 'dockerode'
import execa from 'execa'
import fs from 'fs'
import path from 'path'
import Compiler from '../compiler'
import imageTag from '../imageTag'
import Testnet from '../testnet'

const { version } = JSON.parse(
  (fs.readFileSync(
    path.resolve(__dirname, '../../package.json')
  ) as any) as string
)

import prog from 'caporal'
prog
  .version(version)
  .command(
    'install',
    'Build the Docker image. Will be tagged to the current version of this program.'
  )
  .action(
    wrapAsync(async (args, options, logger) => {
      const compiler = new Compiler({
        printOutput: true,
      })
      await compiler.setup()
    })
  )
  .command(
    'uninstall',
    'Remove the Docker image tagged to the current version of this program.'
  )
  .action(
    wrapAsync(async (args, options, logger) => {
      const docker = new Docker()
      await docker.getImage(imageTag).remove()
    })
  )
  .command('compile', 'Compile a smart contract')
  .argument('<input>', 'File with the source code to compile.')
  .argument(
    '<output>',
    'Output file where the compiled WASM should be written.'
  )
  .option('-c, --contract <name>', 'Contract name, for ABI generation.')
  .option(
    '-e, --extra-params <params>',
    'String with additional command parameters to forward to eosio-cpp.'
  )
  .action(
    wrapAsync(async (args, opts, logger) => {
      const compiler = new Compiler({
        printOutput: true,
      })
      await compiler.setup()
      await compiler.compile(args.input, args.output, opts.contract, {
        extraParams: opts.extraParams,
      })
    })
  )
  .command('testnet', 'Run a local eosio testnet for development.')
  .option(
    '-e, --extra-params <params>',
    'String with additional command parameters to forward to nodeos.'
  )
  .option(
    '-c, --callback <command>',
    'Command to run as soon as the testnet is operational (e.g. for loading seed data).'
  )
  .option(
    '-s, --stop',
    'Stop the testnet as soon as the callback command is done (e.g. for running tests).',
    prog.BOOLEAN,
    false
  )
  .option(
    '-q, --quiet',
    'Do not print nodeos output to stdout.',
    prog.BOOLEAN,
    false
  )
  .action(
    wrapAsync(async (args, opts, logger) => {
      const testnet = new Testnet({
        printOutput: !opts.quiet,
        extraParams: opts.extraParams,
      })
      await testnet.setup()
      testnet.loadExitHandler()
      await testnet.start()
      if (opts.callback) {
        try {
          await execa.command(opts.callback, { stdio: 'inherit', shell: true })
        } catch (error) {
          await testnet.stop()
          throw error
        }
        if (opts.stop) {
          await testnet.stop()
        }
      }
    })
  )

prog.parse(process.argv)

function wrapAsync(func: (args: any, opts: any, logger: any) => any) {
  return (args: any, opts: any, logger: any) => {
    func(args, opts, logger).catch((error: Error) => {
      console.error(error)
      process.exit(1)
    })
  }
}
