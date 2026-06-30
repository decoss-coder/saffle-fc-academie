type CheckoutParams = {
  amount: number;
  clientReference: string;
  successUrl: string;
  errorUrl: string;
};

type CheckoutResult = {
  sessionId: string;
  launchUrl: string;
};

export async function createWaveCheckout(
  params: CheckoutParams,
): Promise<CheckoutResult> {
  const apiKey = process.env.WAVE_API_KEY;
  const amount = String(Math.round(params.amount));

  if (!apiKey) {
    const mockId = `mock-${params.clientReference}`;
    return {
      sessionId: mockId,
      launchUrl: `https://pay.wave.com/c/${mockId}`,
    };
  }

  const response = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "XOF",
      client_reference: params.clientReference,
      success_url: params.successUrl,
      error_url: params.errorUrl,
    }),
  });

  if (!response.ok) {
    throw new Error("wave_checkout_failed");
  }

  const data = (await response.json()) as {
    id: string;
    wave_launch_url: string;
  };

  return {
    sessionId: data.id,
    launchUrl: data.wave_launch_url,
  };
}

export function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
