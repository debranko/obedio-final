import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-bold">Stranica nije pronađena</h2>
      <p className="mt-2 text-muted-foreground">
        Stranica koju tražite ne postoji ili je premeštena.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Nazad na početnu</Link>
      </Button>
    </div>
  )
}
