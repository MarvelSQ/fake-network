import { ColumnDef } from '@tanstack/react-table'
import { NetRequest } from './types'

export const payments: NetRequest[] = [
  {
    id: '1',
    url: 'https://example.com/payment/1',
    method: 'POST',
    status: 200,
    statusText: 'OK',
    request: {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@qq.com',
      }),
    },
    response: {
      duration: 123,
      body: JSON.stringify({
        status: 'success',
        amount: 100,
      }),
    },
    timestamp: 1678901234,
  },
]

export const columns: ColumnDef<NetRequest>[] = [
  {
    // accessorKey: 'timestamp',
    header: 'Time',
    accessorFn: (row) => {
      const date = new Date(row.timestamp)
      return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(
        2,
        '0',
      )}:${`${date.getSeconds()}`.padStart(2, '0')}:${`${date.getMilliseconds()}`.padStart(3, '0')}`
    },
  },
  {
    accessorKey: 'url',
    header: 'URL',
  },
  {
    accessorKey: 'method',
    header: 'Method',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'response.duration',
    header: 'Response Duration (ms)',
  },
]
