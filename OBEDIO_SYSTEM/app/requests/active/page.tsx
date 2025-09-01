'use client'

import React, { useState, useEffect } from 'react'
import { RequestsHeader } from '@/components/requests/requests-header'
import { RequestTable, Request } from '@/components/requests/request-table'
import { Loader2 } from 'lucide-react'

export default function ActiveRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  // Brojači zahteva po statusu
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length
  const inProgressRequests = requests.filter(r => r.status === 'IN_PROGRESS').length
  const totalRequests = pendingRequests + inProgressRequests
  
  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/requests?status=active')
      
      if (!response.ok) {
        throw new Error('Neuspešno dohvatanje zahteva')
      }
      
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Greška pri dohvatanju zahteva:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchRequests()
    
    // Postavi interval za osvežavanje na 30 sekundi
    const refreshInterval = setInterval(() => {
      fetchRequests()
    }, 30000)
    
    return () => clearInterval(refreshInterval)
  }, [])
  
  return (
    <div className="container py-6">
      <RequestsHeader
        refreshRequests={fetchRequests}
        totalRequests={totalRequests}
        pendingRequests={pendingRequests}
        inProgressRequests={inProgressRequests}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Učitavanje zahteva...</span>
        </div>
      ) : (
        <RequestTable
          requests={requests}
          onRefresh={fetchRequests}
          filterStatus={filterStatus}
        />
      )}
    </div>
  )
}
