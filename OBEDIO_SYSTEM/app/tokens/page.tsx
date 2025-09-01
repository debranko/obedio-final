import { Metadata } from 'next'
import { TokenHistory } from '@/components/devices/token-history'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Provisioning tokeni | Obedio Admin',
  description: 'Upravljanje tokenima za provizioniranje',
}

export default function TokensPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/devices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Nazad na uređaje
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Provisioning tokeni</h1>
        </div>
        
        <Link href="/devices">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novi token
          </Button>
        </Link>
      </div>
      
      <TokenHistory />
    </div>
  )
}
