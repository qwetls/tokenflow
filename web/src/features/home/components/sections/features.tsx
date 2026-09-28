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
import {
  Zap,
  Shield,
  Globe,
  Code,
  Gauge,
  DollarSign,
  Users,
  Server,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const features = [
    {
      id: 'fast',
      title: t('Fast'),
      desc: t(
        'Milliseconds, not seconds. We obsess over routing speed so your users never wait on us.'
      ),
      span: 'md:col-span-2',
      icon: <Zap className='size-4' />,
    },
    {
      id: 'secure',
      title: t('Secure'),
      desc: t(
        "Your keys stay yours. Fine-grained permissions and full audit logs — nothing you didn't approve."
      ),
      span: '',
      icon: <Shield className='size-4' />,
    },
    {
      id: 'global',
      title: t('Global'),
      desc: t(
        "Deployed across regions, so latency doesn't depend on where your users live."
      ),
      span: '',
      icon: <Globe className='size-4' />,
    },
    {
      id: 'developer',
      title: t('Developer-first'),
      desc: t(
        'Used the OpenAI SDK before? Then you already know TokenFlow. Change the base URL — done.'
      ),
      span: 'md:col-span-2',
      icon: <Code className='size-4' />,
      visual: (
        <div className='mt-6 flex flex-wrap items-center gap-2'>
          {['OpenAI', 'Claude', 'Gemini', 'DeepSeek'].map((name) => (
            <span
              key={name}
              className='bg-muted text-muted-foreground rounded-full px-3.5 py-1.5 text-xs'
            >
              {name}
            </span>
          ))}
        </div>
      ),
    },
  ]

  const additionalFeatures = [
    {
      icon: <Gauge className='size-4' />,
      title: t('Handles the crowd'),
      desc: t(
        'Spikes, bursts, a launch-day rush — load balancing spreads traffic automatically.'
      ),
    },
    {
      icon: <DollarSign className='size-4' />,
      title: t('Honest billing'),
      desc: t(
        "Every token and every cent, visible in real time. No mystery charges at month's end."
      ),
    },
    {
      icon: <Users className='size-4' />,
      title: t('Built for teams'),
      desc: t(
        'Add teammates, set budgets per person, revoke access in one click when someone leaves.'
      ),
    },
    {
      icon: <Server className='size-4' />,
      title: t('Self-hosted'),
      desc: t(
        'Runs on your own servers. Your data never leaves your machine.'
      ),
    },
  ]

  return (
    <section className='relative z-10'>
      <div className='mx-auto max-w-6xl px-6 py-24 md:py-32'>
        <AnimateInView className='mx-auto mb-14 max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-balance md:text-4xl'>
            {t('Built for developers,')}{' '}
            <span className='text-muted-foreground'>
              {t('designed for scale')}
            </span>
          </h2>
        </AnimateInView>

        {/* Bento grid */}
        <div className='grid gap-4 md:grid-cols-3'>
          {features.map((f, i) => (
            <AnimateInView
              key={f.id}
              delay={i * 80}
              animation='fade-up'
              className={`group rounded-2xl border border-border bg-card p-7 transition-shadow duration-300 hover:shadow-[0_16px_48px_-16px_oklch(0_0_0/12%)] md:p-8 ${f.span}`}
            >
              <div className='bg-muted mb-5 flex size-9 items-center justify-center rounded-lg [&_svg]:text-foreground'>
                {f.icon}
              </div>
              <h3 className='text-base font-semibold tracking-tight'>
                {f.title}
              </h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                {f.desc}
              </p>
              {f.visual}
            </AnimateInView>
          ))}
        </div>

        {/* Supporting row */}
        <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {additionalFeatures.map((f, i) => (
            <AnimateInView
              key={f.title}
              delay={i * 80}
              animation='fade-up'
              className='rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-[0_16px_48px_-16px_oklch(0_0_0/12%)]'
            >
              <div className='bg-muted mb-4 flex size-8 items-center justify-center rounded-lg [&_svg]:text-foreground'>
                {f.icon}
              </div>
              <h3 className='text-sm font-semibold tracking-tight'>
                {f.title}
              </h3>
              <p className='text-muted-foreground mt-1.5 text-xs leading-relaxed'>
                {f.desc}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
