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
            <DrawerClose asChild>
              <X className="h-6 w-6 cursor-pointer" />
            </DrawerClose>
          </DrawerHeader>
          <div className="pr-4 pl-4 flex-1">
            <div className="mt-3 h-full pb-5">
              <Textarea
                className="h-full"
                value={editValue}
                onChange={(event) => {
                  setEditValue(event.target.value)
                }}
              />
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
