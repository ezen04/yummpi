import * as React from 'react';
import { type LucideProps } from 'lucide-react';

export {
  Home,
  Bell,
  User,
  Users,
  CalendarDays as Calendar,
  Clock,
  MapPin,
  Globe,
  Star,
  Bookmark,
  Wallet as Coins,
  Send,
  Receipt,
  CreditCard,
  Plus,
  X as Close,
  Search,
  Share2 as Share,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  ArrowUpRight,
  Pencil,
  Camera,
  Check,
  Sparkles,
  Flame,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  Copy,
  Trash2 as Trash,
  RefreshCw as Refresh,
  FileText,
  Crown,
  Locate,
} from 'lucide-react';

export function YIcon({
  icon: Icon,
  size = 20,
  className,
  ...props
}: {
  icon: React.ComponentType<LucideProps>;
  size?: 16 | 20 | 24;
} & Omit<LucideProps, 'size'>) {
  return (
    <Icon
      size={size}
      strokeWidth={1.5}
      className={className}
      aria-hidden
      {...props}
    />
  );
}
