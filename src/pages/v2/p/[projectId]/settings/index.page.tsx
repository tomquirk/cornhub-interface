import { AppWrapper } from 'components/common'
import { V2V3ProjectSettings } from 'components/v2v3/V2V3Project/V2V3ProjectSettings'
import { CV2V3 } from 'models/cv'
import { ProjectMetadataV5 } from 'models/project-metadata'
import { GetServerSideProps } from 'next'
import { TransactionProvider } from 'providers/TransactionProvider'
import { V2V3ProjectPageProvider } from 'providers/v2v3/V2V3ProjectPageProvider'
import { getProjectProps, ProjectPageProps } from 'utils/server/pages/props'

export const getServerSideProps: GetServerSideProps<
  ProjectPageProps
> = async context => {
  if (!context.params) throw new Error('params not supplied')

  const projectId = parseInt(context.params.projectId as string)
  return getProjectProps(projectId)
}

export default function V2V3ProjectSettingsPage({
  projectId,
  metadata,
  cv,
}: {
  projectId: number
  metadata: ProjectMetadataV5
  cv: CV2V3
}) {
  return (
    <AppWrapper>
      <V2V3ProjectPageProvider
        projectId={projectId}
        metadata={metadata}
        cv={cv}
      >
        <TransactionProvider>
          <V2V3ProjectSettings />
        </TransactionProvider>
      </V2V3ProjectPageProvider>
    </AppWrapper>
  )
}
