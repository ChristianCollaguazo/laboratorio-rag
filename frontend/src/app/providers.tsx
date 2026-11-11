import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { LaboratoryProvider } from '../features/laboratory/state'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 5_000 }, mutations: { retry: false } },
  }))
  return <QueryClientProvider client={queryClient}><LaboratoryProvider>{children}</LaboratoryProvider></QueryClientProvider>
}
