import React from "react"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Container } from "./container"

export function AttendanceCard({ data, fetcher }: any) {
  React.useEffect(() => {
    fetcher?.({})
  }, [fetcher])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
      <Container className="relative flex w-full flex-col gap-3">
        {data.map((v: any) => {
          return (
            <Card key={v._id}>
              <CardHeader>{v.employeeCode}</CardHeader>
              <CardContent>
                <p>{v.punchAt}</p>
                <p>{v.timezone}</p>
              </CardContent>
            </Card>
          )
        })}
      </Container>
    </div>
  )
}
