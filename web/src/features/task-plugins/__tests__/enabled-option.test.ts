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
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  getTaskPluginEnabledOption,
  setTaskPluginEnabledOption,
} from '../api'

const { get, put } = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    get,
    put,
  },
}))

describe('task plugin master switch option', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
  })

  test('reads TaskPluginEnabled from /api/option/', async () => {
    get.mockResolvedValue({
      data: {
        success: true,
        data: [{ key: 'TaskPluginEnabled', value: 'true' }],
      },
    })

    await expect(getTaskPluginEnabledOption()).resolves.toBe(true)
    expect(get).toHaveBeenCalledWith('/api/option/')
  })

  test('writes TaskPluginEnabled to /api/option/', async () => {
    put.mockResolvedValue({ data: { success: true, data: null } })

    await setTaskPluginEnabledOption(false)
    expect(put).toHaveBeenCalledWith(
      '/api/option/',
      { key: 'TaskPluginEnabled', value: 'false' },
      expect.anything()
    )
  })
})
