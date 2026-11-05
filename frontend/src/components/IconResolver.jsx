import React from 'react'
import {
  Code,
  Server,
  Database,
  Layout,
  Globe,
  Layers,
  Cpu,
  Shield,
  Sparkles,
  Terminal,
  Smartphone,
  Cloud,
  FolderGit2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Send,
  User,
  Lock,
  Activity,
  CheckCircle,
  BarChart3,
  Wrench,
  Settings,
  Search,
  Check,
  AlertCircle,
  Info,
  ChevronRight,
  Menu,
  X,
  LogIn,
  LogOut,
  Loader2,
  Boxes,
} from 'lucide-react'

const iconMap = {
  // Database seed icons
  Code,
  Server,
  Database,
  Layout,
  // Common tech & system icons
  Globe,
  Layers,
  Cpu,
  Shield,
  Sparkles,
  Terminal,
  Smartphone,
  Cloud,
  FolderGit2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Send,
  User,
  Lock,
  Activity,
  CheckCircle,
  BarChart3,
  Wrench,
  Settings,
  Search,
  Check,
  AlertCircle,
  Info,
  ChevronRight,
  Menu,
  X,
  LogIn,
  LogOut,
  Loader2,
  Boxes,
}

export default function IconResolver({
  name,
  className = 'w-6 h-6',
  fallback = 'Code',
  ...props
}) {
  if (!name) {
    const FallbackIcon = iconMap[fallback] || Code
    return <FallbackIcon className={className} {...props} />
  }

  // Normalize: Trim and capitalize first letter if needed
  const normalizedKey =
    name.charAt(0).toUpperCase() + name.slice(1).trim()

  const IconComponent = iconMap[normalizedKey] || iconMap[name] || iconMap[fallback] || Code

  return <IconComponent className={className} {...props} />
}
