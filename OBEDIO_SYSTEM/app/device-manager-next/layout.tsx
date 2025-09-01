export default function DeviceManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  )
}