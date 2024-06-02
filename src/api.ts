const HOST = 'https://api.haitian.community/v1'
const uri = (path: string, params: Record<string, string> | null = null): string => {
  const url = `${HOST}/${path}`;
  if (params) return `${url}?${new URLSearchParams(params)}`;
  
  return url;
};

type GeocodeParams = { lat: number; lng: number; };
export const geocode = async ({ lat, lng }: GeocodeParams): Promise<any> => {
  try {
    console.log('fetching region for: ', [lat, lng]);
    const res = await fetch(uri('map/location', { latitude: lat.toString(), longitude: lng.toString() }));
    return await res.json();
  } catch (error) {
    console.error("Failed to reverse geocode coordinates", { lat, lng}, error);
    return null;
  }
}