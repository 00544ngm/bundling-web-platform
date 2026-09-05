"use client";

import { FileText, History, KeyRound, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "工作台", icon: LayoutDashboard },
  { href: "/results", label: "结果展示", icon: FileText },
  { href: "/history", label: "历史记录", icon: History },
  { href: "/settings/api", label: "API 设置", icon: KeyRound },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="desktop-sidebar"
      className="hidden w-56 shrink-0 border-r border-white/10 bg-navigation text-navigation-foreground md:flex md:flex-col"
    >
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <span className="whitespace-nowrap text-sm font-semibold">组合选品控制台</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === item.href
                ? "bg-white/10 text-navigation-foreground"
                : "text-navigation-foreground/70 hover:bg-white/10 hover:text-navigation-foreground"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="overflow-hidden whitespace-nowrap">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
