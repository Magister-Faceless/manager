# Local File System Integration

## Overview

The Project Manager AI now supports **real local file system integration** using the File System Access API. Users can select a folder from their computer, and all file operations (create, edit, rename, delete, move) work with actual files on their machine.

## Key Features

### ✅ Folder Selection
- Users select a local folder when creating a new project
- The app requests read/write permissions for the selected folder
- All project files are scoped to this folder

### ✅ Real File Operations
- **Create**: Create real files and folders on disk
- **Read**: Read actual file contents from disk
- **Update**: Write changes back to disk
- **Delete**: Remove files and folders from disk
- **Rename**: Rename files and folders
- **Move**: Move files between folders

### ✅ Browser Compatibility
- Uses the File System Access API (Chrome, Edge, Opera)
- Shows warning for unsupported browsers
- Graceful fallback messaging

## Implementation Details

### 1. File System Service (`src/services/file-system.ts`)

Provides a clean API for file system operations:

```typescript
class FileSystemService {
  // Select a directory
  async selectDirectory(): Promise<{handle, path}>
  
  // Read directory contents
  async readDirectory(handle): Promise<FileSystemItem[]>
  
  // File operations
  async createFile(parent, name, content): Promise<FileSystemFileHandle>
  async createDirectory(parent, name): Promise<FileSystemDirectoryHandle>
  async readFile(handle): Promise<string>
  async writeFile(handle, content): Promise<void>
  async deleteItem(parent, name): Promise<void>
  async renameItem(parent, oldName, newName): Promise<void>
  async moveItem(sourceParent, targetParent, name): Promise<void>
}
```

### 2. Updated Store (`src/store/index.ts`)

All file operations are now async and interact with the file system:

```typescript
interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle
  // ... other fields
}

interface Project {
  id: string
  name: string
  path: string
  directoryHandle?: FileSystemDirectoryHandle
  // ... other fields
}
```

**Key Store Methods:**
- `loadProjectFiles()` - Recursively loads all files from disk
- `addFile()` - Creates file on disk and adds to store
- `updateFile()` - Writes content to disk
- `deleteFile()` - Removes from disk and store
- `renameFile()` - Renames on disk
- `moveFile()` - Moves between folders on disk
- `selectFile()` - Loads content from disk when opening

### 3. Updated App Component

**Project Creation Flow:**
1. User clicks "New Project"
2. Dialog shows with "Select Folder" button
3. User selects folder from their computer
4. Browser requests permissions
5. Project is created with directory handle
6. Files are loaded from the selected folder

**Browser Support Check:**
```typescript
if (!FileSystemService.isSupported()) {
  // Show warning message
}
```

### 4. File Explorer Integration

The FileExplorer component now:
- Displays real files from the selected folder
- Creates actual files/folders on disk
- Renames files on disk
- Deletes files from disk
- All operations are async

### 5. File Editor Integration

The FileEditor component now:
- Reads actual file content from disk
- Writes changes back to disk
- Shows unsaved changes indicator
- Saves directly to the file system

## Security & Permissions

### Permission Model
- **User-initiated**: All file access requires explicit user action
- **Scoped access**: Limited to the selected folder
- **Permission persistence**: Browser remembers permissions per origin
- **Re-authorization**: User can revoke permissions anytime

### Permission Flow
1. User selects folder → Browser shows permission dialog
2. User grants permission → App can read/write in that folder
3. On subsequent visits → Browser may re-prompt for permission

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+

### Unsupported Browsers
- ❌ Firefox (not yet implemented)
- ❌ Safari (not yet implemented)
- ❌ Mobile browsers (limited support)

The app detects unsupported browsers and shows a helpful message.

## Usage Guide

### Creating a Project with Local Folder

1. Click **"New Project"** button
2. Click **"Select Folder"** button
3. Choose a folder from your computer
4. Browser will ask for permission - click **"Allow"**
5. Enter a project name (defaults to folder name)
6. Click **"Create Project"**
7. All files in the folder will be loaded

### Working with Files

**Create File:**
- Click file icon in explorer
- Enter file name
- File is created on disk immediately

**Edit File:**
- Click on file to open
- Switch to Editor tab
- Make changes
- Click Save → writes to disk

**Rename File:**
- Right-click file → Rename
- Enter new name
- File is renamed on disk

**Delete File:**
- Right-click file → Delete
- File is removed from disk

**Move File:**
- Drag file to new folder (future feature)
- Or use context menu → Move

### File Synchronization

**Auto-refresh:**
- Files are loaded when project is selected
- Manual refresh available via store.refreshFiles()

**External changes:**
- Changes made outside the app are not automatically detected
- Use refresh to reload files from disk

## Technical Notes

### Type Definitions

Custom TypeScript definitions for File System Access API are in:
`src/types/file-system-access.d.ts`

### File Handles

File handles are stored in the Zustand store but are not serializable. This means:
- Projects must be re-selected on page reload
- Handles cannot be saved to localStorage
- Future: Implement IndexedDB storage for handle persistence

### Performance

**Optimization strategies:**
- Lazy loading of file content (only when opened)
- Recursive directory reading with async iteration
- Efficient tree structure in store

### Error Handling

All file system operations include try-catch blocks:
- User-friendly error messages
- Console logging for debugging
- Graceful degradation

## Future Enhancements

### Planned Features
- [ ] Drag-and-drop file moving
- [ ] File watching for external changes
- [ ] IndexedDB persistence for directory handles
- [ ] Bulk file operations
- [ ] File search within project
- [ ] Git integration awareness
- [ ] File type icons
- [ ] Syntax highlighting in editor
- [ ] File size limits and warnings

### Potential Improvements
- [ ] Virtual scrolling for large directories
- [ ] File caching strategy
- [ ] Conflict resolution for concurrent edits
- [ ] Undo/redo for file operations
- [ ] File history/versions

## Limitations

### Current Limitations
1. **No persistence**: Directory handles lost on page reload
2. **No external sync**: Changes outside app not detected
3. **Browser-specific**: Only works in Chromium browsers
4. **No binary files**: Text files only
5. **No symlinks**: Symbolic links not supported

### API Limitations
- Cannot access system folders (e.g., C:\Windows)
- Cannot access files outside selected folder
- Permission prompts can be intrusive
- No background file watching

## Security Considerations

### Safe Practices
- ✅ All operations scoped to selected folder
- ✅ User must explicitly grant permissions
- ✅ No automatic file access
- ✅ Handles not exposed to network

### User Responsibilities
- Choose appropriate project folders
- Don't select system directories
- Be aware of permission grants
- Understand file operations are real

## Troubleshooting

### Common Issues

**"Browser not supported" message:**
- Solution: Use Chrome, Edge, or Opera

**Permission denied errors:**
- Solution: Re-select the folder to re-grant permissions

**Files not showing:**
- Solution: Click refresh or re-select project

**Changes not saving:**
- Solution: Check browser console for errors
- Verify write permissions

**Folder selection cancelled:**
- Solution: Try again, must complete folder selection

## Testing

### Manual Testing Checklist
- [ ] Create project with folder selection
- [ ] Create files and folders
- [ ] Edit file content and save
- [ ] Rename files and folders
- [ ] Delete files and folders
- [ ] Move files between folders
- [ ] Switch between projects
- [ ] Verify changes persist in file system
- [ ] Test permission re-prompts
- [ ] Test unsupported browser warning

### Test Scenarios
1. **Happy path**: Select folder → create files → edit → save
2. **Permission denied**: Deny permission → see error
3. **Large directory**: Select folder with many files
4. **Nested folders**: Create deep folder structure
5. **Special characters**: Test files with special names

## Conclusion

The local file system integration transforms the Project Manager AI from a mock UI into a fully functional file management application. Users can now work with real files on their computer, making it a practical tool for project management.

All file operations are properly scoped, secure, and work seamlessly with the existing UI components. The implementation follows best practices for the File System Access API and provides a solid foundation for future enhancements.
