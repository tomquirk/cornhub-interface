import { CheckCircleFilled } from '@ant-design/icons'
import { t, Trans } from '@lingui/macro'
import { Modal } from 'antd'
import RichButton from 'components/RichButton'
import { useDeployProjectPayerTx } from 'hooks/v2v3/transactor/DeployProjectPayerTx'
import { CSSProperties, useContext, useState } from 'react'

import { ThemeContext } from 'contexts/themeContext'

import { V2V3ProjectContext } from 'contexts/v2v3/V2V3ProjectContext'

import { IssueErc20TokenModal } from 'components/modals/IssueErc20TokenModal'
import { ProjectMetadataContext } from 'contexts/projectMetadataContext'
import Link from 'next/link'
import { settingsPagePath } from 'utils/routes'
import { LaunchProjectPayerModal } from './LaunchProjectPayerModal'

export const NEW_DEPLOY_QUERY_PARAM = 'np'

export default function NewDeployModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: VoidFunction
}) {
  const {
    theme: { colors },
  } = useContext(ThemeContext)
  const { handle } = useContext(V2V3ProjectContext)
  const { projectId } = useContext(ProjectMetadataContext)

  const [issueTokenModalVisible, setIssueTokenModalVisible] =
    useState<boolean>(false)
  const [launchProjectPayerModalVisible, setLaunchProjectPayerModalVisible] =
    useState<boolean>(false)
  const [hasIssuedToken, setHasIssuedToken] = useState<boolean>()
  const [hasLaunchedPayableAddress, setHasLaunchedPayableAddress] =
    useState<boolean>()

  const completedAllSteps = hasIssuedToken && hasLaunchedPayableAddress

  const seenColor = colors.text.tertiary

  const stepButtonStyle: CSSProperties = {
    marginBottom: 15,
  }

  return (
    <Modal
      open={open}
      onOk={onClose}
      onCancel={onClose}
      okButtonProps={{ hidden: !completedAllSteps }}
      cancelButtonProps={{ hidden: completedAllSteps }}
      okText={t`Done`}
      cancelText={t`Close, I'll do these later`}
    >
      <h2>
        <Trans>Project launch successful</Trans>
      </h2>
      <p>
        <Trans>
          Congratulations on launching your project! The next steps are optional
          and can be completed at any time.
        </Trans>
      </p>
      <div>
        <Link href={settingsPagePath('projecthandle', { handle, projectId })}>
          <RichButton
            prefix="1"
            heading={<Trans>Set a project handle (optional)</Trans>}
            description={
              <Trans>
                Set a unique name that will be visible in your project's URL,
                and that will allow your project to appear in search results.
              </Trans>
            }
            disabled={!!handle}
            icon={
              handle ? (
                <CheckCircleFilled style={{ color: seenColor }} />
              ) : undefined
            }
            primaryColor={handle ? seenColor : undefined}
            style={stepButtonStyle}
          />
        </Link>
        <RichButton
          prefix="2"
          heading={<Trans>Issue an ERC-20 token (optional)</Trans>}
          description={
            <Trans>
              Create your own ERC-20 token to represent stake in your project.
              Contributors will receive these tokens when they pay your project.
            </Trans>
          }
          onClick={() => setIssueTokenModalVisible(true)}
          disabled={hasIssuedToken}
          icon={
            hasIssuedToken ? (
              <CheckCircleFilled style={{ color: seenColor }} />
            ) : undefined
          }
          primaryColor={hasIssuedToken ? seenColor : undefined}
          style={stepButtonStyle}
        />
        <RichButton
          prefix="3"
          heading={<Trans>Create a Payment Address (optional)</Trans>}
          description={
            <Trans>
              Create an Ethereum address for your project. Enables direct
              payments without going through your project's Juicebox page.
            </Trans>
          }
          onClick={() => setLaunchProjectPayerModalVisible(true)}
          disabled={hasLaunchedPayableAddress}
          icon={
            hasLaunchedPayableAddress ? (
              <CheckCircleFilled style={{ color: seenColor }} />
            ) : undefined
          }
          primaryColor={hasLaunchedPayableAddress ? seenColor : undefined}
          style={stepButtonStyle}
        />
      </div>
      <IssueErc20TokenModal
        open={issueTokenModalVisible}
        onClose={() => setIssueTokenModalVisible(false)}
        onConfirmed={() => setHasIssuedToken(true)}
      />
      <LaunchProjectPayerModal
        open={launchProjectPayerModalVisible}
        onClose={() => setLaunchProjectPayerModalVisible(false)}
        useDeployProjectPayerTx={useDeployProjectPayerTx}
        onConfirmed={() => setHasLaunchedPayableAddress(true)}
      />
    </Modal>
  )
}
