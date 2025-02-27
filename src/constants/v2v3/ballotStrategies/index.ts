import * as constants from '@ethersproject/constants'
import { t } from '@lingui/macro'

import { NetworkName } from 'models/network-name'

import { readNetwork } from 'constants/networks'
import { SECONDS_IN_DAY } from 'constants/numbers'
import { ReconfigurationStrategy } from 'models/reconfigurationStrategy'

type BallotOption = Record<
  'THREE_DAY' | 'SEVEN_DAY',
  Partial<Record<NetworkName, string>>
>

// based on @jbx-protocol/v2-contracts@4.0.0
export const DEPRECATED_BALLOT_ADDRESSES: BallotOption = {
  THREE_DAY: {
    chapel: '0x9733F02d3A1068A11B07516fa2f3C3BaEf90e7eF',
  },
  SEVEN_DAY: {
    // No 7 day delay contract deployed with original V2
    chapel: constants.AddressZero,
  },
}

export const BALLOT_ADDRESSES: BallotOption = {
  THREE_DAY: {
    chapel: '0x4b9f876c7Fc5f6DEF8991fDe639b2C812a85Fb12',
  },
  SEVEN_DAY: {
    chapel: '0x642EFF5259624FD09D021AB764a4b47d1DbD5770',
  },
}

interface BallotStrategy {
  id: ReconfigurationStrategy
  name: string
  description: string
  address: string
  durationSeconds: number
}

const durationBallotStrategyDescription = (days: number) =>
  t`A reconfiguration to an upcoming funding cycle must be submitted at least ${days} days before it starts.`

export function ballotStrategies(network?: NetworkName): BallotStrategy[] {
  return [
    {
      id: 'none',
      name: t`No strategy`,
      description: t`Any reconfiguration to an upcoming funding cycle will take effect once the current cycle ends. A project with no strategy may be vulnerable to being rug-pulled by its owner.`,
      address: constants.AddressZero,
      durationSeconds: 0,
    },
    {
      id: 'threeDay',
      name: t`3-day delay`,
      description: durationBallotStrategyDescription(3),
      address: BALLOT_ADDRESSES.THREE_DAY[network ?? readNetwork.name]!,
      durationSeconds: SECONDS_IN_DAY * 3,
    },
    {
      id: 'sevenDay',
      name: t`7-day delay`,
      description: durationBallotStrategyDescription(7),
      address: BALLOT_ADDRESSES.SEVEN_DAY[network ?? readNetwork.name]!,
      durationSeconds: SECONDS_IN_DAY * 7,
    },
  ]
}

export const DEFAULT_BALLOT_STRATEGY = ballotStrategies()[0]
