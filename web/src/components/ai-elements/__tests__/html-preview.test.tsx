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
import { fireEvent, render, screen } from '@testing-library/react'
import type { CodeBlockNode } from 'stream-markdown-parser'
import { describe, expect, test } from 'vitest'

import { HtmlPreview } from '../html-preview'
import { renderCodeBlock } from '../response-renderer-blocks'

const htmlCode = '<!DOCTYPE html><html><body><h1>Hello</h1></body></html>'

function codeBlockNode(code: string, language: string): CodeBlockNode {
  return { type: 'code_block', language, code, raw: code }
}

describe('HtmlPreview', () => {
  test('shows a Preview toggle button for html code blocks', () => {
    render(<HtmlPreview code={htmlCode} language='html' />)

    expect(
      screen.getByRole('button', { name: 'Preview' })
    ).toBeInTheDocument()
  })

  test('opening preview renders the code in a restricted sandboxed iframe', () => {
    render(<HtmlPreview code={htmlCode} language='html' />)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

    const iframe = screen.getByTitle('HTML preview')
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe).toHaveAttribute('srcDoc', htmlCode)
    // Scripts may run, but the frame must stay an opaque origin so it can
    // never reach the parent document.
    const sandbox = iframe.getAttribute('sandbox') ?? ''
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-same-origin')
  })

  test('show code button returns from preview to the code block', () => {
    render(<HtmlPreview code={htmlCode} language='html' />)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByTitle('HTML preview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(screen.queryByTitle('HTML preview')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Preview' })
    ).toBeInTheDocument()
  })

  test('fullscreen button expands the preview to fill the viewport and back', async () => {
    const { container } = render(
      <HtmlPreview code={htmlCode} language='html' />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

    const fullscreenButton = screen.getByRole('button', {
      name: 'Fullscreen',
    })
    expect(fullscreenButton).toBeInTheDocument()

    // jsdom has no Fullscreen API, so it falls back to the overlay mode.
    fireEvent.click(fullscreenButton)
    await screen.findByRole('button', { name: 'Exit fullscreen' })
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('fixed')

    fireEvent.click(
      screen.getByRole('button', { name: 'Exit fullscreen' })
    )
    await screen.findByRole('button', { name: 'Fullscreen' })
    expect(container.firstElementChild?.className).not.toContain('fixed')
  })
})

describe('renderCodeBlock', () => {
  test('routes html blocks to the preview variant', () => {
    render(<>{renderCodeBlock(codeBlockNode(htmlCode, 'html'), 'k1')}</>)

    expect(
      screen.getByRole('button', { name: 'Preview' })
    ).toBeInTheDocument()
  })

  test('keeps plain code rendering without preview for other languages', () => {
    render(
      <>{renderCodeBlock(codeBlockNode('console.log(1)', 'javascript'), 'k2')}</>
    )

    expect(
      screen.queryByRole('button', { name: 'Preview' })
    ).not.toBeInTheDocument()
  })
})
