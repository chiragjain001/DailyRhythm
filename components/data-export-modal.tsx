"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, FileText, Database, X } from 'lucide-react'
import { useDataExport } from '@/hooks/useDataExport'
import { cn } from '@/lib/utils'

interface DataExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DataExportModal({ isOpen, onClose }: DataExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { exportData, exportCSV, importData, getCompletionStats } = useDataExport()

  if (!isOpen) return null

  const handleExportJSON = async () => {
    setLoading(true)
    setMessage(null)
    
    const result = await exportData()
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setLoading(false)
  }

  const handleExportCSV = async () => {
    setLoading(true)
    setMessage(null)
    
    const result = await exportCSV()
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setLoading(false)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage(null)
    
    const result = await importData(file)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setLoading(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Data Management</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Export Data</h3>
            
            <Button 
              onClick={handleExportJSON}
              disabled={loading}
              className="w-full justify-start gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              variant="outline"
            >
              <Database className="h-4 w-4" />
              Export as JSON (Complete Backup)
            </Button>
            
            <Button 
              onClick={handleExportCSV}
              disabled={loading}
              className="w-full justify-start gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              Export as CSV (Spreadsheet)
            </Button>
          </div>

          {/* Import Section */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-medium text-sm text-gray-700">Import Data</h3>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full justify-start gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              variant="outline"
            >
              <Upload className="h-4 w-4" />
              Import from JSON File
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={cn(
              "p-3 rounded-lg text-sm",
              message.type === 'success' 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            )}>
              {message.text}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Processing...</span>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p><strong>JSON Export:</strong> Complete backup with all data and history</p>
            <p><strong>CSV Export:</strong> Spreadsheet-compatible format for analysis</p>
            <p><strong>Import:</strong> Restore data from JSON backup files</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
