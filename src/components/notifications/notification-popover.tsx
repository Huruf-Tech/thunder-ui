import React from "react"
import { useNavigate, useParams } from "react-router"
import {
  IconBell,
  IconPackage,
  IconCash,
  IconTruckDelivery,
  IconAlertCircle,
  IconInfoCircle,
  IconCheck,
} from "@tabler/icons-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "order" | "payment" | "delivery" | "alert" | "info"

export type TNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
}

// ── Static data ──────────────────────────────────────────────────────────────

const NOTIFICATIONS: TNotification[] = [
  {
    id: "1",
    type: "order",
    title: "New order received",
    message: "Order #1042 has been placed by Ahmed.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "payment",
    title: "Payment confirmed",
    message: "Payment of 250 LYD received for order #1039.",
    time: "15 min ago",
    read: false,
  },
  {
    id: "3",
    type: "delivery",
    title: "Order delivered",
    message: "Order #1035 was delivered successfully.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "4",
    type: "alert",
    title: "Low stock warning",
    message: "Product \"Wireless Mouse\" is running low (3 left).",
    time: "3 hr ago",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "System update",
    message: "A new version is available. Refresh to update.",
    time: "5 hr ago",
    read: true,
  },
  {
    id: "6",
    type: "order",
    title: "Order cancelled",
    message: "Order #1030 was cancelled by the customer.",
    time: "1 day ago",
    read: true,
  },
]

// ── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof IconBell; bg: string; color: string }
> = {
  order: { icon: IconPackage, bg: "bg-primary/10", color: "text-primary" },
  payment: { icon: IconCash, bg: "bg-success/10", color: "text-success" },
  delivery: { icon: IconTruckDelivery, bg: "bg-blue-500/10", color: "text-blue-500" },
  alert: { icon: IconAlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
  info: { icon: IconInfoCircle, bg: "bg-muted", color: "text-muted-foreground" },
}

// ── Component ────────────────────────────────────────────────────────────────

export function NotificationPopover() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenant } = useParams()
  const [notifications, setNotifications] = React.useState(NOTIFICATIONS)
  const [open, setOpen] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 shrink-0 sm:size-9"
            aria-label={t("Notifications")}
          >
            <IconBell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 sm:w-[400px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {t("Notifications")}
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="h-5 rounded-full px-1.5 text-[10px] font-bold"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <IconCheck className="me-1 size-3" />
              {t("Mark all read")}
            </Button>
          )}
        </div>

        <Separator />

        {/* List */}
        <ScrollArea className="max-h-80">
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <IconBell className="mb-2 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {t("No notifications")}
                </p>
              </div>
            ) : (
              notifications.slice(0, 3).map((n) => {
                const cfg = TYPE_CONFIG[n.type]
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/50",
                      !n.read && "bg-primary/[0.03]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        cfg.bg,
                        cfg.color
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            !n.read
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/80"
                          )}
                        >
                          {t(n.title)}
                        </p>
                        {!n.read && (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {n.time}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOpen(false)
              navigate(`/${tenant}/notifications`)
            }}
          >
            {t("View all notifications")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
