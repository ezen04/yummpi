export const placeKeys = {
  recommendations: (meetingId: string, lat: string, lng: string) =>
    ['place', 'recommendations', meetingId, lat, lng] as const,
  search: (meetingId: string, query: string) =>
    ['place', 'search', meetingId, query] as const,
  optimalPoint: (meetingId: string) =>
    ['place', 'optimal-point', meetingId] as const,
};
