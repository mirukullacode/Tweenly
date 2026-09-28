import {
  ArrowDownUp,
  BellRing,
  ChartColumn,
  FileText,
  Hand,
  Image,
  LayoutGrid,
  MousePointerClick,
  Navigation,
  PanelsTopLeft,
  TextCursorInput,
  Type,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import type { Category } from "@/lib/docs"

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Text: Type,
  Buttons: MousePointerClick,
  Interactive: Hand,
  Navigation: Navigation,
  Forms: TextCursorInput,
  Feedback: BellRing,
  Charts: ChartColumn,
  Media: Image,
  Scroll: ArrowDownUp,
  Layout: LayoutGrid,
  Cards: WalletCards,
  Sections: PanelsTopLeft,
}

export function CategoryIcon({ group, className }: { group: string; className?: string }) {
  const Icon = CATEGORY_ICONS[group as Category] ?? FileText
  return <Icon className={className} />
}
