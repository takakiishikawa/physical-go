import { PageHeader } from '@takaki/go-design-system'
import type { BreadcrumbEntry } from '@takaki/go-design-system'

interface PageShellProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbEntry[]
  children: React.ReactNode
}

export function PageShell({ title, description, actions, breadcrumbs, children }: PageShellProps) {
  return (
    <div className="px-6 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title={title}
          description={description}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
        {children}
      </div>
    </div>
  )
}
