import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo as CameraPhoto } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { GeolocationService, LocationData } from './geolocation'; 

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';

  constructor(private geolocationService: GeolocationService) {
    this.loadSavedPhotos();
  }

  async addNewToGallery() {
    try {
      
      // Obtener ubicación GPS
      let location: LocationData;
      try {
        location = await this.geolocationService.getCurrentLocation();
      } catch (locationError) {
        console.warn('⚠️ No se pudo obtener ubicación, continuando sin ella...');
        location = {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: Date.now()
        };
      }

      // Tomar la foto con la cámara
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90
      });

      // Guardar la foto en el dispositivo
      const savedImageFile = await this.savePicture(capturedPhoto, location);
      
      // Agregar al inicio de la galería
      this.photos.unshift(savedImageFile);

      // Guardar ubicación en archivo de texto
      await this.geolocationService.saveLocationToFile(savedImageFile);

      // Guardar lista de fotos en Preferences
      await this.savePhotosList();

      return savedImageFile;

    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deletePhoto(photo: UserPhoto, position: number) {
    try {
      // 1. Eliminar archivo físico del dispositivo
      await Filesystem.deleteFile({
        path: photo.filepath,
        directory: Directory.Data
      });

      // 2. Remover del array
      this.photos.splice(position, 1);

      // 3. Actualizar lista guardada
      await this.savePhotosList();

      console.log('✅ Foto eliminada correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error eliminando foto:', error);
      throw error;
    }
  }

  private async savePicture(photo: CameraPhoto, location: LocationData) {
    const base64Data = await this.readAsBase64(photo);
    const fileName = `photo_${Date.now()}.jpeg`;
    
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filepath: fileName,
      webviewPath: photo.webPath,
      savedUri: savedFile.uri,
      location: location, 
      timestamp: new Date()
    };
  }

  // 📂 Cargar fotos guardadas al iniciar la app
  async loadSavedPhotos() {
    const photoList = await Preferences.get({ key: this.PHOTO_STORAGE });
    const photos = photoList.value ? JSON.parse(photoList.value) : [];

    if (!photos || photos.length === 0) {
      return;
    }

    for (let photo of photos) {
      try {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        
        if (!photo.location) {
          photo.location = {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            timestamp: photo.timestamp || Date.now()
          };
        }
      } catch (error) {
        console.error(`Error cargando foto ${photo.filepath}:`, error);
        continue;
      }
    }

    this.photos = photos;
  }

  //  Guardar lista de fotos en Preferences
  private async savePhotosList() {
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  // 🔄 Convertir foto a Base64
  private async readAsBase64(photo: CameraPhoto) {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    return await this.convertBlobToBase64(blob) as string;
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  savedUri?: string;
  location: LocationData; 
  timestamp?: Date;
}