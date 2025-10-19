import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Solo lo necesario para Google Maps
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  // Obtener ubicacion actual del dispositivo
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 3000
      });

      const location: LocationData = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: coordinates.timestamp
      };

      return location;

    } catch (error) {
      console.error('Error obteniendo ubicacion:', error);
      throw new Error('No se pudo obtener la ubicacion');
    }
  }

  // Generar URL de Google Maps con las coordenadas
  generateGoogleMapsLink(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  // Guardar datos de ubicacion en archivo de texto
  async saveLocationToFile(photoData: any): Promise<void> {
    try {
      const timestamp = new Date().toLocaleString('es-EC');
      const content = `
FOTO CON UBICACION
==================
Fecha: ${timestamp}
Archivo: ${photoData.filepath}
Latitud: ${photoData.location.latitude}
Longitud: ${photoData.location.longitude}
Precision: ${photoData.location.accuracy} metros
Google Maps: ${this.generateGoogleMapsLink(photoData.location.latitude, photoData.location.longitude)}

----------------------------------------
`;

      await this.appendToTextFile('ubicaciones.txt', content);
      console.log('Ubicacion guardada en archivo de texto');

    } catch (error) {
      console.error('Error guardando ubicacion en archivo:', error);
    }
  }

  // Agregar contenido al archivo de texto (o crearlo si no existe)
  private async appendToTextFile(filename: string, content: string): Promise<void> {
    try {
      // Intentar leer el archivo existente
      try {
        const existingFile = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents
        });
        
        // Si existe, agregar al contenido existente
        content = existingFile.data + content;
      } catch (readError) {
        // Si no existe, crear uno nuevo
        console.log('Creando nuevo archivo de ubicaciones');
      }

      // Escribir o sobrescribir archivo
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        recursive: true
      });

    } catch (error) {
      console.error('Error manipulando archivo:', error);
      throw error;
    }
  }
}

export { Geolocation };