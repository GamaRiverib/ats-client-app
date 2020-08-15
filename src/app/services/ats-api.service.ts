import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HTTP, HTTPResponse } from '@ionic-native/http/ngx';
import { environment } from 'src/environments/environment';
import { getTotp } from './otp.provider.service';
import { Sensor, SensorLocation } from './ats.service';
import { Platform } from '@ionic/angular';

const CLIENT_SECRET = environment.client_secret;
const CLIENT_ID = environment.client_id;
const BASE_PATH = `${environment.server_url}/config`;

@Injectable({
  providedIn: 'root'
})
export class AtsApiService {

  private hybrid = false;
  private timeDiff = 0;
  private lastTimeSynchronization: Date | null = null;
  private timeSynchronizationFrequency = 10;
  private timeSynchronizationIntervalId: NodeJS.Timeout | null = null;

  constructor(
    private http: HTTP,
    private httpClient: HttpClient,
    private platform: Platform) {
      this.hybrid = this.platform.is('hybrid');
      this.startServerTimeSync();
  }

  private startServerTimeSync(): void {
    const frequency: number = 60000 * this.timeSynchronizationFrequency; // minutes
    this.timeSynchronizationIntervalId = setInterval(this.syncServerTime.bind(this), frequency);
  }

  private async syncServerTime(): Promise<void> {
    const url = `${BASE_PATH}/uptime`;
    let time = 0;
    if (this.hybrid) {
      this.http.clearCookies();
      const response: HTTPResponse = await this.http.get(url, {}, {});
      if (response.status !== 200) {
        console.log('sync server time error', { status: response.status, error: response.error });
        return;
      }
      time = parseInt(response.data, 10);
    } else {
      time = await this.httpClient.get(url)
        .toPromise()
        .then(r => parseInt(r.toString(), 10));
    }
    const serverTime = new Date(time * 1000);
    const localTime = new Date();
    this.timeDiff = localTime.getTime() - serverTime.getTime();
    this.lastTimeSynchronization = localTime;
  }

  private getToken(): string {
    const time = Date.now() - this.timeDiff;
    const epoch = Math.round(time / 1000.0);
    const code = getTotp(CLIENT_SECRET, { epoch });
    return code;
  }

  private throwError(reason: { status: number }): void {
    console.log(reason);
    switch (reason.status || -1) {
      case 403:
        throw { error: 0 };
      case 409:
        throw { error: 1 };
      default:
        throw { error: -1 };
    }
  }

  private getHeaders(): any {
    return {
      Authorization: `${CLIENT_ID} ${this.getToken()}`
    };
  }

  private async generateSecret(): Promise<string> {
    let secret = '';
    const url = `${BASE_PATH}/secret`;
    const headers = this.getHeaders();
    if (this.hybrid) {
      this.http.clearCookies();
      const response: HTTPResponse = await this.http.get(url, {}, headers);
      secret = response.data || '';
      if (response.status !== 200) {
        console.log('generate secret error', { status: response.status, error: response.error });
        throw { error: -1 };
      }
    } else {
      try {
        const response = await this.httpClient.get(url, { headers, responseType: 'text' }).toPromise();
        console.log(response);
      } catch (reason) {
        this.throwError(reason);
      }
    }
    return secret;
  }

  async setProgrammingMode(code: string): Promise<void> {
    const url = `${BASE_PATH}/programm`;
    const body = { code };
    const headers = this.getHeaders();
    if (this.hybrid) {
      this.http.clearCookies();
      const response: HTTPResponse = await this.http.put(url, body, headers);
      if (response.status !== 204) {
        console.log('set programming mode error', { status: response.status, error: response.error });
      }
    } else {
      try {
        await this.httpClient.put(url, body, { headers }).toPromise();
      } catch (reason) {
        this.throwError(reason);
      }
    }
  }

  async unsetProgrammingMode(): Promise<void> {
    const url = `${BASE_PATH}/programm`;
    const body = { };
    const headers = this.getHeaders();
    if (this.hybrid) {
      this.http.clearCookies();
      const response: HTTPResponse = await this.http.delete(url, body, headers);
      if (response.status !== 204) {
        console.log('unset programming mode error', { status: response.status, error: response.error });
      }
    } else {
      try {
        await this.httpClient.delete(url, { headers }).toPromise();
      } catch (reason) {
        this.throwError(reason);
      }
    }
  }

  async getCurrentConfig(code?: string): Promise<any> {
    let config: any;
    const url = `${BASE_PATH}`;
    const headers = this.getHeaders();
    if (this.hybrid) {
      this.http.clearCookies();
      const response: HTTPResponse = await this.http.get(url, {}, headers);
      config = response.data;
      if (response.status !== 200) {
        console.log('get current config error', { status: response.status, error: response.error });
        throw { error: -1 };
      }
    } else {
      try {
        config = await this.httpClient.get(url, { headers }).toPromise();
      } catch (reason) {
        this.throwError(reason);
      }
    }
    return config;
  }

  async setGuestCode(code: string, guestCode: string): Promise<void> {
    const url = `${BASE_PATH}/codes/guest`;
    const body = { code, guestCode };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set guest code error', { status: response.status, error: response.error });
    }
    return;
  }

  async setOwnerCode(code: string, newCode: string): Promise<void> {
    const url = `${BASE_PATH}/codes/owner`;
    const body = { code, newCode };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set owner code error', { status: response.status, error: response.error });
    }
    return;
  }

  async setAdminCode(code: string, newCode: string): Promise<void> {
    const url = `${BASE_PATH}/codes/admin`;
    const body = { code, newCode };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set admin code error', { status: response.status, error: response.error });
    }
    return;
  }

  async updateSensor(sensor: Sensor): Promise<void> {
    const url = `${BASE_PATH}/sensors`;
    const body = sensor;
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('update sensor error', { status: response.status, error: response.error });
    }
    return;
  }

  async removeSensor(location: SensorLocation): Promise<void> {
    const url = `${BASE_PATH}/sensors`;
    const body = location;
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('remove sensor error', { status: response.status, error: response.error });
    }
    return;
  }

  async updateEntryTime(time: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/times/entry`;
    const body = { time, code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('update entry time error', { status: response.status, error: response.error });
    }
    return;
  }

  async updateExitTime(time: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/times/exit`;
    const body = { time, code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('update exit time error', { status: response.status, error: response.error });
    }
    return;
  }

  async turnBeepOn(code?: string): Promise<void> {
    const url = `${BASE_PATH}/beep/on`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('turn beep on error', { status: response.status, error: response.error });
    }
    return;
  }

  async turnBeepOff(code?: string): Promise<void> {
    const url = `${BASE_PATH}/beep/off`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('turn beep off error', { status: response.status, error: response.error });
    }
    return;
  }

  async toggleBeep(code?: string): Promise<void> {
    // PUT beep/toggle
    // status = 204
    const url = `${BASE_PATH}/beep/toggle`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('toggle beep error', { status: response.status, error: response.error });
    }
    return;
  }

  async turnSilentOn(code?: string): Promise<void> {
    const url = `${BASE_PATH}/silent/on`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('turn silent on error', { status: response.status, error: response.error });
    }
    return;
  }

  async turnSilentOff(code?: string): Promise<void> {
    const url = `${BASE_PATH}/silent/off`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('turn silent off error', { status: response.status, error: response.error });
    }
    return;
  }

  async toggleSilent(code?: string): Promise<void> {
    const url = `${BASE_PATH}/silent/toggle`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('toggle silent error', { status: response.status, error: response.error });
    }
    return;
  }

  async setCentralPhone(phone: string): Promise<void> {
    const url = `${BASE_PATH}/phones/central`;
    const body = phone;
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set central phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async unsetCentralPhone(): Promise<void> {
    const url = `${BASE_PATH}/phones/central`;
    const body = { };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('unset central phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async setAdminPhone(phone: string): Promise<void> {
    const url = `${BASE_PATH}/phones/admin`;
    const body = phone;
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set admin phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async unsetAdminPhone(): Promise<void> {
    const url = `${BASE_PATH}/phones/admin`;
    const body = { };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('unset admin phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async addOwnerPhone(phone: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/phones/owner`;
    const body = { phone, code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.post(url, body, headers);
    if (response.status !== 204) {
      console.log('add owner phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async updateOwnerPhone(index: number, phone: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/phones/owner/${index}`;
    const body = { phone, code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('update owner phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async removeOwnerPhone(index: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/phones/owner/${index}`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('remove owner phone error', { status: response.status, error: response.error });
    }
    return;
  }

  async setCentralEmail(email: string): Promise<void> {
    const url = `${BASE_PATH}/emails/central`;
    const body = email;
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set central email error', { status: response.status, error: response.error });
    }
    return;
  }

  async unsetCentralEmail(): Promise<void> {
    const url = `${BASE_PATH}/emails/central`;
    const body = { };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('unset central email error', { status: response.status, error: response.error });
    }
    return;
  }

  async setAdminEmail(email: string): Promise<void> {
    const url = `${BASE_PATH}/emails/admin`;
    const body = email;
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('set admin email error', { status: response.status, error: response.error });
    }
    return;
  }

  async unsetAdminEmail(): Promise<void> {
    const url = `${BASE_PATH}/emails/admin`;
    const body = { };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('unset admin email error', { status: response.status, error: response.error });
    }
    return;
  }

  async addOwnerEmail(email: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/emails/owner`;
    const body = { email, code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.post(url, body, headers);
    if (response.status !== 204) {
      console.log('add owner email error', { status: response.status, error: response.error });
    }
    return;
  }

  async updateOwnerEmail(index: number, email: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/emails/owner/${index}`;
    const body = { email, code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    if (response.status !== 204) {
      console.log('update owner email error', { status: response.status, error: response.error });
    }
    return;
  }

  async removeOwnerEmail(index: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/emails/owner/${index}`;
    const body = { code };
    const headers = this.getHeaders();
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.delete(url, body, headers);
    if (response.status !== 204) {
      console.log('remove owner email error', { status: response.status, error: response.error });
    }
    return;
  }

}
