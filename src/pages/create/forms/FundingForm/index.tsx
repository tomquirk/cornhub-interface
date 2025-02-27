import { Trans } from '@lingui/macro'
import { Button, Form } from 'antd'
import ExternalLink from 'components/ExternalLink'
import { ItemNoInput } from 'components/formItems/ItemNoInput'
import FormItemWarningText from 'components/FormItemWarningText'
import SwitchHeading from 'components/SwitchHeading'
import { shadowCard } from 'constants/styles/shadowCard'
import { DurationUnitsOption } from 'constants/time'
import { ETH_TOKEN_ADDRESS } from 'constants/v2v3/juiceboxTokens'
import { ThemeContext } from 'contexts/themeContext'
import { V2V3ContractsContext } from 'contexts/v2v3/V2V3ContractsContext'
import { V2V3ProjectContext } from 'contexts/v2v3/V2V3ProjectContext'
import { useAppDispatch } from 'hooks/AppDispatch'
import { useAppSelector } from 'hooks/AppSelector'
import isEqual from 'lodash/isEqual'
import { Split } from 'models/splits'
import { V2V3CurrencyOption } from 'models/v2v3/currencyOption'
import DistributionSplitsSection from 'pages/create/forms/FundingForm/DistributionSplitsSection'
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {
  defaultFundingCycleMetadata,
  editingV2ProjectActions,
} from 'redux/slices/editingV2Project'
import { fromWad } from 'utils/format/formatNumber'
import {
  deriveDurationUnit,
  otherUnitToSeconds,
  secondsToOtherUnit,
} from 'utils/format/formatTime'
import { helpPagePath } from 'utils/routes'
import { sanitizeSplit } from 'utils/splits'
import {
  getV2V3CurrencyOption,
  V2V3CurrencyName,
  V2V3_CURRENCY_ETH,
} from 'utils/v2v3/currency'
import { getTotalSplitsPercentage } from 'utils/v2v3/distributions'
import { getDefaultFundAccessConstraint } from 'utils/v2v3/fundingCycle'
import { MAX_DISTRIBUTION_LIMIT } from 'utils/v2v3/math'
import { SerializedV2V3FundAccessConstraint } from 'utils/v2v3/serializers'
import DurationInputAndSelect from './DurationInputAndSelect'
import { FundingCycleExplainerCollapse } from './FundingCycleExplainerCollapse'

type FundingFormFields = {
  duration?: string
  durationUnit?: DurationUnitsOption
  durationEnabled?: boolean
  totalSplitsPercentage?: number
}

const DEFAULT_FUNDING_CYCLE_DURATION_DAYS = 14

export default function FundingForm({
  onFormUpdated,
  onFinish,
  isCreate,
}: {
  onFormUpdated?: (updated: boolean) => void
  onFinish: VoidFunction
  isCreate?: boolean // Instance of FundingForm in create flow
}) {
  const {
    theme,
    theme: { colors },
  } = useContext(ThemeContext)
  const { contracts } = useContext(V2V3ContractsContext)
  const { payoutSplits } = useContext(V2V3ProjectContext)

  const dispatch = useAppDispatch()

  const [fundingForm] = Form.useForm<FundingFormFields>()

  // Load redux state (will be empty in create flow)
  const { fundAccessConstraints, fundingCycleData, payoutGroupedSplits } =
    useAppSelector(state => state.editingV2Project)
  const fundAccessConstraint =
    getDefaultFundAccessConstraint<SerializedV2V3FundAccessConstraint>(
      fundAccessConstraints,
    )

  const [splits, setSplits] = useState<Split[]>([])
  // Must differentiate between splits loaded from redux and
  // ones just added to be able to still edit splits you've
  // added with a lockedUntil
  const [editingSplits, setEditingSplits] = useState<Split[]>([])

  const [distributionLimit, setDistributionLimit] = useState<
    string | undefined
  >('0')

  const [distributionLimitCurrency, setDistributionLimitCurrency] =
    useState<V2V3CurrencyOption>(V2V3_CURRENCY_ETH)
  const [durationEnabled, setDurationEnabled] = useState<boolean>(false)

  // Form initial values set by default
  const initialValues = useMemo(
    () => ({
      durationSeconds: fundingCycleData ? fundingCycleData.duration : '0',
      distributionLimit: fundAccessConstraint?.distributionLimit ?? '0',
      distributionLimitCurrency: parseInt(
        fundAccessConstraint?.distributionLimitCurrency ??
          V2V3_CURRENCY_ETH.toString(),
      ) as V2V3CurrencyOption,
      payoutSplits: payoutGroupedSplits.splits,
    }),
    [fundingCycleData, fundAccessConstraint, payoutGroupedSplits],
  )

  const {
    editableSplits,
    lockedSplits,
  }: {
    editableSplits: Split[]
    lockedSplits: Split[]
  } = useMemo(() => {
    const now = new Date().valueOf() / 1000

    // Checks if the given split exists in the projectContext splits.
    // If it doesn't, then it means it was just added or edited is which case
    // we want to still be able to edit it
    const confirmedSplitsIncludesSplit = (split: Split) => {
      let includes = false
      payoutSplits?.forEach(confirmedSplit => {
        if (isEqual(confirmedSplit, split)) {
          includes = true
        }
      })
      return includes
    }

    const isLockedSplit = (split: Split) => {
      return (
        split.lockedUntil &&
        split.lockedUntil > now &&
        !isCreate &&
        confirmedSplitsIncludesSplit(split)
      )
    }

    const lockedSplits = splits?.filter(split => isLockedSplit(split)) ?? []
    const editableSplits = splits?.filter(split => !isLockedSplit(split)) ?? []
    return {
      lockedSplits,
      editableSplits,
    }
  }, [splits, isCreate, payoutSplits])

  useLayoutEffect(() => setEditingSplits(editableSplits), [editableSplits])

  // Loads redux state into form
  const resetProjectForm = useCallback(() => {
    const _distributionLimit = fundAccessConstraint?.distributionLimit ?? '0'
    const _distributionLimitCurrency = parseInt(
      fundAccessConstraint?.distributionLimitCurrency ??
        V2V3_CURRENCY_ETH.toString(),
    ) as V2V3CurrencyOption

    const durationSeconds = fundingCycleData
      ? parseInt(fundingCycleData.duration)
      : 0
    setDurationEnabled(durationSeconds > 0)

    const durationUnit = deriveDurationUnit(durationSeconds)

    fundingForm.setFieldsValue({
      durationUnit: durationUnit,
      duration: secondsToOtherUnit({
        duration: durationSeconds,
        unit: durationUnit,
      }).toString(),
    })

    const payoutSplits = payoutGroupedSplits?.splits

    setDistributionLimit(_distributionLimit)
    setDistributionLimitCurrency(_distributionLimitCurrency)
    setSplits(payoutSplits ?? [])
  }, [fundingForm, fundingCycleData, fundAccessConstraint, payoutGroupedSplits])

  const onFundingFormSave = useCallback(
    async (fields: FundingFormFields) => {
      if (!contracts) throw new Error('Failed to save funding configuration.')

      const fundAccessConstraint:
        | SerializedV2V3FundAccessConstraint
        | undefined = {
        terminal: contracts.JBETHPaymentTerminal.address,
        token: ETH_TOKEN_ADDRESS,
        distributionLimit: distributionLimit ?? fromWad(MAX_DISTRIBUTION_LIMIT),
        distributionLimitCurrency:
          distributionLimitCurrency?.toString() ?? V2V3_CURRENCY_ETH,
        overflowAllowance: '0', // nothing for the time being.
        overflowAllowanceCurrency: '0',
      }

      const duration = fields?.duration ? parseInt(fields?.duration) : 0
      const durationUnit = fields?.durationUnit ?? 'days'

      const durationInSeconds = otherUnitToSeconds({
        duration: duration,
        unit: durationUnit,
      }).toString()

      dispatch(
        editingV2ProjectActions.setFundAccessConstraints(
          fundAccessConstraint ? [fundAccessConstraint] : [],
        ),
      )
      dispatch(
        editingV2ProjectActions.setPayoutSplits(
          lockedSplits.concat(editingSplits).map(sanitizeSplit),
        ),
      )
      dispatch(editingV2ProjectActions.setDuration(durationInSeconds ?? '0'))

      // reset redemption rate if distributionLimit is 0
      if (!distributionLimit || distributionLimit === '0') {
        dispatch(
          editingV2ProjectActions.setRedemptionRate(
            defaultFundingCycleMetadata.redemptionRate,
          ),
        )
        dispatch(
          editingV2ProjectActions.setBallotRedemptionRate(
            defaultFundingCycleMetadata.ballotRedemptionRate,
          ),
        )
      }

      onFinish?.()
    },
    [
      editingSplits,
      lockedSplits,
      contracts,
      dispatch,
      distributionLimit,
      distributionLimitCurrency,
      onFinish,
    ],
  )

  // initially fill form with any existing redux state
  useLayoutEffect(() => {
    resetProjectForm()
  }, [resetProjectForm])

  // Ensures total split percentages do not exceed 100
  const validateTotalSplitsPercentage = () => {
    if (fundingForm.getFieldValue('totalSplitsPercentage') > 100)
      return Promise.reject()
    return Promise.resolve()
  }

  const onFormChange = useCallback(() => {
    const duration = fundingForm.getFieldValue('duration') as number
    const durationUnit = fundingForm.getFieldValue(
      'durationUnit',
    ) as DurationUnitsOption

    const durationInSeconds = durationEnabled
      ? otherUnitToSeconds({
          duration: duration,
          unit: durationUnit,
        }).toString()
      : '0'
    const splits = lockedSplits.concat(editingSplits).map(sanitizeSplit)
    const hasFormUpdated =
      initialValues.durationSeconds !== durationInSeconds ||
      initialValues.distributionLimit !== distributionLimit ||
      initialValues.distributionLimitCurrency !== distributionLimitCurrency ||
      !isEqual(initialValues.payoutSplits, splits)
    onFormUpdated?.(hasFormUpdated)
  }, [
    durationEnabled,
    editingSplits,
    fundingForm,
    initialValues,
    lockedSplits,
    onFormUpdated,
    distributionLimitCurrency,
    distributionLimit,
  ])

  useEffect(() => {
    onFormChange()
  }, [onFormChange])

  return (
    <Form
      form={fundingForm}
      onValuesChange={onFormChange}
      layout="vertical"
      onFinish={onFundingFormSave}
    >
      <div
        style={{
          padding: '2rem',
          marginBottom: 10,
          ...shadowCard(theme),
          color: colors.text.primary,
        }}
      >
        <SwitchHeading
          checked={durationEnabled}
          onChange={checked => {
            setDurationEnabled(checked)

            // if no funding cycle, select a 0-ballot
            if (!checked) {
              fundingForm.setFieldsValue({ duration: '0' })
            } else {
              fundingForm.setFieldsValue({
                duration: DEFAULT_FUNDING_CYCLE_DURATION_DAYS.toString(),
              })
            }
          }}
          style={{ marginBottom: '1rem' }}
        >
          <Trans>Automate funding cycles</Trans>
        </SwitchHeading>

        {!durationEnabled ? (
          <FormItemWarningText>
            <Trans>
              With no funding cycles, the project's owner can start a new
              funding cycle (Funding Cycle #2) on-demand.{' '}
              <ExternalLink href={helpPagePath('dev/learn/risks')}>
                Learn more.
              </ExternalLink>
            </Trans>
          </FormItemWarningText>
        ) : null}

        {durationEnabled && (
          <DurationInputAndSelect
            defaultDurationUnit={fundingForm.getFieldValue('durationUnit')}
          />
        )}

        <div>
          <FundingCycleExplainerCollapse />
        </div>
      </div>

      <div
        style={{
          padding: '2rem',
          marginBottom: 10,
          ...shadowCard(theme),
          color: colors.text.primary,
        }}
      >
        <h3 style={{ color: colors.text.primary }}>
          <Trans>Payouts</Trans>
        </h3>

        <DistributionSplitsSection
          distributionLimit={distributionLimit}
          setDistributionLimit={setDistributionLimit}
          currencyName={V2V3CurrencyName(distributionLimitCurrency) ?? 'ETH'}
          onCurrencyChange={currencyName =>
            setDistributionLimitCurrency(getV2V3CurrencyOption(currencyName))
          }
          editableSplits={editingSplits}
          lockedSplits={lockedSplits}
          onSplitsChanged={newSplits => {
            setEditingSplits(newSplits)
            fundingForm.setFieldsValue({
              totalSplitsPercentage: getTotalSplitsPercentage(newSplits),
            })
          }}
        />
        <ItemNoInput
          name={'totalSplitsPercentage'}
          rules={[
            {
              validator: validateTotalSplitsPercentage,
            },
          ]}
        />
      </div>

      <Form.Item style={{ marginTop: '2rem' }}>
        <Button htmlType="submit" type="primary">
          <Trans>Save funding configuration</Trans>
        </Button>
      </Form.Item>
    </Form>
  )
}
