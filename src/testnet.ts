import Dockerator from 'dockerator'
import es from 'event-stream'
import path from 'path'

import { Writable } from 'stream'
import DfuseUp from './dfuseup'
import imageTag from './imageTag'

export default class Testnet extends Dockerator {
  public operational: boolean
  public dfuseup: DfuseUp
  private markOperational?: () => void

  constructor({
    image = '',
    printOutput = false,
    extraParams = '',
    dfuseup = new DfuseUp(),
  } = {}) {
    const stdout = (es.mapSync((data: string) => {
      if (!this.operational) {
        if (data.includes('joining state LIVE')) {
          this.operational = true
          if (this.markOperational) {
            this.markOperational()
          }
        }
      }
      return data
    }) as any) as Writable
    if (printOutput) {
      stdout.pipe(process.stdout)
    }
    super({
      image: image || imageTag,
      command: [
        'bash',
        '-c',
        `dfuseeos start  \
        ${extraParams || ''} -v`,
      ],
      portMappings: ['13023:13023', '8888:8888', '8081:8081', '8080:8889'],
      stdio: { stdout },
    })
    this.operational = false
    this.dfuseup = dfuseup
  }

  public async setup() {
    await super.setup({
      context: path.resolve(__dirname, '..', 'image'),
      src: ['Dockerfile'],
    })
  }

  public async start({ containerId = '' } = {}) {
    await super.start({ containerId })
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Testnet start timeout')),
          30000
        )
        this.markOperational = () => {
          clearTimeout(timeout)
          resolve()
        }
      })
      if (!containerId) {
        await this.dfuseup.loadSystemContracts()
      }
    } catch (error) {
      await this.stop({ autoRemove: false })
      throw error
    }
  }

  public async stop({ autoRemove = true } = {}) {
    await super.stop({ autoRemove })
  }

  public async remove() {
    await super.remove()
  }
}
