// import { APIGatewayProxyHandler } from 'aws-lambda';
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';

// Shared city list – you can add more
const CITY_MAP: Record<string, { lat: number; lon: number; timezone: string }> = {
  Toronto:   { lat: 43.65107, lon: -79.347015, timezone: 'America/Toronto' },
  London:    { lat: 51.5074,  lon: -0.1278,    timezone: 'Europe/London' },
  'New York':{ lat: 40.7128,  lon: -74.0060,   timezone: 'America/New_York' },
  Lagos:     { lat: 6.5244,   lon: 3.3792,     timezone: 'Africa/Lagos' },
  Riyadh:    { lat: 24.7136,  lon: 46.6753,    timezone: 'Asia/Riyadh' },
};

export const handler = async (event: any) => {
  try {
    const qs = event.queryStringParameters || {};
    const env = (qs.env || 'PROD').toUpperCase();  // TEST or PROD
    const city = qs.city || 'New York';
    const dateStr = qs.date;

    const cityInfo = CITY_MAP[city];
    if (!cityInfo) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `City ${city} not found`, env }),
      };
    }

    const { lat, lon, timezone } = cityInfo;
    const date = dateStr ? new Date(dateStr) : new Date();

    // ISNA / North America = 15°/15° for daily prayers
    const isnaParams = CalculationMethod.NorthAmerica();
    const coords = new Coordinates(lat, lon);
    const isnaTimes = new PrayerTimes(coords, date, isnaParams);

    // MWL = fasting times
    const mwlParams = CalculationMethod.MuslimWorldLeague();
    const mwlTimes = new PrayerTimes(coords, date, mwlParams);

    const toIso = (d: Date) => d.toISOString();

    if (env === 'TEST') {
      console.log('[TEST] request', { city, date: date.toISOString(), timezone });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        env,
        date: date.toISOString().split('T')[0],
        timezone,
        daily_isna: [
          { name: 'Fajr',    time: toIso(isnaTimes.fajr) },
          { name: 'Sunrise', time: toIso(isnaTimes.sunrise) },
          { name: 'Dhuhr',   time: toIso(isnaTimes.dhuhr) },
          { name: 'Asr',     time: toIso(isnaTimes.asr) },
          { name: 'Maghrib', time: toIso(isnaTimes.maghrib) },
          { name: 'Isha',    time: toIso(isnaTimes.isha) },
        ],
        fasting_mwl: {
          suhoorEnd: toIso(mwlTimes.fajr),
          iftar:     toIso(mwlTimes.maghrib),
        },
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
