const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

export const validateDiscountCode = async ({ code, phone, totalPrice }) => {
  const res = await fetch(`${getBaseUrl()}/marketing/validate-discount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, phone, totalPrice }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Invalid discount code');
  return data;
};

export const submitSmsSignup = async (payload) => {
  const res = await fetch(`${getBaseUrl()}/marketing/sms-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  return data;
};

export { getBaseUrl };
