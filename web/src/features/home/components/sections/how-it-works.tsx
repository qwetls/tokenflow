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
import { Settings, Zap, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '1',
      title: t('Configure'),
      desc: t('Paste your provider keys, name your channels. Five minutes, tops.'),
      icon: <Settings className='size-4' />,
    },
    {
      num: '2',
      title: t('Connect'),
      desc: t(
        'Point your app at TokenFlow. Same OpenAI-style endpoints — no rewrites.'
      ),
      icon: <Zap className='size-4' />,
    },
    {
      num: '3',
      title: t('Monitor'),
      desc: t(
        'Tokens, cost and latency, live — per key, per model. Numbers, not vibes.'
      ),
      icon: <BarChart3 className='size-4' />,
    },
  ]

  return (
    <section className='bg-muted/30 relative z-10'>
      <div className='mx-auto max-w-6xl px-6 py-24 md:py-32'>
        <AnimateInView className='mx-auto mb-14 max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-balance md:text-4xl'>
            {t('Three steps to get started')}
          </h2>
        </AnimateInView>

        <div className='grid gap-4 md:grid-cols-3'>
          {steps.map((step, i) => (
            <AnimateInView
              key={step.num}
              delay={i * 100}
              animation='fade-up'
              className='relative rounded-2xl border border-border bg-card p-8'
            >
              <div className='flex items-center justify-between'>
                <div className='bg-muted flex size-9 items-center justify-center rounded-lg [&_svg]:text-foreground'>
                  {step.icon}
                </div>
                <span className='text-muted-foreground/30 text-4xl font-bold tabular-nums'>
                  {step.num}
                </span>
              </div>
              <h3 className='mt-6 text-base font-semibold tracking-tight'>
                {step.title}
              </h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                {step.desc}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
