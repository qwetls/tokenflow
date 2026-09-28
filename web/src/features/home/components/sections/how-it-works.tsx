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
import { Settings, Zap, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '01',
      title: t('Configure'),
      desc: t(
        'Add your API keys, set up channels and configure access permissions'
      ),
      icon: <Settings className='size-6' strokeWidth={1.5} />,
    },
    {
      num: '02',
      title: t('Connect'),
      desc: t(
        'Connect through OpenAI, Claude, Gemini, and other compatible API routes'
      ),
      icon: <Zap className='size-6' strokeWidth={1.5} />,
    },
    {
      num: '03',
      title: t('Monitor'),
      desc: t('Track usage, costs and performance with real-time analytics'),
      icon: <BarChart3 className='size-6' strokeWidth={1.5} />,
    },
  ]

  return (
    <section className='tf-rule-t relative z-10'>
      <div className='mx-auto max-w-6xl px-6 py-24 md:py-32'>
        <AnimateInView className='mb-14'>
          <p className='tf-mono mb-4 text-[11px] opacity-60'>
            FIG.03 — HOW IT WORKS
          </p>
          <h2 className='tf-display text-[clamp(2rem,5vw,3.75rem)]'>
            {t('Three steps to get started')}
          </h2>
        </AnimateInView>

        <div className='grid gap-10 md:grid-cols-3 md:gap-0'>
          {steps.map((step, i) => (
            <AnimateInView
              key={step.num}
              delay={i * 150}
              animation='fade-up'
              className={`flex flex-col items-start ${i > 0 ? 'tf-col-rule md:pl-8' : ''}`}
            >
              <div className='mb-5 flex items-center gap-3'>
                <span className='tf-display text-3xl'>{step.num}</span>
                <span className='h-px w-10 bg-[var(--tf-rule)]' />
              </div>
              <div className='mb-4'>{step.icon}</div>
              <h3 className='tf-mono mb-2 text-[12px]'>{step.title}</h3>
              <p className='max-w-[260px] text-[13px] leading-relaxed opacity-70'>
                {step.desc}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
