import React from "react"
import {
  Virtuoso,
  type StateSnapshot,
  type VirtuosoHandle,
} from "react-virtuoso"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Container } from "@/core/custom/Container"

const scrollStateCache = new Map<string, StateSnapshot>()

export function AttendanceCard({ name, data, fetcher }: any) {
  const virtuosoRef = React.useRef<VirtuosoHandle>(null)

  React.useEffect(() => {
    fetcher?.({})
  }, [fetcher])

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%"
      data={data}
      computeItemKey={(_, item) => item._id}
      restoreStateFrom={scrollStateCache.get(name)}
      rangeChanged={() => {
        virtuosoRef.current?.getState((state) => {
          if (state.ranges.length > 0) {
            scrollStateCache.set(name, state)
          }
        })
      }}
      itemContent={(_, v) => (
        <Container key={v._id} className="flex h-full w-full flex-col gap-3">
          <Card className="cursor-pointer">
            <CardHeader>{v.employeeCode}</CardHeader>
            <CardContent>
              <p>{v.punchAt}</p>
              <p>{v.timezone}</p>
            </CardContent>
          </Card>
        </Container>
      )}
    />
  )
}
