import { NetworkName } from 'models/network-name'
import { V2V3ContractName } from 'models/v2v3/contracts'

export const loadJuiceboxV3Contract = async (
  contractName: V2V3ContractName,
  network: NetworkName,
) => {
  try {
    return await import(`cornhub/deployments/${network}/${contractName}.json`)
  } catch (_) {
    return undefined
  }
}
