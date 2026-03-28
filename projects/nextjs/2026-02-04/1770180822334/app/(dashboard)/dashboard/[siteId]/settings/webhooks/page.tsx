'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
import { Webhook, Trash2, TestTube, Eye } from 'lucide-react'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  lastResponseCode: number | null
  createdAt: string
}

interface WebhookDelivery {
  id: string
  event: string
  deliveredAt: string
  responseStatus: number | null
  succeeded: boolean
}

const AVAILABLE_EVENTS = [
  { id: 'page.published', label: 'Page Published', description: 'When a page is published' },
  { id: 'page.unpublished', label: 'Page Unpublished', description: 'When a page is unpublished' },
  { id: 'page.updated', label: 'Page Updated', description: 'When a page is updated' },
  { id: 'media.uploaded', label: 'Media Uploaded', description: 'When media is uploaded' },
  { id: 'media.deleted', label: 'Media Deleted', description: 'When media is deleted' },
  { id: 'fragment.updated', label: 'Fragment Updated', description: 'When a fragment is updated' },
]

export default function WebhooksPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeliveriesDialog, setShowDeliveriesDialog] = useState(false)
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)
  const [newWebhookName, setNewWebhookName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<Record<string, boolean>>({})
  const [creating, setCreating] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    loadWebhooks()
  }, [siteId])

  async function loadWebhooks() {
    try {
      const response = await fetch(`/api/sites/${siteId}/webhooks`)
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data)
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadDeliveries(webhookId: string) {
    try {
      const response = await fetch(`/api/sites/${siteId}/webhooks/${webhookId}/deliveries`)
      if (response.ok) {
        const data = await response.json()
        setDeliveries(data)
        setSelectedWebhookId(webhookId)
        setShowDeliveriesDialog(true)
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error)
    }
  }

  async function handleCreateWebhook() {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return

    const selectedEvents = Object.entries(newWebhookEvents)
      .filter(([_, enabled]) => enabled)
      .map(([event]) => event)

    if (selectedEvents.length === 0) {
      alert('Please select at least one event')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/sites/${siteId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWebhookName,
          url: newWebhookUrl,
          events: selectedEvents,
        }),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setNewWebhookName('')
        setNewWebhookUrl('')
        setNewWebhookEvents({})
        loadWebhooks()
      }
    } catch (error) {
      console.error('Failed to create webhook:', error)
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteWebhook(webhookId: string) {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return
    }

    try {
      const response = await fetch(`/api/sites/${siteId}/webhooks/${webhookId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadWebhooks()
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error)
    }
  }

  async function handleTestWebhook(webhookId: string) {
    setTesting(webhookId)
    try {
      const response = await fetch(`/api/sites/${siteId}/webhooks/${webhookId}/test`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Test webhook sent successfully')
      } else {
        alert('Failed to send test webhook')
      }
    } catch (error) {
      console.error('Failed to test webhook:', error)
      alert('Failed to send test webhook')
    } finally {
      setTesting(null)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  function getStatusBadge(code: number | null) {
    if (!code) return <Badge variant="secondary">No response</Badge>
    if (code >= 200 && code < 300) return <Badge className="bg-green-600">Success</Badge>
    if (code >= 400 && code < 500) return <Badge variant="destructive">Client Error</Badge>
    if (code >= 500) return <Badge variant="destructive">Server Error</Badge>
    return <Badge variant="secondary">{code}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-600 mt-1">
            Configure webhooks to receive real-time notifications about content changes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Webhook className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No webhooks yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded break-all">
                      {webhook.url}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(webhook.lastTriggeredAt)}
                  </TableCell>
                  <TableCell>
                    {webhook.isActive ? (
                      getStatusBadge(webhook.lastResponseCode)
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadDeliveries(webhook.id)}
                        title="View delivery log"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testing === webhook.id}
                        title="Send test webhook"
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive real-time notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="webhookName">Name</Label>
              <Input
                id="webhookName"
                placeholder="e.g., Netlify Deploy Hook"
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://example.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
            </div>

            <div>
              <Label>Events</Label>
              <div className="space-y-2 mt-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={newWebhookEvents[event.id] || false}
                      onCheckedChange={(checked) =>
                        setNewWebhookEvents((prev) => ({
                          ...prev,
                          [event.id]: checked === true,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={event.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {event.label}
                      </label>
                      <p className="text-xs text-gray-500">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={creating || !newWebhookName.trim() || !newWebhookUrl.trim()}
            >
              {creating ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Log Dialog */}
      <Dialog open={showDeliveriesDialog} onOpenChange={setShowDeliveriesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Log</DialogTitle>
            <DialogDescription>Last 20 webhook deliveries</DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No deliveries yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Badge variant="secondary">{delivery.event}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(delivery.deliveredAt)}
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.responseStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDeliveriesDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
