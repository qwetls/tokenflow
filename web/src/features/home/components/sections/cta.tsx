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
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  if (props.isAuthenticated) {
    return null
  }

  return (
    <section className='relative z-10'>
      <div className='mx-auto max-w-6xl px-6 py-24 md:py-32'>
        <AnimateInView>
          <div className='relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center md:py-20'>
            <div
              aria-hidden
              className='absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,oklch(0.7_0.12_250/10%),transparent_70%)]'
            />
            <div className='relative'>
              <h2 className='mx-auto max-w-xl text-3xl font-bold tracking-tight text-balance md:text-5xl'>
                {t('Your first call is')} {t('five minutes away.')}
              </h2>
              <p className='text-muted-foreground mx-auto mt-5 max-w-md text-base leading-relaxed'>
                {t(
                  'Grab a key, make your first call, and be done before your coffee cools. Cheap to try, easy to stay.'
                )}
              </p>
              <div className='mt-9 flex flex-wrap items-center justify-center gap-3'>
                <Button
                  className='group h-11 rounded-full px-6 text-sm font-medium'
                  render={<Link to='/sign-up' />}
                >
                  {t('Get Started')}
                  <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                <Button
                  variant='outline'
                  className='border-border h-11 rounded-full px-6 text-sm font-medium'
                  render={<Link to='/pricing' />}
                >
                  {t('View Pricing')}
                </Button>
              </div>
            </div>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
