'use client'

import React, { useState, useEffect } from 'react'
import { ActiveShiftsList } from '@/components/duty/active-shifts-list'
import { StartShiftForm } from '@/components/duty/start-shift-form'
import { ShiftsHistory } from '@/components/duty/shifts-history'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Loader2, AlertTriangle, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DutyPage() {
  const [activeShifts, setActiveShifts] = useState([])
  const [shiftHistory, setShiftHistory] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Funkcija za dohvatanje podataka
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Dohvati aktivne smene
      const activeShiftsResponse = await fetch('/api/shifts?status=ACTIVE')
      if (!activeShiftsResponse.ok) {
        throw new Error('Greška pri dohvatanju aktivnih smena')
      }
      const activeShiftsData = await activeShiftsResponse.json()
      setActiveShifts(activeShiftsData)
      
      // Dohvati istoriju smena
      const historyResponse = await fetch('/api/shifts?limit=10')
      if (!historyResponse.ok) {
        throw new Error('Greška pri dohvatanju istorije smena')
      }
      const historyData = await historyResponse.json()
      setShiftHistory(historyData)
      
      // Dohvati listu korisnika
      const usersResponse = await fetch('/api/users')
      if (!usersResponse.ok) {
        throw new Error('Greška pri dohvatanju korisnika')
      }
      const usersData = await usersResponse.json()
      setAvailableUsers(usersData)
      
    } catch (error) {
      console.error('Greška pri dohvatanju podataka:', error)
      setError('Došlo je do greške pri dohvatanju podataka. Pokušajte ponovo.')
      toast({
        title: 'Greška',
        description: 'Došlo je do greške pri dohvatanju podataka o smenama.',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Inicijalno dohvatanje podataka
  useEffect(() => {
    fetchData()
    
    // Osvežavanje podataka svakih 30 sekundi
    const interval = setInterval(() => {
      fetchData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Funkcija za ručno osvežavanje podataka
  const handleRefresh = () => {
    fetchData()
    toast({
      description: 'Podaci osveženi',
      duration: 2000
    })
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Upravljanje smenama</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Osveži
        </Button>
      </div>
      
      {loading && activeShifts.length === 0 && shiftHistory.length === 0 ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Učitavanje podataka...</span>
        </div>
      ) : error ? (
        <Card className="bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Greška pri učitavanju</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>Pokušaj ponovo</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Statistika smena */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aktivne smene</p>
                    <h3 className="text-2xl font-bold">{activeShifts.length}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Glavni sadržaj */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <ActiveShiftsList 
                shifts={activeShifts} 
                availableUsers={availableUsers} 
                onRefresh={fetchData} 
              />
              <ShiftsHistory shifts={shiftHistory} />
            </div>
            
            <div className="space-y-6">
              <StartShiftForm users={availableUsers} onSuccess={fetchData} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Informacije</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ova stranica omogućava upravljanje smenama članova posade. Možete započeti nove smene i završiti postojeće.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pri završavanju smene možete prebaciti sve aktivne zahteve na drugog člana posade.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
