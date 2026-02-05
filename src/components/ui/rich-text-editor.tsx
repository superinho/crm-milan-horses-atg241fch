import React, { useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  RemoveFormatting,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: RichTextEditorProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Sync initial value or external updates
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      contentRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML)
    }
  }

  const execCommand = (
    command: string,
    value: string | undefined = undefined,
  ) => {
    document.execCommand(command, false, value)
    if (contentRef.current) {
      contentRef.current.focus()
      handleInput()
    }
  }

  const handleLink = () => {
    const url = prompt('Digite a URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const ToolbarButton = ({
    icon: Icon,
    command,
    arg,
    title,
  }: {
    icon: any
    command: string
    arg?: string
    title: string
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() =>
        command === 'createLink' ? handleLink() : execCommand(command, arg)
      }
      title={title}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  return (
    <div
      className={cn(
        'flex flex-col border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}
    >
      <div className="flex items-center gap-1 border-b p-1 bg-muted/20">
        <ToolbarButton icon={Bold} command="bold" title="Negrito" />
        <ToolbarButton icon={Italic} command="italic" title="Itálico" />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          icon={List}
          command="insertUnorderedList"
          title="Lista com marcadores"
        />
        <ToolbarButton
          icon={ListOrdered}
          command="insertOrderedList"
          title="Lista numerada"
        />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton icon={LinkIcon} command="createLink" title="Link" />
        <ToolbarButton
          icon={RemoveFormatting}
          command="removeFormat"
          title="Remover formatação"
        />
      </div>
      <div
        ref={contentRef}
        contentEditable={!disabled}
        className={cn(
          'min-h-[150px] p-3 outline-none prose prose-sm max-w-none overflow-auto',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />
    </div>
  )
}
