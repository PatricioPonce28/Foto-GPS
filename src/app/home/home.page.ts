import { Component } from '@angular/core';
import { PhotoService, UserPhoto } from '../services/photo';
import { GeolocationService } from '../services/geolocation';
import { Browser } from '@capacitor/browser';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor(
    public photoService: PhotoService,
    private geolocationService: GeolocationService,
    private alertController: AlertController
  ) {}

  // Tomar nueva foto
  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  // FUNCIÓN ELIMINAR FOTO (CON CONFIRMACIÓN)
  async deletePhoto(photo: UserPhoto, position: number) {
    const alert = await this.alertController.create({
      header: '¿Eliminar foto?',
      message: 'Esta acción no se puede deshacer',
      buttons: [
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
              console.log('Foto eliminada correctamente');
            } catch (error) {
              console.error('Error al eliminar foto:', error);
              this.showErrorAlert();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Abrir Google Maps con la ubicación
  async openMaps(latitude: number, longitude: number) {
    if (latitude === 0 && longitude === 0) {
      const alert = await this.alertController.create({
        header: 'Sin ubicación',
        message: 'No hay ubicación disponible para esta foto',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const mapsUrl = this.geolocationService.generateGoogleMapsLink(latitude, longitude);
    await Browser.open({ url: mapsUrl });
  }

  // Mostrar alerta de error
  private async showErrorAlert() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No se pudo eliminar la foto',
      buttons: ['OK']
    });
    await alert.present();
  }
}