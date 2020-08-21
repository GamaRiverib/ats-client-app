import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AtsApiService } from 'src/app/services/ats-api.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-admin-codes',
  templateUrl: './admin-codes.component.html',
  styleUrls: ['./admin-codes.component.scss'],
})
export class AdminCodesComponent implements OnInit {

  constructor(
    private api: AtsApiService,
    private toast: ToastService,
    private alertController: AlertController) {}

  ngOnInit() {
  }

  private async handleError(reason: { error: number}): Promise<void> {
    switch (reason.error) {
      case 0:
        this.toast.showLongTop('Not authorized');
        break;
      case 1:
        this.toast.showLongTop('System is not ready or disarmed');
        break;
      default:
        this.toast.showLongTop('There was a problem');
    }
  }

  async changeGuestCode(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Change Guest Code',
      inputs: [
        {
          name: 'owner',
          type: 'password',
          label: 'Owner code',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        },
        {
          name: 'guest',
          type: 'password',
          label: 'Guest code',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Change guest code canceled');
          }
        }, {
          text: 'Ok',
          handler: async (params: { owner: string, guest: string }) => {
            try {
              await this.api.setGuestCode(params.owner, params.guest);
              this.toast.showLongCenter('Guest code updated');
            } catch (reason) {
              this.handleError(reason);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changeAdminCode(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Change Admin Code',
      inputs: [
        {
          name: 'code',
          type: 'password',
          label: 'Admin code',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        },
        {
          name: 'newCode',
          type: 'password',
          label: 'New code',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Change admin code canceled');
          }
        }, {
          text: 'Ok',
          handler: async (params: { code: string, newCode: string }) => {
            try {
              await this.api.setAdminCode(params.code, params.newCode);
              this.toast.showLongCenter('Admin code updated');
            } catch (reason) {
              this.handleError(reason);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changeOwnerCode(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Change Owner Code',
      inputs: [
        {
          name: 'code',
          type: 'password',
          label: 'Owner code',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        },
        {
          name: 'newCode',
          type: 'password',
          label: 'New code',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Change owner code canceled');
          }
        }, {
          text: 'Ok',
          handler: async (params: { code: string, newCode: string }) => {
            try {
              await this.api.setOwnerCode(params.code, params.newCode);
              this.toast.showLongCenter('Owner code updated');
            } catch (reason) {
              this.handleError(reason);
            }
          }
        }
      ]
    });

    await alert.present();
  }

}
