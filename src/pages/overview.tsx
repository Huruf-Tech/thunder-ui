import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import Logo from "/logo.png"
import { appName } from "@/lib/utils"

export default function Overview() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
        </EmptyMedia>
        <EmptyTitle>
          Welcome to <span className="capitalize text-base font-semibold">{appName()}</span>
        </EmptyTitle>
        <EmptyDescription>
          You can customize this page to display relevant information about your
          application.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>Get Started</Button>
      </EmptyContent>
    </Empty>
  )
}
