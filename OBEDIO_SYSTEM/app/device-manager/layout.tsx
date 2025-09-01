import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Device Manager | Obedio System',
  description: 'Manage and configure device settings for the Obedio system',
}

export default function DeviceManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>{children}</div>
  )
}