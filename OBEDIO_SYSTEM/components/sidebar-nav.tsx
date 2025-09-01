'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Smartphone,
  Wrench,
  MapPin,
  Bell,
  FileText,
  LifeBuoy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function SidebarNav() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [newRequestsCount, setNewRequestsCount] = useState(0)

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Guests',
      href: '/guests',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Crew',
      href: '/crew',
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      title: 'Device Manager',
      href: '/device-manager',
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      title: 'MQTT',
      href: '/mqtt',
      icon: <Wifi className="h-5 w-5" />,
    },
    {
      title: 'Locations',
      href: '/locations',
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      title: 'Service Requests',
      href: '/service-requests',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: 'Logs',
      href: '/logs',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Support',
      href: '/support',
      icon: <LifeBuoy className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div
      className={cn(
        'relative z-30 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300',
        isCollapsed ? 'w-[70px]' : 'w-[280px]'
      )}
      onMouseEnter={() => !isMobile && isCollapsed && setIsCollapsed(false)}
      onMouseLeave={() => !isMobile && !isCollapsed && setIsCollapsed(true)}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-100 p-4">
        {!isCollapsed && (
          <div className="text-xl font-semibold text-indigo-600">Obedio</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn('text-slate-500', isCollapsed ? 'mx-auto' : 'ml-auto')}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <div className="relative mr-3 flex-shrink-0">
                {item.icon}
                {item.title === 'Service Requests' && newRequestsCount > 0 && (
                  <Badge className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center bg-rose-500 p-0 text-[10px] text-white">
                    {newRequestsCount}
                  </Badge>
                )}
              </div>
              {!isCollapsed && (
                <span className="truncate">
                  {item.title}
                  {item.title === 'Service Requests' && newRequestsCount > 0 && (
                    <Badge className="ml-2 bg-rose-500 text-white">{newRequestsCount}</Badge>
                  )}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/logout"
          className={cn(
            'flex items-center rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && <span>Logout</span>}
        </Link>
      </div>
    </div>
  )
}
