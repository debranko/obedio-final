'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Download, Upload, Shield, Key, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'

interface Certificate {
  id: string
  name: string
  type: 'ca' | 'server' | 'client'
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  fingerprint: string
  status: 'valid' | 'expired' | 'expiring' | 'revoked'
  usedBy: string[]
  createdAt: string
}

interface CertificateAuthority {
  id: string
  name: string
  subject: string
  validFrom: string
  validTo: string
  issuedCertificates: number
  status: 'active' | 'inactive' | 'expired'
}

export function MQTTTLSTab() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [authorities, setAuthorities] = useState<CertificateAuthority[]>([])
  const [loading, setLoading] = useState(true)
  const [showCertDialog, setShowCertDialog] = useState(false)
  const [showCADialog, setShowCADialog] = useState(false)
  const { toast } = useToast()

  // Form states
  const [certForm, setCertForm] = useState({
    name: '',
    type: 'client' as const,
    subject: '',
    validityDays: 365,
    keySize: 2048,
    signatureAlgorithm: 'SHA256'
  })

  const [caForm, setCAForm] = useState({
    name: '',
    subject: '',
    validityDays: 3650,
    keySize: 4096
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [certsRes, casRes] = await Promise.all([
        fetchWithAuth('/api/mqtt/security?type=certificates'),
        fetchWithAuth('/api/mqtt/security?type=authorities')
      ])

      if (certsRes.ok) {
        const data = await certsRes.json()
        setCertificates(data.certificates || [])
      }

      if (casRes.ok) {
        const data = await casRes.json()
        setAuthorities(data.authorities || [])
      }
    } catch (error) {
      console.error('Error fetching TLS data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch TLS certificate data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCertificate = async () => {
    try {
      const response = await fetchWithAuth('/api/mqtt/security', {
        method: 'POST',
        body: JSON.stringify({
          requestType: 'certificate',
          ...certForm
        })
      })

      if (response.ok) {
        await fetchData()
        setShowCertDialog(false)
        resetCertForm()
        toast({
          title: 'Success',
          description: 'Certificate generated successfully',
        })
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate certificate',
        variant: 'destructive',
      })
    }
  }

  const handleCreateCA = async () => {
    try {
      const response = await fetchWithAuth('/api/mqtt/security', {
        method: 'POST',
        body: JSON.stringify({
          type: 'ca',
          ...caForm
        })
      })

      if (response.ok) {
        await fetchData()
        setShowCADialog(false)
        resetCAForm()
        toast({
          title: 'Success',
          description: 'Certificate Authority created successfully',
        })
      }
    } catch (error) {
      console.error('Error creating CA:', error)
      toast({
        title: 'Error',
        description: 'Failed to create Certificate Authority',
        variant: 'destructive',
      })
    }
  }

  const resetCertForm = () => {
    setCertForm({
      name: '',
      type: 'client',
      subject: '',
      validityDays: 365,
      keySize: 2048,
      signatureAlgorithm: 'SHA256'
    })
  }

  const resetCAForm = () => {
    setCAForm({
      name: '',
      subject: '',
      validityDays: 3650,
      keySize: 4096
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-red-600"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800"><Calendar className="w-3 h-3 mr-1" />Expiring</Badge>
      case 'revoked':
        return <Badge variant="outline" className="text-gray-600">Revoked</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      ca: 'bg-purple-100 text-purple-800',
      server: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800'
    }
    return <Badge className={colors[type as keyof typeof colors] || colors.client}>{type.toUpperCase()}</Badge>
  }

  const getDaysUntilExpiry = (validTo: string) => {
    const expiryDate = new Date(validTo)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const downloadCertificate = async (certId: string, format: 'pem' | 'p12' = 'pem') => {
    try {
      const response = await fetchWithAuth(`/api/mqtt/security/download?id=${certId}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        variant: 'destructive',
      })
    }
  }

  const overallStats = {
    totalCertificates: certificates.length,
    validCertificates: certificates.filter(c => c.status === 'valid').length,
    expiringCertificates: certificates.filter(c => c.status === 'expiring').length,
    expiredCertificates: certificates.filter(c => c.status === 'expired').length,
    totalAuthorities: authorities.length,
    activeAuthorities: authorities.filter(a => a.status === 'active').length
  }

  return (
    <div className="space-y-6">
      {/* TLS Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCertificates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.validCertificates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overallStats.expiringCertificates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.expiredCertificates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certificate Authorities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalAuthorities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active CAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.activeAuthorities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Authorities Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Certificate Authorities
              </CardTitle>
            </div>
            <Button onClick={() => setShowCADialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New CA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Valid From</TableHead>
                <TableHead>Valid To</TableHead>
                <TableHead>Issued Certificates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No certificate authorities found
                  </TableCell>
                </TableRow>
              ) : (
                authorities.map((ca) => (
                  <TableRow key={ca.id}>
                    <TableCell>
                      <div className="font-medium">{ca.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{ca.subject}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(ca.validFrom).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(ca.validTo).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">{ca.issuedCertificates}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ca.status === 'active' ? 'default' : 'secondary'}>
                        {ca.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => downloadCertificate(ca.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certificates Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                TLS Certificates
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setShowCertDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading certificates...
                  </TableCell>
                </TableRow>
              ) : certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No certificates found
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{cert.fingerprint.substring(0, 16)}...</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(cert.type)}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm max-w-48 truncate" title={cert.subject}>
                        {cert.subject}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(cert.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(cert.validTo).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {getDaysUntilExpiry(cert.validTo) > 0 
                          ? `${getDaysUntilExpiry(cert.validTo)} days left`
                          : 'Expired'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {cert.usedBy.length > 0 ? (
                          <div>{cert.usedBy.length} devices</div>
                        ) : (
                          <span className="text-muted-foreground">Unused</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => downloadCertificate(cert.id, 'pem')}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Certificate Dialog */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate TLS Certificate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-name">Certificate Name</Label>
                <Input
                  id="cert-name"
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  placeholder="Enter certificate name"
                />
              </div>
              <div>
                <Label htmlFor="cert-type">Certificate Type</Label>
                <Select value={certForm.type} onValueChange={(value) => setCertForm({ ...certForm, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client Certificate</SelectItem>
                    <SelectItem value="server">Server Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="cert-subject">Subject (Common Name)</Label>
              <Input
                id="cert-subject"
                value={certForm.subject}
                onChange={(e) => setCertForm({ ...certForm, subject: e.target.value })}
                placeholder="e.g., mqtt.example.com or device123"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cert-validity">Validity (Days)</Label>
                <Input
                  id="cert-validity"
                  type="number"
                  value={certForm.validityDays}
                  onChange={(e) => setCertForm({ ...certForm, validityDays: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cert-keysize">Key Size</Label>
                <Select value={certForm.keySize.toString()} onValueChange={(value) => setCertForm({ ...certForm, keySize: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2048">2048 bits</SelectItem>
                    <SelectItem value="4096">4096 bits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cert-signature">Signature Algorithm</Label>
                <Select value={certForm.signatureAlgorithm} onValueChange={(value) => setCertForm({ ...certForm, signatureAlgorithm: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHA256">SHA256</SelectItem>
                    <SelectItem value="SHA384">SHA384</SelectItem>
                    <SelectItem value="SHA512">SHA512</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateCertificate}>
              Generate Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create CA Dialog */}
      <Dialog open={showCADialog} onOpenChange={setShowCADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Certificate Authority</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="ca-name">CA Name</Label>
              <Input
                id="ca-name"
                value={caForm.name}
                onChange={(e) => setCAForm({ ...caForm, name: e.target.value })}
                placeholder="Enter CA name"
              />
            </div>
            <div>
              <Label htmlFor="ca-subject">Subject</Label>
              <Input
                id="ca-subject"
                value={caForm.subject}
                onChange={(e) => setCAForm({ ...caForm, subject: e.target.value })}
                placeholder="CN=Obedio Root CA, O=Obedio, C=US"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ca-validity">Validity (Days)</Label>
                <Input
                  id="ca-validity"
                  type="number"
                  value={caForm.validityDays}
                  onChange={(e) => setCAForm({ ...caForm, validityDays: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="ca-keysize">Key Size</Label>
                <Select value={caForm.keySize.toString()} onValueChange={(value) => setCAForm({ ...caForm, keySize: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2048">2048 bits</SelectItem>
                    <SelectItem value="4096">4096 bits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCA}>
              Create CA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}