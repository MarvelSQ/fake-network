'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { NetRequest } from './types'
import { Textarea } from '@/components/ui/textarea'
import { Editor } from '@/components/Editor/editor'

export function EditDrawer({
  open,
  request,
  onClose,
}: {
  open: boolean
  request: NetRequest | undefined
  onClose: () => void
}) {
  const [editValue, setEditValue] = React.useState<string>('')

  React.useEffect(() => {
    if (request) {
      const response = JSON.parse(request.response.body)

      setEditValue(JSON.stringify(response, null, 2))
    }
  }, [request])

  return (
    <Drawer activeSnapPoint={null} open={open} onClose={onClose} shouldScaleBackground>
      <DrawerContent className="h-full">
        <div className="mx-auto w-full h-full flex flex-col">
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle>{request?.url}</DrawerTitle>
            <div className="flex flex-row items-center gap-2">
              <Button size="sm" className="cursor-pointer hover:bg-primary/80">
                <span className="text-sm">Save</span>
              </Button>
              <DrawerClose asChild>
                <X className="h-6 w-6 cursor-pointer hover:text-black/80" />
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="pr-4 pl-4 flex-1">
            <div className="mt-3 h-full pb-5">
              <Editor value={editValue} language="json" onChange={setEditValue} />
            </div>
          </div>
          <DrawerFooter className="flex-row">
            <Button className="flex-1">Save</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
