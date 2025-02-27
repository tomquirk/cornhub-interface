import { Trans } from '@lingui/macro'
import ETHAmount from 'components/currency/ETHAmount'
import EtherscanLink from 'components/EtherscanLink'
import FormattedAddress from 'components/FormattedAddress'
import RichNote from 'components/RichNote'
import { ThemeContext } from 'contexts/themeContext'
import { PayEvent } from 'models/subgraph-entities/vX/pay-event'
import { useContext } from 'react'
import { formatHistoricalDate } from 'utils/format/formatDate'

import V2V3ProjectHandle from '../v2v3/shared/V2V3ProjectHandle'

import {
  contentLineHeight,
  primaryContentFontSize,
  smallHeaderStyle,
} from './styles'

export default function PayEventElem({
  event,
}: {
  event:
    | Pick<
        PayEvent,
        | 'amount'
        | 'timestamp'
        | 'beneficiary'
        | 'note'
        | 'id'
        | 'txHash'
        | 'feeFromV2Project'
      >
    | undefined
}) {
  const {
    theme: { colors },
  } = useContext(ThemeContext)

  if (!event) return null

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignContent: 'space-between',
        }}
      >
        <div>
          <div style={smallHeaderStyle(colors)}>
            <Trans>Paid</Trans>
          </div>
          <div
            style={{
              lineHeight: contentLineHeight,
              fontSize: primaryContentFontSize,
            }}
          >
            <ETHAmount amount={event.amount} />
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          {event.timestamp && (
            <div style={smallHeaderStyle(colors)}>
              {formatHistoricalDate(event.timestamp * 1000)}{' '}
              <EtherscanLink value={event.txHash} type="tx" />
            </div>
          )}
          <div
            style={{
              ...smallHeaderStyle(colors),
              lineHeight: contentLineHeight,
            }}
          >
            <FormattedAddress
              address={event.beneficiary}
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      </div>

      {event.feeFromV2Project ? (
        <div style={{ marginTop: 5 }}>
          <Trans>
            Fee from{' '}
            <span>
              <V2V3ProjectHandle projectId={event.feeFromV2Project} />
            </span>
          </Trans>
        </div>
      ) : (
        <div style={{ marginTop: 5 }}>
          <RichNote
            note={event.note ?? ''}
            style={{ color: colors.text.secondary }}
          />
        </div>
      )}
    </div>
  )
}
