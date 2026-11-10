// Helpers to read client IP + device information from an Express request.

const getClientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  let ip = Array.isArray(fwd) ? fwd[0] : (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '');
  if (!ip) ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || req.ip || '';
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip === '::1') ip = '127.0.0.1';
  return String(ip).slice(0, 64) || null;
};

const parseUserAgent = (ua = '') => {
  const s = String(ua || '');
  let browser = 'Unknown';
  if (/Edg(e|A|iOS)?\//i.test(s)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(s)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(s)) browser = 'Samsung Internet';
  else if (/Firefox|FxiOS/i.test(s)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(s)) browser = 'Chrome';
  else if (/Safari/i.test(s)) browser = 'Safari';
  else if (/curl|Postman|insomnia|axios|node-fetch/i.test(s)) browser = 'API client';

  let os = 'Unknown';
  if (/Windows NT 10/i.test(s)) os = 'Windows 10/11';
  else if (/Windows/i.test(s)) os = 'Windows';
  else if (/Android/i.test(s)) os = 'Android';
  else if (/iPhone|iPad|iPod|iOS/i.test(s)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(s)) os = 'macOS';
  else if (/CrOS/i.test(s)) os = 'ChromeOS';
  else if (/Linux/i.test(s)) os = 'Linux';

  let device = 'Desktop';
  if (/iPad|Tablet/i.test(s)) device = 'Tablet';
  else if (/Mobi|iPhone|Android/i.test(s)) device = 'Mobile';
  else if (/curl|Postman|insomnia|axios|node-fetch/i.test(s)) device = 'API client';

  return { browser, os, device };
};

module.exports = { getClientIp, parseUserAgent };

