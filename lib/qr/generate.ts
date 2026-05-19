import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

export function generateQRToken(): string {
  return uuidv4()
}

export async function generateQRDataURL(
  token: string,
  baseUrl: string
): Promise<string> {
  const scanUrl = `${baseUrl}/scan/${token}`
  return QRCode.toDataURL(scanUrl, {
    width: 360,
    margin: 2,
    color: {
      dark: '#09090b',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })
}

/** Returns a Date that is `durationSeconds` from now (default 20 s). */
export function getTokenExpiry(durationSeconds = 20): Date {
  const expiry = new Date()
  expiry.setSeconds(expiry.getSeconds() + durationSeconds)
  return expiry
}
