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
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconTelegram, IconX } from '@/assets/brand-icons'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const SUPPORT_EMAIL = 'xeylabs.org@gmail.com'

const channels = [
  {
    key: 'email',
    icon: Mail,
    titleKey: 'Email',
    value: SUPPORT_EMAIL,
    descriptionKey: 'For billing, quota, and account issues.',
    actionKey: 'Send Email',
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    key: 'x',
    icon: IconX,
    titleKey: 'X (Twitter)',
    value: '@xeylabs',
    descriptionKey: 'Follow us and send us a DM.',
    actionKey: 'Open X',
    href: 'https://x.com/xeylabs',
  },
  {
    key: 'telegram',
    icon: IconTelegram,
    titleKey: 'Telegram',
    value: 'xcloudhost',
    descriptionKey: 'Join our channel for announcements and updates.',
    actionKey: 'Open Telegram',
    href: 'https://t.me/xcloudhost',
  },
] as const

export function Support() {
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-4xl space-y-6 px-4 py-8'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-bold tracking-tight'>
          {t('Contact Support')}
        </h1>
        <p className='text-muted-foreground'>
          {t('Need help? Reach out to us through any of these channels.')}
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {channels.map((channel) => {
          const Icon = channel.icon
          return (
            <Card key={channel.key} className='flex flex-col'>
              <CardHeader>
                <div className='flex items-center gap-3'>
                  <span className='bg-muted flex size-10 items-center justify-center rounded-lg'>
                    <Icon className='size-5' />
                  </span>
                  <CardTitle className='text-base'>
                    {t(channel.titleKey)}
                  </CardTitle>
                </div>
                <CardDescription>{t(channel.descriptionKey)}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col justify-end gap-3'>
                <p className='text-sm font-medium break-all'>{channel.value}</p>
                <a
                  href={channel.href}
                  target={channel.key === 'email' ? undefined : '_blank'}
                  rel='noopener noreferrer'
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  {t(channel.actionKey)}
                </a>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className='text-muted-foreground text-sm'>
        {t(
          'When contacting us about billing or quota, please include your username so we can help you faster.'
        )}
      </p>
    </div>
  )
}
