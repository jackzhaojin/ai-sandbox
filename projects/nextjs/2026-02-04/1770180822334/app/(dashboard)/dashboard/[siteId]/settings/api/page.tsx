'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Key, Copy, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { generateApiKey, hashApiKey, getApiKeyPrefix, maskApiKey } from '@/lib/api-keys'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions: Record<string, boolean>
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  isActive: boolean
}

const AVAILABLE_PERMISSIONS = [
  { id: 'read:pages', label: 'Read Pages', description: 'Access published pages' },
  { id: 'read:media', label: 'Read Media', description: 'Access media files' },
  { id: 'read:content', label: 'Read Content', description: 'Access fragments and menus' },
  { id: 'read:site', label: 'Read Site', description: 'Access site metadata' },
]

export default function ApiKeysPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<Record<string, boolean>>({})
  const [newKeyExpiration, setNewKeyExpiration] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadApiKeys()
  }, [siteId])

  async function loadApiKeys() {
    try {
      const response = await fetch(`/api/sites/${siteId}/api-keys`)
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data)
      }
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) return

    setCreating(true)
    try {
      // Generate API key
      const apiKey = generateApiKey()
      const keyHash = hashApiKey(apiKey)
      const keyPrefix = getApiKeyPrefix(apiKey)

      // Create key in database
      const response = await fetch(`/api/sites/${siteId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          keyHash,
          keyPrefix,
          permissions: newKeyPermissions,
          expiresAt: newKeyExpiration || null,
        }),
      })

      if (response.ok) {
        setGeneratedKey(apiKey)
        setShowCreateDialog(false)
        setShowKeyDialog(true)
        setNewKeyName('')
        setNewKeyPermissions({})
        setNewKeyExpiration('')
        loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    } finally {
      setCreating(false)
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/sites/${siteId}/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-600 mt-1">
            Manage API keys for headless access to your site content
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Key className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {maskApiKey(key.keyPrefix)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(key.permissions)
                        .filter(([_, enabled]) => enabled)
                        .map(([permission]) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(key.lastUsedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                  </TableCell>
                  <TableCell>
                    {key.isActive ? (
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Revoked</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {key.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for headless access to your site content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Frontend"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="space-y-2 mt-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={newKeyPermissions[permission.id] || false}
                      onCheckedChange={(checked) =>
                        setNewKeyPermissions((prev) => ({
                          ...prev,
                          [permission.id]: checked === true,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {permission.label}
                      </label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expiration">Expiration (Optional)</Label>
              <Input
                id="expiration"
                type="date"
                value={newKeyExpiration}
                onChange={(e) => setNewKeyExpiration(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={creating || !newKeyName.trim()}>
              {creating ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded mt-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Make sure to copy your API key now. You won't be able to see it again!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>Your API Key</Label>
            <div className="flex gap-2 mt-2">
              <Input
                readOnly
                value={generatedKey}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
