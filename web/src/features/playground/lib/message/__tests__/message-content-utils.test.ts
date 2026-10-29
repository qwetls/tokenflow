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
import { describe, expect, test } from 'vitest'

import { MESSAGE_ROLES, MESSAGE_STATUS } from '../../../constants'
import type { Message } from '../../../types'
import { getMessageContentState } from '../message-content-utils'

function makeAssistantMessage(overrides: Partial<Message> = {}): Message {
  return {
    key: 'test-msg',
    from: MESSAGE_ROLES.ASSISTANT,
    versions: [{ id: 'v1', content: '' }],
    ...overrides,
  }
}

describe('getMessageContentState - stuck reasoning regression', () => {
  test('shows content when reasoning flag is stuck but message is complete', () => {
    // Regression: deepseek-v4.1-flash via napi upstream left
    // isReasoningStreaming=true after [DONE] (stream chunks dropped),
    // hiding the response permanently.
    const message = makeAssistantMessage({
      status: MESSAGE_STATUS.COMPLETE,
      isReasoningStreaming: true,
      reasoning: { content: 'some thinking', duration: 4000 },
    })

    const state = getMessageContentState(message, 'Hello world')

    expect(state.showMessageContent).toBe(true)
    expect(state.displayContent).toBe('Hello world')
  })

  test('hides content while genuinely reasoning during streaming', () => {
    // Normal behavior must be preserved: while streaming with active
    // reasoning, content stays hidden behind the thinking UI.
    const message = makeAssistantMessage({
      status: MESSAGE_STATUS.STREAMING,
      isReasoningStreaming: true,
      reasoning: { content: 'thinking...', duration: 1000 },
    })

    const state = getMessageContentState(message, 'partial')

    expect(state.showMessageContent).toBe(false)
  })

  test('shows content when reasoning finished normally', () => {
    const message = makeAssistantMessage({
      status: MESSAGE_STATUS.COMPLETE,
      isReasoningStreaming: false,
    })

    const state = getMessageContentState(message, 'done')

    expect(state.showMessageContent).toBe(true)
  })
})
