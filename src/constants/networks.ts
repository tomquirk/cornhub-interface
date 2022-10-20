import { NetworkName } from 'models/network-name'

type NetworkInfo = {
  name: NetworkName
  label: string
  token?: string
  color: string
  chainId: number
  blockExplorer: string
  rpcUrl: string
  faucet?: string
  price?: number
  gasPrice?: number
}

export const NETWORKS: Record<number, NetworkInfo> = {
  97: {
    name: NetworkName.chapel,
    label: 'BSC Chapel Testnet',
    color: '#ff8b9e',
    chainId: 97,
    rpcUrl: `https://rpc.ankr.com/bsc_testnet_chapel`,
    blockExplorer: 'https://bscscan.com/',
  },
}

export const NETWORKS_BY_NAME = Object.values(NETWORKS).reduce(
  (acc, curr) => ({
    ...acc,
    [curr.name]: curr,
  }),
  {} as Record<NetworkName, NetworkInfo>,
)

export const readNetwork =
  NETWORKS_BY_NAME[process.env.NEXT_PUBLIC_INFURA_NETWORK as NetworkName]
