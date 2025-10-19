**Documentación Técnica - Aplicación de Galería con Geolocalización**

**Plugins de Capacitor necesarios**

- @capacitor/camera
- @capacitor/geolocation
- @capacitor/filesystem
- @capacitor/preferences
- @capacitor/browser

**Configuración Inicial**

**Paso 1: Crear el proyecto Ionic**

ionic start photo-gallery blank --type=angular

cd photo-gallery

**Paso 2: Instalar plugins de Capacitor**

npm install @capacitor/camera @capacitor/geolocation @capacitor/filesystem @capacitor/preferences @capacitor/browser

**Paso 3: Sincronizar con plataforma nativa**

ionic capacitor add android

ionic capacitor sync

**Paso 4: Configurar permisos en Android**

Editar android/app/src/main/AndroidManifest.xml y agregar:

&lt;uses-permission android:name="android.permission.CAMERA" /&gt;

&lt;uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/&gt;

&lt;uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/&gt;

&lt;uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" /&gt;

&lt;uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" /&gt;

&lt;uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" /&gt;

**Implementación de la Cámara**

**Paso 1: Crear el servicio de fotografía**

Crear archivo src/app/services/photo.service.ts

**Paso 2: Importar dependencias necesarias**

import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo as CameraPhoto } from '@capacitor/camera';

import { Filesystem, Directory } from '@capacitor/filesystem';

import { Preferences } from '@capacitor/preferences';

**Explicación de imports**:

- Camera: Acceso a la cámara del dispositivo
- CameraResultType: Define el formato de retorno (Uri, Base64, etc.)
- CameraSource: Fuente de la imagen (cámara, galería, etc.)
- Filesystem: Para leer y escribir archivos en el dispositivo
- Preferences: Almacenamiento persistente tipo clave-valor

**Paso 3: Definir la estructura de datos**

export interface UserPhoto {

filepath: string; // Nombre del archivo

webviewPath?: string; // URL para mostrar en HTML

savedUri?: string; // URI del sistema de archivos

location: LocationData; // Datos de ubicación GPS

timestamp?: Date; // Fecha y hora de captura

}

**Paso 4: Implementar método de captura**

async addNewToGallery() {

// Tomar foto con la cámara

const capturedPhoto = await Camera.getPhoto({

resultType: CameraResultType.Uri, // Retorna una URI del archivo

source: CameraSource.Camera, // Usar la cámara (no galería)

quality: 90 // Calidad de compresión (0-100)

});

return capturedPhoto;

}

**Funcionamiento**:

- Camera.getPhoto() abre la cámara nativa del dispositivo
- El usuario toma la foto
- Retorna un objeto con la URI temporal de la foto
- La calidad 90 balancea tamaño y resolución

**Paso 5: Convertir foto a Base64**

private async readAsBase64(photo: CameraPhoto) {

// Obtener el blob de la imagen

const response = await fetch(photo.webPath!);

const blob = await response.blob();

// Convertir blob a Base64

return await this.convertBlobToBase64(blob) as string;

}

private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {

const reader = new FileReader();

reader.onerror = reject;

reader.onload = () => resolve(reader.result);

reader.readAsDataURL(blob);

});

**Paso 6: Guardar foto en el dispositivo**

private async savePicture(photo: CameraPhoto, location: LocationData) {

// Convertir a Base64

const base64Data = await this.readAsBase64(photo);

// Generar nombre único usando timestamp

const fileName = \`photo_\${Date.now()}.jpeg\`;

// Escribir archivo en el sistema

const savedFile = await Filesystem.writeFile({

path: fileName,

data: base64Data,

directory: Directory.Data // Directorio privado de la app

});

// Retornar objeto con toda la información

return {

filepath: fileName,

webviewPath: photo.webPath,

savedUri: savedFile.uri,

location: location,

timestamp: new Date()

};

}

**Ubicación de almacenamiento**:

- Directory.Data: Carpeta privada de la aplicación
- Android: /data/data/com.tu.app/files/
- iOS: Application Support directory

**Implementación de Geolocalización**

**Paso 1: Crear el servicio de geolocalización**

Crear archivo src/app/services/geolocation.service.ts

**Propósito**: Obtener coordenadas GPS del dispositivo y generar enlaces a mapas.

**Paso 2: Importar dependencias**

import { Injectable } from '@angular/core';

import { Geolocation } from '@capacitor/geolocation';

import { Filesystem, Directory } from '@capacitor/filesystem';

**Paso 3: Definir interfaz de datos de ubicación**

export interface LocationData {

latitude: number; // Latitud en grados decimales

longitude: number; // Longitud en grados decimales

accuracy: number; // Precisión en metros

timestamp: number; // Marca de tiempo Unix

}

**Paso 4: Implementar obtención de coordenadas**

async getCurrentLocation(): Promise&lt;LocationData&gt; {

try {

// Solicitar posición actual al GPS

const coordinates = await Geolocation.getCurrentPosition({

enableHighAccuracy: true, // Usar GPS en lugar de red

timeout: 3000 // Esperar máximo 3 segundos

});

// Extraer datos relevantes

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

**Parámetros importantes**:

- enableHighAccuracy: true: Activa el GPS (más preciso, pero consume más batería)
- timeout: 3000: Evita que la app se congele esperando el GPS
- Si falla, se captura el error y se notifica al usuario

**Paso 5: Generar enlace a Google Maps**

generateGoogleMapsLink(latitude: number, longitude: number): string {

return \`<https://www.google.com/maps?q=\${latitude},\${longitude}\`>;

}

**Formato del enlace**:

- q=: Parámetro de búsqueda (query)
- Acepta formato: latitud,longitud
- Ejemplo: <https://www.google.com/maps?q=-0.1807,78.4678>

**Paso 6: Guardar ubicación en archivo de texto**

async saveLocationToFile(photoData: any): Promise&lt;void&gt; {

try {

// Formatear fecha legible

const timestamp = new Date().toLocaleString('es-EC');

// Crear contenido del registro

const content = \`

FOTO CON UBICACION

\==================

Fecha: \${timestamp}

Archivo: \${photoData.filepath}

Latitud: \${photoData.location.latitude}

Longitud: \${photoData.location.longitude}

Precision: \${photoData.location.accuracy} metros

Google Maps: \${this.generateGoogleMapsLink(photoData.location.latitude, photoData.location.longitude)}

\----------------------------------------

\`;

// Agregar al archivo de texto

await this.appendToTextFile('ubicaciones.txt', content);

console.log('Ubicacion guardada en archivo de texto');

} catch (error) {

console.error('Error guardando ubicacion en archivo:', error);

}

}

**Paso 7: Implementar escritura/lectura de archivo**

private async appendToTextFile(filename: string, content: string): Promise&lt;void&gt; {

try {

// Intentar leer archivo existente

try {

const existingFile = await Filesystem.readFile({

path: filename,

directory: Directory.Documents

});

// Agregar nuevo contenido al existente

content = existingFile.data + content;

} catch (readError) {

// Si no existe, se creará uno nuevo

console.log('Creando nuevo archivo de ubicaciones');

}

// Escribir o sobrescribir archivo

await Filesystem.writeFile({

path: filename,

data: content,

directory: Directory.Documents,

recursive: true // Crear directorios intermedios si no existen

});

} catch (error) {

console.error('Error manipulando archivo:', error);

throw error;

}

}

**Integración Camera + GPS**

**Paso 1: Inyectar GeolocationService en PhotoService**

constructor(private geolocationService: GeolocationService) {

this.loadSavedPhotos();

}

**Paso 2: Modificar método de captura para incluir GPS**

async addNewToGallery() {

try {

console.log('Tomando foto con ubicacion...');

// PRIMERO: Obtener ubicación GPS

let location: LocationData;

try {

location = await this.geolocationService.getCurrentLocation();

} catch (locationError) {

// Si falla GPS, usar coordenadas vacías

console.warn('No se pudo obtener ubicacion, continuando sin ella...');

location = {

latitude: 0,

longitude: 0,

accuracy: 0,

timestamp: Date.now()

};

}

// SEGUNDO: Tomar la foto

const capturedPhoto = await Camera.getPhoto({

resultType: CameraResultType.Uri,

source: CameraSource.Camera,

quality: 90

});

// TERCERO: Guardar foto con ubicación

const savedImageFile = await this.savePicture(capturedPhoto, location);

// CUARTO: Agregar al inicio de la galería

this.photos.unshift(savedImageFile);

// QUINTO: Guardar ubicación en archivo de texto

await this.geolocationService.saveLocationToFile(savedImageFile);

// SEXTO: Persistir lista de fotos

await this.savePhotosList();

console.log('Foto con ubicacion guardada');

return savedImageFile;

} catch (error) {

console.error('Error tomando foto con ubicacion:', error);

throw error;

}

}

**Función de Eliminación**

**Paso 1: Implementar método de eliminación en PhotoService**

async deletePhoto(photo: UserPhoto, position: number) {

try {

// 1. Eliminar archivo físico del dispositivo

await Filesystem.deleteFile({

path: photo.filepath,

directory: Directory.Data

});

// 2. Remover del array en memoria

this.photos.splice(position, 1);

// 3. Actualizar lista persistida

await this.savePhotosList();

console.log('Foto eliminada correctamente');

return true;

} catch (error) {

console.error('Error eliminando foto:', error);

throw error;

}

}

**Paso 2: Crear método helper para persistir lista**

private async savePhotosList() {

await Preferences.set({

key: this.PHOTO_STORAGE,

value: JSON.stringify(this.photos)

});

}

**Paso 3: Implementar confirmación en HomePage**

async deletePhoto(photo: UserPhoto, position: number) {

// Crear alerta de confirmación

const alert = await this.alertController.create({

header: '¿Eliminar foto?',

message: 'Esta acción no se puede deshacer',

buttons: \[

{

text: 'Cancelar',

role: 'cancel'

},

{

text: 'Eliminar',

role: 'destructive',

handler: async () => {

try {

await this.photoService.deletePhoto(photo, position);

console.log('Foto eliminada');

} catch (error) {

console.error('Error al eliminar:', error);

this.showErrorAlert();

}

}

}

\]

});

await alert.present();

}

**Persistencia de Datos**

**Paso 1: Guardar lista de fotos en Preferences**

await Preferences.set({

key: this.PHOTO_STORAGE, // Clave: 'photos'

value: JSON.stringify(this.photos) // Valor: JSON string del array

});

**Paso 2: Cargar fotos al iniciar la app**

async loadSavedPhotos() {

// Leer lista de fotos guardada

const photoList = await Preferences.get({ key: this.PHOTO_STORAGE });

const photos = photoList.value ? JSON.parse(photoList.value) : \[\];

if (!photos || photos.length === 0) {

return;

}

// Reconstruir cada foto

for (let photo of photos) {

try {

// Leer archivo de imagen

const readFile = await Filesystem.readFile({

path: photo.filepath,

directory: Directory.Data

});

// Reconstruir webviewPath para mostrar en HTML

photo.webviewPath = \`data:image/jpeg;base64,\${readFile.data}\`;

// Asegurar que tenga datos de ubicación

if (!photo.location) {

photo.location = {

latitude: 0,

longitude: 0,

accuracy: 0,

timestamp: photo.timestamp || Date.now()

};

}

} catch (error) {

console.error(\`Error cargando foto \${photo.filepath}:\`, error);

continue; // Saltar esta foto y continuar con las demás

}

}

this.photos = photos;

}

**Interfaz de Usuario**

**Paso 1: Estructura del template HTML**

&lt;ion-header&gt;

&lt;ion-toolbar color="primary"&gt;

&lt;ion-title&gt;Galería con Ubicación&lt;/ion-title&gt;

&lt;/ion-toolbar&gt;

&lt;/ion-header&gt;

&lt;ion-content&gt;

&lt;!-- Sección de información --&gt;

&lt;!-- Grid de fotos --&gt;

&lt;!-- Estado vacío --&gt;

&lt;!-- Botón flotante de cámara --&gt;

&lt;/ion-content&gt;

**Paso 2: Grid de fotos con tarjetas**

&lt;ion-grid&gt;

&lt;ion-row&gt;

&lt;ion-col size="12" size-md="6" \*ngFor="let photo of photoService.photos; index as position"&gt;

&lt;div class="photo-card"&gt;

&lt;!-- Imagen --&gt;

&lt;ion-img \[src\]="photo.webviewPath" class="photo-image"&gt;&lt;/ion-img&gt;

&lt;!-- Botón eliminar --&gt;

&lt;ion-button class="delete-button" (click)="deletePhoto(photo, position)"&gt;

&lt;ion-icon name="trash" slot="icon-only"&gt;&lt;/ion-icon&gt;

&lt;/ion-button&gt;

&lt;!-- Información de ubicación --&gt;

&lt;div class="location-info"&gt;

&lt;small&gt;{{ photo.location.latitude }}, {{ photo.location.longitude }}&lt;/small&gt;

&lt;ion-button (click)="openMaps(photo.location.latitude, photo.location.longitude)"&gt;

Ver en Mapa

&lt;/ion-button&gt;

&lt;/div&gt;

&lt;/div&gt;

&lt;/ion-col&gt;

&lt;/ion-row&gt;

&lt;/ion-grid&gt;

**Componentes clave**:

- ion-grid/row/col: Sistema de layout responsivo
- \*ngFor: Itera sobre el array de fotos
- \[src\]: Binding de la URL de la imagen
- (click): Event binding para acciones

**Paso 3: Botón flotante de acción**

&lt;ion-fab vertical="bottom" horizontal="center" slot="fixed"&gt;

&lt;ion-fab-button (click)="addPhotoToGallery()" color="primary"&gt;

&lt;ion-icon name="camera"&gt;&lt;/ion-icon&gt;

&lt;/ion-fab-button&gt;

&lt;/ion-fab&gt;

**Floating Action Button (FAB)**:

- Botón circular flotante sobre el contenido
- Posición fija en la parte inferior central
- Acción principal de la app (tomar foto)

**Paso 4: Estilos SCSS**

.photo-card {

position: relative;

margin: 12px;

border-radius: 12px;

overflow: hidden;

box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

background: white;

}

.delete-button {

position: absolute;

top: 8px;

right: 8px;

z-index: 10;

}

**Flujo Completo de la Aplicación**

**Escenario: Usuario toma una foto**

- **Usuario presiona botón FAB**
  - Evento: (click)="addPhotoToGallery()"
  - Se ejecuta en: home.page.ts
- **Se llama a PhotoService.addNewToGallery()**
  - Primero: Solicita ubicación GPS
  - Espera máximo 3 segundos
- **Se obtiene ubicación**
  - Si éxito: coordenadas reales
  - Si fallo: coordenadas 0,0
- **Se abre la cámara nativa**
  - Usuario toma la foto
  - Se obtiene URI temporal
- **Se procesa la imagen**
  - Convierte a Base64
  - Genera nombre único con timestamp
- **Se guarda en el dispositivo**
  - Escribe archivo en Directory.Data
  - Crea objeto UserPhoto con todos los metadatos
- **Se actualiza la galería**
  - Agrega al inicio del array photos
  - Guarda ubicación en archivo de texto
  - Persiste lista en Preferences
- **Se actualiza la UI**
  - Angular detecta cambios en photoService.photos
  - Re-renderiza el grid con la nueva foto
  - Usuario ve la foto en pantalla
  - Angular re-renderiza el grid
  - La foto desaparece de la pantalla