import { BigNumber } from '@ethersproject/bignumber'
import * as constants from '@ethersproject/constants'
import { Trans } from '@lingui/macro'
import { Skeleton, Tooltip } from 'antd'
import { CV_V1, CV_V1_1, CV_V2, CV_V3 } from 'constants/cv'
import { V1ArchivedProjectIds } from 'constants/v1/archivedProjects'
import { V2ArchivedProjectIds } from 'constants/v2v3/archivedProjects'
import { ThemeContext } from 'contexts/themeContext'
import { useProjectMetadata } from 'hooks/ProjectMetadata'
import useSubgraphQuery from 'hooks/SubgraphQuery'
import { Project } from 'models/subgraph-entities/vX/project'
import Link from 'next/link'
import { CSSProperties, useContext } from 'react'
import { formatDate } from 'utils/format/formatDate'
import { v2v3ProjectRoute } from 'utils/routes'
import { getTerminalVersion } from 'utils/v1/terminals'
import ETHAmount from './currency/ETHAmount'
import Loading from './Loading'
import ProjectLogo from './ProjectLogo'
import { ProjectVersionBadge } from './ProjectVersionBadge'
import V2V3ProjectHandle from './v2v3/shared/V2V3ProjectHandle'

export type ProjectCardProject = Pick<
  Project,
  | 'id'
  | 'handle'
  | 'metadataUri'
  | 'totalPaid'
  | 'createdAt'
  | 'terminal'
  | 'projectId'
  | 'cv'
>

const cardStyle: CSSProperties = {
  display: 'flex',
  position: 'relative',
  alignItems: 'center',
  whiteSpace: 'pre',
  overflow: 'hidden',
  padding: '25px 20px',
}

export default function ProjectCard({
  project,
}: {
  project?: ProjectCardProject | BigNumber
}) {
  const {
    theme: { colors, radii },
  } = useContext(ThemeContext)

  // Get ProjectCardProject object if this component was passed a projectId (bigNumber)
  const projectQuery: ProjectCardProject[] | undefined = useSubgraphQuery(
    BigNumber.isBigNumber(project)
      ? {
          entity: 'project',
          keys: [
            'id',
            'handle',
            'metadataUri',
            'totalPaid',
            'createdAt',
            'terminal',
            'projectId',
            'cv',
          ],
          where: {
            key: 'projectId',
            value: project.toString(),
          },
        }
      : null,
  ).data

  // Must use any to convert (ProjectCardProject | bigNumber) to ProjectCardProject
  const projectObj: any = project // eslint-disable-line @typescript-eslint/no-explicit-any
  let _project: ProjectCardProject

  // If we were given projectId (BN) and therefore projectQuery returned something,
  // we assign _project to that. Otherwise assign it to the initial
  // project passed to this component which must be ProjectCardProject
  if (projectQuery?.length) {
    _project = projectQuery[0]
  } else {
    _project = projectObj
  }

  const { data: metadata } = useProjectMetadata(_project?.metadataUri)
  // If the total paid is greater than 0, but less than 10 ETH, show two decimal places.
  const precision =
    _project?.totalPaid?.gt(0) && _project?.totalPaid.lt(constants.WeiPerEther)
      ? 2
      : 0

  const terminalVersion = getTerminalVersion(_project?.terminal)

  const isArchived =
    ((_project.cv === CV_V1 || _project.cv === CV_V1_1) &&
      V1ArchivedProjectIds.includes(_project.projectId)) ||
    (_project.cv === CV_V2 &&
      V2ArchivedProjectIds.includes(_project.projectId)) ||
    metadata?.archived

  return (
    <Link
      key={`${_project.id}_${_project.cv}`}
      href={
        _project.cv === CV_V2 || _project.cv === CV_V3
          ? v2v3ProjectRoute(_project)
          : `/p/${_project?.handle}`
      }
    >
      <a>
        <div
          style={{
            borderRadius: radii.lg,
            cursor: 'pointer',
            overflow: 'hidden',

            ...cardStyle,
          }}
          className="clickable-border"
        >
          <div style={{ marginRight: 20 }}>
            <ProjectLogo
              uri={metadata?.logoUri}
              name={metadata?.name}
              size={110}
              projectId={_project?.projectId}
            />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: 400,
            }}
          >
            {metadata ? (
              <h2
                style={{
                  color: colors.text.primary,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: 21,
                }}
              >
                {metadata.name}
              </h2>
            ) : (
              <Skeleton paragraph={false} title={{ width: 120 }} active />
            )}

            <div>
              <V2V3ProjectHandle
                projectId={_project?.projectId}
                handle={_project.handle}
              />{' '}
              <ProjectVersionBadge
                size="small"
                versionText={`V${terminalVersion ?? _project.cv}`}
              />
            </div>

            <div>
              <span style={{ color: colors.text.primary, fontWeight: 500 }}>
                <ETHAmount amount={_project?.totalPaid} precision={precision} />{' '}
              </span>

              <span style={{ color: colors.text.secondary }}>
                since{' '}
                {!!_project?.createdAt &&
                  formatDate(_project?.createdAt * 1000, 'yyyy-MM-DD')}
              </span>
            </div>

            {metadata?.description && (
              <Tooltip title={metadata.description} placement="bottom">
                <div
                  style={{
                    maxHeight: 20,
                    color: colors.text.tertiary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {metadata.description}
                </div>
              </Tooltip>
            )}
          </div>
          {isArchived && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '2px 4px',
                background: colors.background.l1,
                fontSize: '0.7rem',
                color: colors.text.tertiary,
                fontWeight: 500,
              }}
            >
              <Trans>ARCHIVED</Trans>
            </div>
          )}
          {!metadata && <Loading />}
        </div>
      </a>
    </Link>
  )
}
