import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/routes')({
  component: RoutesComponent,
})

function RoutesComponent() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">안전 경로 목록</h1>
    </div>
  )
}
