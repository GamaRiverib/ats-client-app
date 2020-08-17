import { Injectable } from '@angular/core';
import { Toast } from '@ionic-native/toast/ngx';
import { ToastController, Platform } from '@ionic/angular';
import { Vibration } from '@ionic-native/vibration/ngx';

export interface ToastOptions {
  header?: string;
  duration?: number | 'short' | 'long';
  position?: 'top' | 'bottom' | 'middle' | 'center';
  vibration?: number [];
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(
    private platform: Platform,
    private toast: Toast,
    private vibration: Vibration,
    private toastController: ToastController) { }

    private showNativeToast(message: string, options?: ToastOptions): void {
      if (!options) {
        this.toast.showShortBottom(message);
        return;
      }

      const position = options.position ? options.position : 'bottom';
      const duration = options.duration ?
        typeof options.duration === 'number' ? options.duration :
        options.duration === 'long' ? 3000 : 1000 : 1000;

      this.toast.showWithOptions({ message, position, duration });

      if (options.vibration) {
        this.vibration.vibrate(options.vibration);
      }
    }

    private async showWebToast(message: string, options?: ToastOptions): Promise<void> {
      let toast: HTMLIonToastElement;
      if (!options) {
        toast = await this.toastController.create({ message });
      } else {
        const position = options.position ?
          options.position === 'center' ? 'middle' : options.position : 'bottom';
        const duration = options.duration ?
          typeof options.duration === 'number' ? options.duration :
          options.duration === 'long' ? 3000 : 1000 : 1000;
        const header = options.header ? options.header : 'Alert';
        toast = await this.toastController.create({ message, header, duration, position });
      }
      return toast.present();
    }

    async show(message: string, options?: ToastOptions): Promise<void> {
      if (this.platform.is('hybrid')) {
        this.showNativeToast(message, options);
      } else {
        this.showWebToast(message, options);
      }
    }

    async showLongTop(message: string, header?: string, vibration?: number[]): Promise<void> {
      return this.show(message, { header, duration: 'long', position: 'top', vibration });
    }

    async showLongCenter(message: string, header?: string, vibration?: number[]): Promise<void> {
      return this.show(message, { header, duration: 'long', position: 'center', vibration });
    }

    async showLongBottom(message: string, header?: string, vibration?: number[]): Promise<void> {
      return this.show(message, { header, duration: 'long', position: 'bottom', vibration });
    }

    async showShortTop(message: string, header?: string, vibration?: number[]): Promise<void> {
      return this.show(message, { header, duration: 'short', position: 'top', vibration });
    }

    async showShortCenter(message: string, header?: string, vibration?: number[]): Promise<void> {
      return this.show(message, { header, duration: 'short', position: 'center', vibration });
    }

    async showShortBottom(message: string, header?: string, vibration?: number[]): Promise<void> {
      return this.show(message, { header, duration: 'short', position: 'bottom', vibration });
    }

}
