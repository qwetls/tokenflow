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
'use client'

import { CodeXmlIcon, EyeIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from './artifact'
import { CodeBlock, CodeBlockCopyButton } from './code-block'

type HtmlPreviewProps = {
  className?: string
  code: string
  language: string
}

function HtmlPreviewButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  const button = (
    <Button
      aria-label={t('Preview')}
      className='size-8 shrink-0'
      onClick={onClick}
      size='icon-sm'
      type='button'
      variant='ghost'
    >
      <EyeIcon className='size-4' />
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>
        <p>{t('Preview')}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function HtmlPreview({ className, code, language }: HtmlPreviewProps) {
  const { t } = useTranslation()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [overlayFullscreen, setOverlayFullscreen] = useState(false)
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep state in sync when the user leaves native fullscreen with ESC.
  useEffect(() => {
    const onFullscreenChange = () => {
      setNativeFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // ESC closes the fallback overlay mode (native mode handles ESC itself).
  useEffect(() => {
    if (!overlayFullscreen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverlayFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [overlayFullscreen])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined)
      return
    }
    if (overlayFullscreen) {
      setOverlayFullscreen(false)
      return
    }
    const container = containerRef.current
    if (container && document.fullscreenEnabled !== false) {
      try {
        await container.requestFullscreen()
        return
      } catch {
        // Fullscreen API blocked — fall back to the overlay mode below.
      }
    }
    setOverlayFullscreen(true)
  }, [overlayFullscreen])

  const closePreview = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined)
    }
    setOverlayFullscreen(false)
    setIsPreviewOpen(false)
  }, [])

  if (!isPreviewOpen) {
    return (
      <CodeBlock
        className={className}
        code={code}
        collapsedLines={14}
        defaultCollapsed={code.split('\n').length > 14}
        language={language}
        maxExpandedLines={44}
        showLineNumbers
        showToolbar
        title={language}
      >
        <CodeBlockCopyButton />
        <HtmlPreviewButton onClick={() => setIsPreviewOpen(true)} />
      </CodeBlock>
    )
  }

  const isFullscreen = nativeFullscreen || overlayFullscreen

  return (
    <div
      ref={containerRef}
      className={cn(
        'my-3',
        overlayFullscreen && 'fixed inset-0 z-[100] m-0 bg-background p-4',
        className
      )}
    >
      <Artifact className={cn(isFullscreen && 'h-full rounded-lg')}>
        <ArtifactHeader>
          <ArtifactTitle>{t('HTML preview')}</ArtifactTitle>
          <ArtifactActions>
            <ArtifactAction
              icon={isFullscreen ? Minimize2Icon : Maximize2Icon}
              label={t(isFullscreen ? 'Exit fullscreen' : 'Fullscreen')}
              onClick={toggleFullscreen}
              tooltip={t(isFullscreen ? 'Exit fullscreen' : 'Fullscreen')}
            />
            <ArtifactAction
              icon={CodeXmlIcon}
              label={t('Show code')}
              onClick={closePreview}
              tooltip={t('Show code')}
            />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent
          className={cn('p-0', isFullscreen ? 'min-h-0 flex-1' : 'h-[480px]')}
        >
          <iframe
            className='size-full bg-white'
            sandbox='allow-scripts'
            srcDoc={code}
            title={t('HTML preview')}
          />
        </ArtifactContent>
      </Artifact>
    </div>
  )
}
