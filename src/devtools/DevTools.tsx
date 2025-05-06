import { useMemo, useState } from 'react'
import './DevTools.css'
import { columns, payments } from './requests/data'
import { DataTable } from './requests/table'
import { EditDrawer } from './requests/drawer'
import { Edit, Eye, Trash } from 'lucide-react'
import type { NetRequest } from './requests/types'
import { Switch } from '@/components/ui/switch'

export const DevTools = () => {
  const [selectedRequest, setSelectedRequest] = useState<NetRequest | undefined>(undefined)

  const handleEdit = (request: NetRequest) => {
    setSelectedRequest(request)
  }

  const handleClose = () => {
    setSelectedRequest(undefined)
  }

  const renderColumns = useMemo(() => {
    return [
      {
        header: 'mock',
        cell: ({ row }) => {
          return <Switch title="mock" />
        },
      },
      ...columns,
      {
        header: 'Options',
        cell: ({ row }) => {
          return (
            <div className="flex gap-2">
              <button className="btn btn-primary">
                <Eye className="w-4 h-4" />
              </button>
              <button
                className="btn btn-secondary cursor-pointer"
                onClick={() => handleEdit(row.original)}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button className="btn btn-danger">
                <Trash className="w-4 h-4" />
              </button>
            </div>
          )
        },
      },
    ]
  }, [])

  return (
    <main className="h-dvh bg-black">
      <div
        className="bg-white h-full rounded-sm"
        style={
          !!selectedRequest
            ? {
                transition: 'transform 0.3s ease-in-out',
                transformOrigin: 'center',
                transform: 'scale(0.96)',
              }
            : {
                transition: 'transform 0.3s ease-in-out',
              }
        }
      >
        <DataTable columns={renderColumns} data={payments} />
      </div>
      <EditDrawer open={!!selectedRequest} request={selectedRequest} onClose={handleClose} />
    </main>
  )
}

export default DevTools
