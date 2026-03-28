'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreVertical, Edit2, Trash2, FolderInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'

interface MediaFolder {
  id: string
  name: string
  path: string
  parentId: string | null
  children?: MediaFolder[]
}

interface FolderTreeProps {
  folders: MediaFolder[]
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRenameFolder: (folderId: string) => void
  onDeleteFolder: (folderId: string) => void
  onMoveFolder: (folderId: string) => void
}

function buildFolderTree(folders: MediaFolder[]): MediaFolder[] {
  const folderMap = new Map<string, MediaFolder>()
  const rootFolders: MediaFolder[] = []

  // Create map and initialize children arrays
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Build tree structure
  folders.forEach(folder => {
    const folderWithChildren = folderMap.get(folder.id)!
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.children!.push(folderWithChildren)
      } else {
        rootFolders.push(folderWithChildren)
      }
    } else {
      rootFolders.push(folderWithChildren)
    }
  })

  return rootFolders
}

function FolderTreeItem({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
}: {
  folder: MediaFolder
  level: number
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRenameFolder: (folderId: string) => void
  onDeleteFolder: (folderId: string) => void
  onMoveFolder: (folderId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children && folder.children.length > 0

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
          hover:bg-gray-100 group
          ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {isExpanded && hasChildren ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0" />
        )}

        <span className="flex-1 text-sm truncate">{folder.name}</span>

        <Dropdown
          trigger={
            <button
              className="flex-shrink-0 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          }
        >
          <DropdownItem icon={<Plus className="w-4 h-4" />} onClick={() => onCreateFolder(folder.id)}>
            New subfolder
          </DropdownItem>
          <DropdownItem icon={<Edit2 className="w-4 h-4" />} onClick={() => onRenameFolder(folder.id)}>
            Rename
          </DropdownItem>
          <DropdownItem icon={<FolderInput className="w-4 h-4" />} onClick={() => onMoveFolder(folder.id)}>
            Move
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={() => onDeleteFolder(folder.id)}>
            <span className="text-red-600">Delete</span>
          </DropdownItem>
        </Dropdown>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderTreeProps) {
  const folderTree = buildFolderTree(folders)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-gray-900">Folders</h2>
        <Button
          size="sm"
          onClick={() => onCreateFolder(null)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Root/All Files option */}
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer mb-1
            hover:bg-gray-100
            ${selectedFolderId === null ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
          `}
          onClick={() => onSelectFolder(null)}
        >
          <Folder className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium">All Files</span>
        </div>

        {folderTree.map(folder => (
          <FolderTreeItem
            key={folder.id}
            folder={folder}
            level={0}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveFolder={onMoveFolder}
          />
        ))}
      </div>
    </div>
  )
}
