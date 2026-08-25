import { apiFetch } from './client'

export async function fetchPatientDashboard() {
  return apiFetch('/dashboard/patient')
}

export async function fetchProviderDashboard() {
  return apiFetch('/dashboard/provider')
}
