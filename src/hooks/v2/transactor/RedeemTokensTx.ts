import { BigNumber } from '@ethersproject/bignumber'
import * as constants from '@ethersproject/constants'
import { useWallet } from 'hooks/Wallet'
import { useContext } from 'react'

import { V2ProjectContext } from 'contexts/v2/projectContext'
import { V2ContractsContext } from 'contexts/v2/V2ContractsContext'

import { t } from '@lingui/macro'
import { ProjectMetadataContext } from 'contexts/projectMetadataContext'
import { TransactionContext } from 'contexts/transactionContext'
import {
  handleTransactionException,
  TransactorInstance,
} from 'hooks/Transactor'
import invariant from 'tiny-invariant'
import { tokenSymbolText } from 'utils/tokenSymbolText'

const DEFAULT_METADATA = 0

export function useRedeemTokensTx(): TransactorInstance<{
  redeemAmount: BigNumber
  minReturnedTokens: BigNumber
  memo: string
}> {
  const { transactor } = useContext(TransactionContext)
  const { contracts } = useContext(V2ContractsContext)
  const { tokenSymbol } = useContext(V2ProjectContext)
  const { projectId, cv } = useContext(ProjectMetadataContext)

  const { userAddress } = useWallet()

  return ({ redeemAmount, minReturnedTokens, memo }, txOpts) => {
    try {
      invariant(
        transactor &&
          userAddress &&
          projectId &&
          contracts?.JBETHPaymentTerminal,
      )
      return transactor(
        contracts?.JBETHPaymentTerminal,
        'redeemTokensOf',
        [
          userAddress, // _holder
          projectId, // _projectId
          redeemAmount, // _tokenCount, tokens to redeem
          constants.AddressZero, // _token, unused parameter
          minReturnedTokens, // _minReturnedTokens, min amount of ETH to receive
          userAddress, // _beneficiary
          memo, // _memo
          DEFAULT_METADATA, // _metadata, TODO: metadata
        ],
        {
          ...txOpts,
          title: t`Redeem ${tokenSymbolText({
            tokenSymbol,
            plural: true,
          })}`,
        },
      )
    } catch {
      const missingParam = !transactor
        ? 'transactor'
        : !userAddress
        ? 'userAddress'
        : !projectId
        ? 'projectId'
        : !contracts?.JBETHPaymentTerminal
        ? 'contracts.JBETHPaymentTerminal'
        : undefined

      return handleTransactionException({
        txOpts,
        missingParam,
        functionName: 'redeemTokensOf',
        cv,
      })
    }
  }
}
