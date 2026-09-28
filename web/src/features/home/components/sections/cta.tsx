/*
Copyright (C) 2023-2026 QuantumNous

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

For commercial licensing, please contact support@quantumnous.com
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
    <section className='tf-rule-t relative z-10'>
      <div className='mx-auto max-w-6xl px-6 py-24 md:py-32'>
        <AnimateInView>
          <p className='tf-mono mb-6 text-[11px] opacity-60'>
            FIG.04 — GET ACCESS
          </p>
          <h2 className='tf-display text-[clamp(2.5rem,7vw,5.5rem)]'>
            {t('Start routing.')}
            <br />
            <span className='tf-outline'>{t('Today.')}</span>
          </h2>
          <p className='mt-8 max-w-md text-[15px] leading-relaxed'>
            {t(
              'Deploy your own gateway and start routing requests through your configured upstream services.'
            )}
          </p>
          <div className='mt-10 flex flex-wrap items-center gap-3'>
            <Button
              className='tf-mono group h-12 rounded-none border border-[var(--tf-ink)] bg-[var(--tf-acid)] px-6 text-[12px] text-[oklch(0.175_0_0)] hover:bg-[var(--tf-acid)]'
              render={<Link to='/sign-up' />}
            >
              {t('Get Started')}
              <ArrowRight className='ml-1.5 size-4' />
            </Button>
            <Button
              variant='outline'
              className='tf-mono h-12 rounded-none border-[var(--tf-ink)] bg-transparent px-6 text-[12px] text-[var(--tf-ink)] hover:bg-[var(--tf-ink)] hover:text-[var(--tf-paper)] dark:bg-transparent'
              render={<Link to='/pricing' />}
            >
              {t('View Pricing')}
            </Button>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
