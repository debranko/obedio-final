'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

// Simple Dashboard page implementation
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Function to fetch system data
  async function fetchSystemStatus() {
    console.log('Dashboard: Starting data fetch...')
    setLoading(true)
    setError(null)
    
    try {
      console.log('Dashboard: Sending request to /api/system/status...')
      const response = await fetchWithAuth('/api/system/status')
      console.log('Dashboard: Response received:', response.status)
      
      if (!response.ok) {
        throw new Error(`Error fetching system status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Dashboard: Data received from API:', data)
      
      setSystemStatus(data)
      setLoading(false)
      console.log('Dashboard: Data successfully set, loading=false')
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'An error occurred while fetching system data')
      setLoading(false)
      toast({
        title: 'Error',
        description: 'An error occurred while fetching system data. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  // Load data on initial render
  useEffect(() => {
    console.log('Dashboard: Component mounted, starting data fetch')
    fetchSystemStatus()
    
    // Interval for regular data refresh
    const intervalId = setInterval(() => {
      console.log('Dashboard: Refresh interval triggered')
      fetchSystemStatus()
    }, 30000) // Every 30 seconds
    
    return () => {
      console.log('Dashboard: Component unmounted')
      clearInterval(intervalId)
    }
  }, [])

  // Function for manual refresh
  function handleRefresh() {
    if (loading) return
    fetchSystemStatus()
    toast({
      description: 'Data refresh request sent',
      duration: 2000,
    })
  }

  // Log current state for debug
  console.log('Dashboard rendering:', {
    loading,
    hasSystemStatus: systemStatus !== null,
    systemStatusType: systemStatus ? typeof systemStatus : 'null',
  })
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>
      
      {/* Debug info - we'll remove this in final version */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 mb-2 border border-yellow-400 bg-yellow-50 rounded">
          <p><strong>Debug:</strong> loading={loading.toString()}, hasSystemStatus={Boolean(systemStatus).toString()}</p>
          {systemStatus && <p><strong>Data:</strong> {JSON.stringify(systemStatus).substring(0, 100)}...</p>}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading data...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-destructive/10 p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Fetching Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      ) : systemStatus ? (
        <>
          {/* Gornji red statističkih kartica */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus.requests.active}</div>
                <p className="text-xs text-muted-foreground">Total active requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus.devices.online}/{systemStatus.devices.total}</div>
                <p className="text-xs text-muted-foreground">{Math.round(systemStatus.devices.uptime)}% uptime</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus.devices.lowBattery}</div>
                <p className="text-xs text-muted-foreground">Devices needing charge</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus.requests.averageResponseTime} min</div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Glavni sadržaj dashboarda */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Devices Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total devices</span>
                        <span className="font-medium">{systemStatus.devices.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Online</span>
                        <span className="font-medium">{systemStatus.devices.online}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Offline</span>
                        <span className="font-medium">{systemStatus.devices.offline}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Low battery</span>
                        <span className="font-medium">{systemStatus.devices.lowBattery}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Request Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active requests</span>
                        <span className="font-medium">{systemStatus.requests.active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New today</span>
                        <span className="font-medium">{systemStatus.requests.today.new}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completed today</span>
                        <span className="font-medium">{systemStatus.requests.today.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg. response time</span>
                        <span className="font-medium">{systemStatus.requests.averageResponseTime} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Devices</CardTitle>
              </CardHeader>
              <CardContent>
                {systemStatus.topDevices && systemStatus.topDevices.length > 0 ? (
                  <div className="space-y-3">
                    {systemStatus.topDevices.map((device: any) => (
                      <div key={device.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-xs text-muted-foreground">{device.room}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{device.requestCount}</div>
                          <div className="text-xs text-muted-foreground">requests</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No device data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="rounded-lg border bg-gray-100 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No Data</h2>
          <p className="text-muted-foreground mb-4">Unable to retrieve system data.</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      )}
    </div>
  )
}
