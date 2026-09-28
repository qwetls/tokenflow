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
  HeartHandshake,
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
      num: '01',
      title: t('Lightning Fast'),
      desc: t(
        'Optimized network architecture ensures millisecond response times'
      ),
      span: 'md:col-span-2',
      visual: (
        <div className='mt-5 grid grid-cols-3 gap-2'>
          {['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Llama'].map(
            (name) => (
              <div
                key={name}
                className='tf-mono border-[var(--tf-rule)] text-[var(--tf-ink-soft)] hover:bg-[var(--tf-acid)] hover:text-[oklch(0.175_0_0)] flex items-center justify-center border px-3 py-2 text-[10px] transition-colors'
              >
                {name}
              </div>
            )
          )}
        </div>
      ),
    },
    {
      id: 'secure',
      num: '02',
      title: t('Secure & Reliable'),
      desc: t(
        'Enterprise-grade security with comprehensive permission management'
      ),
      span: 'md:col-span-1',
      visual: (
        <div className='mt-5 flex items-center gap-2'>
          <Shield className='size-5' strokeWidth={1.5} />
          <span className='tf-mono text-[10px] opacity-60'>
            PERMS / AUDIT
          </span>
        </div>
      ),
    },
    {
      id: 'global',
      num: '03',
      title: t('Global Coverage'),
      desc: t('Multi-region deployment for stable global access'),
      span: 'md:col-span-1',
      visual: (
        <div className='mt-5 space-y-2'>
          {[t('Load Balancing'), t('Rate Limiting'), t('Cost Tracking')].map(
            (step, i) => (
              <div key={step} className='flex items-center gap-2'>
                <span className='tf-mono text-[10px] opacity-60'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className='h-px flex-1 bg-[var(--tf-rule)]' />
                <span className='tf-mono text-[10px]'>{step}</span>
              </div>
            )
          )}
        </div>
      ),
    },
    {
      id: 'developer',
      num: '04',
      title: t('Developer Friendly'),
      desc: t('Compatible API routes for common AI application workflows'),
      span: 'md:col-span-2',
      visual: (
        <div className='mt-5 flex items-center gap-3'>
          {['API', 'SDK', 'CLI', 'DOCS'].map((n) => (
            <div
              key={n}
              className='tf-mono border-[var(--tf-rule)] text-[var(--tf-ink-soft)] flex items-center justify-center border px-2.5 py-1.5 text-[10px]'
            >
              {n}
            </div>
          ))}
          <span className='tf-mono text-[10px] opacity-60'>
            MULTI-PROTOCOL
          </span>
        </div>
      ),
    },
  ]

  const additionalFeatures = [
    {
      icon: <Gauge className='size-5' strokeWidth={1.5} />,
      title: t('High Performance'),
      desc: t('Support for high concurrency with automatic load balancing'),
    },
    {
      icon: <DollarSign className='size-5' strokeWidth={1.5} />,
      title: t('Transparent Billing'),
      desc: t('Pay-as-you-go with real-time usage monitoring'),
    },
    {
      icon: <Users className='size-5' strokeWidth={1.5} />,
      title: t('Team Collaboration'),
      desc: t('Multi-user management with flexible permission allocation'),
    },
    {
      icon: <HeartHandshake className='size-5' strokeWidth={1.5} />,
      title: t('Open Source'),
      desc: t('Community driven, self-hosted, and extensible'),
    },
  ]

  return (
    <section className='tf-rule-t relative z-10'>
      <div className='mx-auto max-w-6xl px-6 py-24 md:py-32'>
        <AnimateInView className='mb-14'>
          <p className='tf-mono mb-4 text-[11px] opacity-60'>
            FIG.02 — CORE FEATURES
          </p>
          <h2 className='tf-display text-[clamp(2rem,5vw,3.75rem)]'>
            {t('Built for developers,')}
            <br />
            <span className='tf-outline'>{t('designed for scale')}</span>
          </h2>
        </AnimateInView>

        {/* Bento grid with visible rules */}
        <div className='grid gap-px overflow-hidden border border-[var(--tf-rule)] bg-[var(--tf-rule)] md:grid-cols-3'>
          {features.map((f, i) => (
            <AnimateInView
              key={f.id}
              delay={i * 100}
              animation='scale-in'
              className={`group bg-[var(--tf-paper)] p-7 transition-colors duration-200 md:p-8 ${f.span}`}
            >
              <div className='mb-3 flex items-center gap-3'>
                <span className='tf-mono border border-[var(--tf-rule)] px-1.5 py-0.5 text-[10px] tabular-nums'>
                  {f.num}
                </span>
                <h3 className='text-sm font-bold tracking-tight uppercase'>
                  {f.title}
                </h3>
              </div>
              <p className='text-[13px] leading-relaxed opacity-70'>
                {f.desc}
              </p>
              {f.visual}
            </AnimateInView>
          ))}
        </div>

        {/* Additional features row */}
        <div className='mt-14 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4'>
          {additionalFeatures.map((f, i) => (
            <AnimateInView
              key={f.title}
              delay={i * 100}
              animation='fade-up'
              className='tf-rule-t flex flex-col items-start pt-4'
            >
              <div className='mb-3'>{f.icon}</div>
              <h3 className='tf-mono mb-1.5 text-[11px]'>{f.title}</h3>
              <p className='max-w-[220px] text-xs leading-relaxed opacity-70'>
                {f.desc}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
