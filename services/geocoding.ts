
export const getAddressFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    const data = await response.json();
    return data.display_name || 'Dirección no encontrada';
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return 'Error al obtener la dirección';
  }
};
