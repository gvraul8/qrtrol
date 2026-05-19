export interface QRSession {
  id: string
  company_id: string
  token: string
  expires_at: string
  used: boolean
  created_at: string
}

export interface QRGenerateRequest {
  duration_seconds?: number
}

export interface QRValidateRequest {
  token: string
  type: 'entry' | 'exit'
}

export interface QRValidateResponse {
  success: boolean
  message: string
  entry_id?: string
  user_name?: string
}
