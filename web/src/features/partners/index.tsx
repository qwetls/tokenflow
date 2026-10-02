/*
Copyright (C) 2026 TokenFlow contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For licensing information, see the LICENSE and NOTICE files.
*/
import { useQuery } from '@tanstack/react-query'
import { Handshake } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { RichContent } from '@/components/rich-content'
import { Skeleton } from '@/components/ui/skeleton'
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'
import { requireServerSuccess } from '@/lib/server-error-message'

import { getPartnersContent } from './api'

function EmptyPartnersState() {
  const { t } = useTranslation()

  return (
    <div className='flex min-h-[60vh] items-center justify-center p-8'>
      <div className='max-w-2xl space-y-6 text-center'>
        <div className='flex justify-center'>
          <Handshake className='text-muted-foreground h-24 w-24' />
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold'>{t('No Partners Content Set')}</h2>
          <p className='text-muted-foreground'>
            {t(
              'The administrator has not configured any partners content yet. You can set it in the settings page, supporting HTML or URL.'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export function Partners() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['partners-content'],
    queryFn: async () => requireServerSuccess(await getPartnersContent()),
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isHttpUrl(rawContent)
  const contentIsHtml = hasContent && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout>
        <EmptyPartnersState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('Partners')}
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts'
        />
      </PublicLayout>
    )
  }

  if (contentIsHtml) {
    return (
      <PublicLayout showMainContainer={false}>
        <RichContent
          mode='html'
          htmlVariant='isolated'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-6xl px-4 py-8'>
        <RichContent
          mode='markdown'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </div>
    </PublicLayout>
  )
}
