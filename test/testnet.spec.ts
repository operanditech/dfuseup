import fs from 'fs'
import { describe, it } from 'mocha'
import Testnet from '../src/testnet'

describe('Testnet', () => {
  it('run testnet', async () => {
    const testnet = new Testnet({ printOutput: true })
    await testnet.setup()
    await testnet.start()
    await testnet.remove()
  })
})
