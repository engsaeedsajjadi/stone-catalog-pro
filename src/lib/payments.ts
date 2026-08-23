/**
 * ایجاد پرداخت زرین‌پال
 */
export async function createZarinpalPayment(
  orderId: string,
  amount: number,
  callback: string,
  description: string
): Promise<{ authority: string; url: string }> {
  const merchant = process.env.ZARINPAL_MERCHANT_ID

  if (!merchant) {
    throw new Error('ZARINPAL_MERCHANT_ID is not configured')
  }

  const response = await fetch(
    'https://payment.zarinpal.com/pg/v4/payment/request.json',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount,
        currency: 'IRT',
        description,
        callback_url: callback,
        metadata: { order_id: orderId },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Zarinpal request ${response.status}`)
  }

  const data = await response.json()
  const code = data.data?.code

  if (code !== 100) {
    throw new Error(data.errors?.message || `Zarinpal error ${code}`)
  }

  return {
    authority: data.data.authority,
    url: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
  }
}

/**
 * تایید پرداخت زرین‌پال
 */
export async function verifyZarinpalPayment(
  amount: number,
  authority: string
): Promise<{ ref_id: number; code: number }> {
  const merchant = process.env.ZARINPAL_MERCHANT_ID

  if (!merchant) {
    throw new Error('ZARINPAL_MERCHANT_ID is not configured')
  }

  const response = await fetch(
    'https://payment.zarinpal.com/pg/v4/payment/verify.json',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount,
        authority,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Zarinpal verify ${response.status}`)
  }

  const data = await response.json()

  if (![100, 101].includes(data.data?.code)) {
    throw new Error(
      data.errors?.message || `Zarinpal verification failed ${data.data?.code}`
    )
  }

  return data.data
}
