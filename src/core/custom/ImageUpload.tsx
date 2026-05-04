import {
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/core/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import React from "react"
import { Spinner } from "@/components/ui/spinner"
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react"

export function ImageUpload({
  onUpload,
  multi = false,
  initialFile,
  initialFiles,
  ...props
}: {
  multi?: boolean
  initialFile?: FileMetadata
  initialFiles?: FileMetadata[]
  onUpload: (file: FileWithPreview, signal: AbortSignal) => Promise<void>
} & React.ComponentProps<"input">) {
  const [busy, setBusy] = React.useState(false)
  const signalRef = React.useRef<AbortController>(null)

  const initFiles = React.useMemo(() => {
    if (initialFiles?.length) return initialFiles
    if (initialFile) return [initialFile]
    return []
  }, [initialFile, initialFiles])

  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    initialFiles: initFiles.length ? initFiles : undefined,
    multiple: multi,
    maxSize: 5 * 1024 * 1024,
    accept: "image/*",
    onFilesAdded: (addedFiles) => {
      for (const f of addedFiles) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBusy(true)
        signalRef.current = new AbortController()
        onUpload(f, signalRef.current.signal).finally(() => setBusy(false))
      }
    },
  })

  if (multi) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.file?.name ?? "uploaded"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <IconPhoto className="size-5 opacity-40" />
                </div>
              )}
              <Button
                type="button"
                aria-label="Remove image"
                size="icon-xs"
                className="absolute -top-1 -right-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => {
                  removeFile(f.id)
                  signalRef.current?.abort()
                }}
              >
                <IconX className="size-3.5" />
              </Button>
            </div>
          ))}

          {/* Add-more card */}
          <button
            type="button"
            className="flex size-20 items-center justify-center rounded-lg border border-dashed border-input transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging=true]:bg-accent/50"
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            disabled={busy}
          >
            {busy ? (
              <Spinner />
            ) : (
              <IconUpload className="size-4 opacity-60" />
            )}
          </button>
        </div>

        <input
          {...props}
          {...getInputProps()}
          aria-label="Upload image files"
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
        />
      </div>
    )
  }

  const file = files[0]
  const previewUrl = file?.preview || null

  return (
    <>
      <button
        type="button"
        aria-label={previewUrl ? "Change image" : "Upload image"}
        className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-input transition-colors outline-none hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none data-[dragging=true]:bg-accent/50"
        data-dragging={isDragging || undefined}
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        disabled={busy}
      >
        {busy ? (
          <Spinner />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={file?.file?.name ?? "Uploaded image"}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1" aria-hidden="true">
            <IconPhoto className="size-6 opacity-40" />
            <span className="text-xs text-muted-foreground">
              Click to upload or drag and drop
            </span>
          </div>
        )}
      </button>

      {previewUrl && (
        <div className="mt-1 flex justify-end">
          <Button
            type="button"
            aria-label="Remove image"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => {
              removeFile(file!.id)
              signalRef.current?.abort()
            }}
          >
            <IconX className="mr-1 size-3" />
            Remove
          </Button>
        </div>
      )}

      <input
        {...props}
        {...getInputProps()}
        aria-label="Upload image file"
        className="sr-only"
        tabIndex={-1}
        disabled={busy}
      />
    </>
  )
}
