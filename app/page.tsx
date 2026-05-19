import { redirect } from 'next/navigation'

// In mock mode: go straight to employee dashboard.
export default function RootPage() {
  redirect('/employee/dashboard')
}


