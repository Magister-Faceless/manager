// Type definitions for File System Access API
// https://wicg.github.io/file-system-access/

interface FileSystemHandle {
  readonly kind: 'file' | 'directory'
  readonly name: string
  
  isSameEntry(other: FileSystemHandle): Promise<boolean>
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file'
  
  getFile(): Promise<File>
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory'
  
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>
  getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>
  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>
  keys(): AsyncIterableIterator<string>
  values(): AsyncIterableIterator<FileSystemHandle>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: FileSystemWriteChunkType): Promise<void>
  seek(position: number): Promise<void>
  truncate(size: number): Promise<void>
}

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

interface FileSystemGetFileOptions {
  create?: boolean
}

interface FileSystemGetDirectoryOptions {
  create?: boolean
}

interface FileSystemRemoveOptions {
  recursive?: boolean
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

type FileSystemWriteChunkType = BufferSource | Blob | string | WriteParams

interface WriteParams {
  type: 'write' | 'seek' | 'truncate'
  size?: number
  position?: number
  data?: BufferSource | Blob | string
}

interface DirectoryPickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
  startIn?: WellKnownDirectory | FileSystemHandle
}

interface FilePickerOptions {
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
  id?: string
  startIn?: WellKnownDirectory | FileSystemHandle
  multiple?: boolean
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}

type WellKnownDirectory = 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'

interface Window {
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
  showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>
}
