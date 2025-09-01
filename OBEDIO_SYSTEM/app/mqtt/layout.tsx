import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MQTT Management - Obedio Admin',
  description: 'MQTT device management, traffic monitoring, and security configuration',
}

export default function MQTTLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container py-6 space-y-6">
      {children}
    </div>
  )
}