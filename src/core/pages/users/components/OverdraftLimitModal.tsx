import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { IconWallet, IconAlertCircle, IconCheck, IconLoader2 } from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

interface OverdraftLimitModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
}

export function OverdraftLimitModal({ isOpen, onClose, userId }: OverdraftLimitModalProps) {
  const { t } = useTranslation()
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [limit, setLimit] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user tenants directly from the Admin route
  useEffect(() => {
    let isMounted = true

    const fetchTenants = async () => {
      if (!userId || !isOpen) return

      try {
        setIsLoading(true)
        
        const response = await ThunderSDK.users.getUserTenants({
          params: { id: userId }
        })
        
        if (isMounted) {
          // The backend route directly returns the array of { _id, name } objects
          setTenants(response || [])
        }
      } catch (error: any) {
        console.error("Failed to fetch tenants:", error)
        toast.error("Fetch tenants error: " + (error?.message || "Unknown error"))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchTenants()

    return () => {
      isMounted = false
    }
  }, [userId, isOpen])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTenantId("")
      setLimit(0)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !selectedTenantId || limit < 0) return

    try {
      setIsSubmitting(true)
      await ThunderSDK.wallets.updateOverdraftLimit({
        body: {
          userId,
          tenantId: selectedTenantId,
          limit,
        },
      })
      toast.success(t("Overdraft limit updated successfully!"))
      onClose()
    } catch (error: any) {
      toast.error(error?.message || t("Failed to update overdraft limit"))
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconWallet className="h-5 w-5" />
            </div>
            {t("Add Overdraft Limit")}
          </SheetTitle>
          <SheetDescription className="pt-2">
            {t("Select a tenant and set an overdraft limit for this user's wallet. This allows them to spend beyond their current balance.")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tenant-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Tenant")}
              </Label>
              <Select
                value={selectedTenantId}
                onValueChange={(val) => setSelectedTenantId(val || "")}
                disabled={isLoading || tenants.length === 0}
              >
                <SelectTrigger id="tenant-select" className="w-full bg-background transition-colors hover:bg-accent/50">
                  <SelectValue placeholder={isLoading ? t("Loading tenants...") : t("Select a tenant")}>
                    {selectedTenantId 
                      ? tenants.find((t: any) => t._id === selectedTenantId)?.name 
                      : (isLoading ? t("Loading tenants...") : t("Select a tenant"))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant: any) => (
                    <SelectItem key={tenant._id} value={tenant._id} className="cursor-pointer">
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenants.length === 0 && !isLoading && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <IconAlertCircle className="h-3 w-3" />
                  {t("This user does not belong to any tenants.")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Label htmlFor="limit-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Overdraft Limit Amount")}
              </Label>
              <div className="relative">
                {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                 
                </span> */}
                <Input
                  id="limit-input"
                  type="number"
                  min="0"
                  step="any"
                  value={limit}
                  onChange={(e) => setLimit(parseFloat(e.target.value) || 0)}
                  className="pl-8 bg-background text-lg font-medium transition-colors hover:bg-accent/50 focus:bg-background"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Maximum allowed negative balance.")}
              </p>
            </div>
          </div>

          <SheetFooter className="mt-auto sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedTenantId || limit < 0} className="w-full sm:w-auto gap-2 shadow-md">
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  {t("Saving...")}
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  {t("Save Limit")}
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
