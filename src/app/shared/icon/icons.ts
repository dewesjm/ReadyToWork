/*
 * The Lucide icons (https://lucide.dev, ISC License) the app uses, by the names the config
 * tables and templates use. To add one, import it from lucide-angular and list it here.
 */
import {
  ArrowLeft,
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  ExternalLink,
  Funnel,
  GraduationCap,
  History,
  Info,
  KeyRound,
  Laptop,
  LucideIconData,
  Network,
  OctagonX,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Usb,
  Wrench,
  X,
} from 'lucide-angular';

export const ICONS: Record<string, LucideIconData> = {
  // Statuses (STATUS_META in src/core/config.ts)
  'circle-x': CircleX,
  'triangle-alert': TriangleAlert,
  'circle-check': CircleCheck,

  // Categories (DEFAULT_CONFIG in src/core/config.ts)
  network: Network,
  'key-round': KeyRound,
  laptop: Laptop,
  'graduation-cap': GraduationCap,
  'shield-check': ShieldCheck,
  award: Award,
  usb: Usb,
  wrench: Wrench,

  // Controls and notices
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'external-link': ExternalLink,
  'chevrons-up-down': ChevronsUpDown,
  'chevrons-down-up': ChevronsDownUp,
  search: Search,
  funnel: Funnel,
  x: X,
  check: Check,
  info: Info,
  'octagon-x': OctagonX,
  clock: Clock,
  plus: Plus,
  'arrow-left': ArrowLeft,
  download: Download,
  upload: Upload,
  history: History,
  'rotate-ccw': RotateCcw,
};
