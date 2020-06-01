import Dockerator from 'dockerator'
import path from 'path'
import imageTag from './imageTag'

export default class Compiler extends Dockerator {
  public static async compile({
    printOutput,
    input,
    output,
    contract,
    baseDir,
    extraParams,
  }: {
    printOutput?: boolean
    input: string
    output: string
    contract?: string
    baseDir?: string
    extraParams?: string
  }) {
    const compiler = new Compiler({ printOutput })
    await compiler.setup()
    await compiler.compile(input, output, contract, baseDir, { extraParams })
  }

  constructor({ image = '', printOutput = false } = {}) {
    super({
      image: image || imageTag,
      stdio: printOutput ? 'inherit' : 'ignore',
      dockerConfig: {
        NetworkDisabled: true,
        HostConfig: {},
      },
    })
  }

  public async setup() {
    await super.setup({
      context: path.resolve(__dirname, '..', 'image'),
      src: ['Dockerfile'],
    })
  }

  public async compile(
    input: string,
    output: string,
    baseDir?: string,
    contract?: string,
    { extraParams = '' } = {}
  ) {
    const parsedInput = path.parse(input)
    const parsedOutput = path.parse(output)
    this.dockerConfig.HostConfig.Binds = [
      `${path.join(process.cwd(), parsedInput.dir)}:/mnt/dev/input`,
      `${path.join(process.cwd(), parsedOutput.dir)}:/mnt/dev/output`,
    ]

    if (baseDir) {
      this.dockerConfig.HostConfig.Binds.push(
        `${path.join(process.cwd(), baseDir)}:/mnt/dev/`
      )
    }

    const inputFile = path.posix.join('/mnt/dev/input', parsedInput.base)
    const outputFileWasm = path.posix.join('/mnt/dev/output', parsedOutput.base)
    const outputFileAbi =
      path.posix.join('/mnt/dev/output', parsedOutput.name) + '.abi'
    const tmpFileWasm = path.posix.join('/tmp', parsedOutput.base)
    const tmpFileAbi = path.posix.join('/tmp', parsedOutput.name) + '.abi'
    this.command = [
      'bash',
      '-c',
      `eosio-cpp -abigen -o ${tmpFileWasm} ${inputFile}  ${
        contract ? ` -contract ${contract}` : ''
      } ${extraParams} &&
      mv ${tmpFileWasm} ${outputFileWasm} && 
      mv ${tmpFileAbi} ${outputFileAbi}`,
    ]

    await super.start({ blockUntilExit: true })
    await super.remove()
  }
}
