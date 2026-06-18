'use client';

import * as React from 'react';
import {
  Bell, Home, Users, MapPin, Calendar, Check, Plus, Close,
  ChevronLeft, ChevronRight, ChevronDown, Settings, Share,
  Wallet as WalletIcon, Pencil, Camera, ArrowUpRight, Sparkles,
  Flame, Send, Search, User, Receipt, Star, Bookmark,
  MoreVertical, LogOut, Eye, Clock,
} from '@yummpi/ui';

// 얌피 도메인명 → lucide 아이콘 매핑
const ICON_MAP = {
  bell:            Bell,
  home:            Home,
  users:           Users,
  'map-pin':       MapPin,
  calendar:        Calendar,
  check:           Check,
  plus:            Plus,
  x:               Close,
  'chevron-left':  ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down':  ChevronDown,
  settings:        Settings,
  share:           Share,
  wallet:          WalletIcon,
  pen:             Pencil,
  camera:          Camera,
  'arrow-up-right':ArrowUpRight,
  sparkles:        Sparkles,
  flame:           Flame,
  send:            Send,
  search:          Search,
  user:            User,
  receipt:         Receipt,
  star:            Star,
  bookmark:        Bookmark,
  'more-vertical': MoreVertical,
  logout:          LogOut,
  eye:             Eye,
  clock:           Clock,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.5 }: IconProps) {
  const LucideIcon = ICON_MAP[name];
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}
