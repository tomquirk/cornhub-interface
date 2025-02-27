import { t, Trans } from '@lingui/macro'
import { Modal } from 'antd'
import InputAccessoryButton from 'components/InputAccessoryButton'
import { emitErrorNotification } from 'utils/notifications'

import { useCallback, useContext, useEffect, useState } from 'react'
import { fromWad } from 'utils/format/formatNumber'
import { GraphQueryOpts, querySubgraphExhaustive } from 'utils/graph'
import { tokenSymbolText } from 'utils/tokenSymbolText'

import FormattedNumberInput from 'components/inputs/FormattedNumberInput'
import { CV_V1, CV_V1_1 } from 'constants/cv'
import { readProvider } from 'constants/readProvider'
import { ProjectMetadataContext } from 'contexts/projectMetadataContext'
import { Participant } from 'models/subgraph-entities/vX/participant'
import { downloadCsvFile } from 'utils/csv'

export function DownloadParticipantsModal({
  tokenSymbol,
  open,
  onCancel,
}: {
  tokenSymbol: string | undefined
  open: boolean | undefined
  onCancel: VoidFunction | undefined
}) {
  const { projectId, projectMetadata, cv } = useContext(ProjectMetadataContext)

  const [latestBlockNumber, setLatestBlockNumber] = useState<number>()
  const [blockNumber, setBlockNumber] = useState<number>()
  const [loading, setLoading] = useState<boolean>()

  useEffect(() => {
    readProvider.getBlockNumber().then(val => {
      setLatestBlockNumber(val)
      setBlockNumber(val)
    })
  }, [])

  const download = useCallback(async () => {
    if (blockNumber === undefined || !projectId || !cv) return

    // Projects that migrate between 1 & 1.1 may change their CV without the CV of their participants being updated. This should be fixed by better subgraph infrastructure, but this fix will make sure the UI works for now.
    const cvOpt: GraphQueryOpts<'participant', keyof Participant>['where'] =
      cv === CV_V1 || cv === CV_V1_1
        ? {
            key: 'cv',
            operator: 'in',
            value: [CV_V1, CV_V1_1],
          }
        : {
            key: 'cv',
            value: cv,
          }

    const rows = [
      [
        'Wallet address',
        `Total ${tokenSymbolText({ tokenSymbol })} balance`,
        'Unclaimed balance',
        'Claimed balance',
        'Total ETH paid',
        'Last paid timestamp',
      ], // CSV header row
    ]

    setLoading(true)
    try {
      const participants = await querySubgraphExhaustive({
        entity: 'participant',
        keys: [
          'wallet',
          'totalPaid',
          'balance',
          'stakedBalance',
          'unstakedBalance',
          'lastPaidTimestamp',
        ],
        orderBy: 'balance',
        orderDirection: 'desc',
        block: {
          number: blockNumber,
        },
        where: [
          {
            key: 'projectId',
            value: projectId,
          },
          cvOpt,
        ],
      })

      if (!participants) {
        emitErrorNotification(t`Error loading holders`)
        throw new Error('No data.')
      }

      participants.forEach(p => {
        let date = new Date((p.lastPaidTimestamp ?? 0) * 1000).toUTCString()

        if (date.includes(',')) date = date.split(',')[1]

        rows.push([
          p.wallet ?? '--',
          fromWad(p.balance),
          fromWad(p.stakedBalance),
          fromWad(p.unstakedBalance),
          fromWad(p.totalPaid),
          date,
        ])
      })

      downloadCsvFile(
        `@${projectMetadata?.name}_holders-block${blockNumber}.csv`,
        rows,
      )

      setLoading(false)
    } catch (e) {
      console.error('Error downloading participants', e)
      setLoading(false)
    }
  }, [blockNumber, projectId, tokenSymbol, projectMetadata, cv])

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={download}
      okText={t`Download CSV`}
      okButtonProps={{ type: 'primary' }}
      cancelText={t`Close`}
      confirmLoading={loading}
      centered
    >
      <div>
        <h4>
          <Trans>
            Download CSV of {tokenSymbolText({ tokenSymbol })} holders
          </Trans>
        </h4>

        <label style={{ display: 'block', marginTop: 20, marginBottom: 5 }}>
          <Trans>Block number</Trans>
        </label>
        <FormattedNumberInput
          value={blockNumber?.toString()}
          onChange={val => setBlockNumber(val ? parseInt(val) : undefined)}
          accessory={
            <InputAccessoryButton
              content={t`Latest`}
              onClick={() => setBlockNumber(latestBlockNumber)}
              disabled={blockNumber === latestBlockNumber}
            />
          }
        />
      </div>
    </Modal>
  )
}
