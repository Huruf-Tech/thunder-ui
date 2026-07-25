import React from "react"
import {
  IconBell,
  IconBellOff,
  IconPackage,
  IconCash,
  IconTruckDelivery,
  IconAlertCircle,
  IconInfoCircle,
  IconCheck,
  IconChecks,
  IconDots,
  IconTrash,
  // IconFilter,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Container } from "@/core/custom/Container"

type NotificationType = "order" | "payment" | "delivery" | "alert" | "info"

type TNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  date: string
  read: boolean
}


const INITIAL_NOTIFICATIONS: TNotification[] = [
  {
    id: "1",
    type: "order",
    title: "New order received",
    message: "Order #1042 has been placed by Ahmed. Contains 3 items with a total of 450 LYD.",
    time: "2 min ago",
    date: "Today",
    read: false,
  },
  {
    id: "2",
    type: "payment",
    title: "Payment confirmed",
    message: "Payment of 250 LYD received for order #1039. Transaction verified successfully.",
    time: "15 min ago",
    date: "Today",
    read: false,
  },
  {
    id: "3",
    type: "delivery",
    title: "Order delivered",
    message: "Order #1035 was delivered successfully to the customer at Tripoli.",
    time: "1 hr ago",
    date: "Today",
    read: false,
  },
  {
    id: "4",
    type: "alert",
    title: "Low stock warning",
    message: 'Product "Wireless Mouse" is running low on inventory. Only 3 units remaining.',
    time: "3 hr ago",
    date: "Today",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "System update available",
    message: "A new version of the platform is available. Refresh your browser to apply the latest updates.",
    time: "5 hr ago",
    date: "Today",
    read: true,
  }
]


const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof IconBell; bg: string; color: string; label: string }
> = {
  order: { icon: IconPackage, bg: "bg-primary/10", color: "text-primary", label: "Orders" },
  payment: { icon: IconCash, bg: "bg-success/10", color: "text-success", label: "Payments" },
  delivery: { icon: IconTruckDelivery, bg: "bg-blue-500/10", color: "text-blue-500", label: "Deliveries" },
  alert: { icon: IconAlertCircle, bg: "bg-destructive/10", color: "text-destructive", label: "Alerts" },
  info: { icon: IconInfoCircle, bg: "bg-muted", color: "text-muted-foreground", label: "Info" },
}


export default function Notifications() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS)
  const [activeTab, setActiveTab] = React.useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = React.useMemo(() => {
    if (activeTab === "all") return notifications
    if (activeTab === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === activeTab)
  }, [notifications, activeTab])

  const grouped = React.useMemo(() => {
    const groups: Record<string, TNotification[]> = {}
    for (const n of filtered) {
      ;(groups[n.date] ??= []).push(n)
    }
    return Object.entries(groups)
  }, [filtered])

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )

  const deleteNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))

  const clearAll = () => setNotifications([])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
      <Container className="relative flex w-full flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <IconBell className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {t("Notifications")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? t("{{count}} unread notifications", { count: unreadCount })
                  : t("You're all caught up")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={markAllRead}
              >
                <IconChecks className="size-3.5" />
                {t("Mark all read")}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <IconTrash className="size-3.5" />
                {t("Clear all")}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
            {[
              { value: "all", label: t("All") },
              { value: "unread", label: t("Unread"), count: unreadCount }
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {tab.label}
                {"count" in tab && tab.count! > 0 && (
                  <Badge
                    variant="default"
                    className="h-4 rounded-full px-1 text-[10px]"
                  >
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <IconBellOff className="size-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {t("No notifications")}
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {activeTab === "unread"
                  ? t("You have no unread notifications.")
                  : t("There are no notifications to display.")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Grouped notifications */}
        {grouped.map(([date, items]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(date)}
              </h2>
              <Separator className="flex-1" />
            </div>

            <div className="flex flex-col gap-1.5">
              {items.map((n) => {
                const cfg = TYPE_CONFIG[n.type]
                const Icon = cfg.icon
                return (
                  <Card
                    key={n.id}
                    className={cn(
                      "group cursor-pointer transition-all duration-150 hover:shadow-sm p-1",
                      !n.read && "border-primary/20 bg-primary/2"
                    )}
                    onClick={() => markRead(n.id)}
                  >
                    <CardContent className="flex items-start gap-3 p-1">
                      <span
                        className={cn(
                          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
                          cfg.bg,
                          cfg.color
                        )}
                      >
                        <Icon className="size-4 sm:size-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "truncate text-xs",
                                  !n.read
                                    ? "font-semibold text-foreground"
                                    : "font-medium text-foreground/80"
                                )}
                              >
                                {t(n.title)}
                              </p>
                              {!n.read && (
                                <span className="size-2 shrink-0 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {n.message}
                            </p>
                            <p className="mt-1.5 text-xs text-muted-foreground/60">
                              {n.time}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconDots className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-40">
                              {!n.read && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markRead(n.id)
                                  }}
                                >
                                  <IconCheck className="size-4" />
                                  {t("Mark as read")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(n.id)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <IconTrash className="size-4" />
                                {t("Delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

      </Container>
    </div>
  )
}
