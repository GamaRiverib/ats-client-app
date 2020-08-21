import { Injectable } from '@angular/core';
import { SERVER_URL, CLIENT_SECRET, CLIENT_ID } from 'src/environments/environment';
import { getTotp } from './otp.provider.service';
import { Sensor, SensorLocation } from '../app.values';
import { HttpService } from './http.service';

const BASE_PATH = `${SERVER_URL}/config`;

@Injectable({
  providedIn: 'root'
})
export class AtsApiService {

  private timeDiff = 0;
  private lastTimeSynchronization: Date | null = null;
  private timeSynchronizationFrequency = 10;
  private timeSynchronizationIntervalId: NodeJS.Timeout | null = null;

  constructor(
    private http: HttpService) {
      this.startServerTimeSync();
  }

  private startServerTimeSync(): void {
    const frequency: number = 60000 * this.timeSynchronizationFrequency; // minutes
    this.timeSynchronizationIntervalId = setInterval(this.syncServerTime.bind(this), frequency);
  }

  private async syncServerTime(): Promise<void> {
    const url = `${BASE_PATH}/uptime`;
    let time = 0;
    const response = await this.http.get(url);
    time = parseInt(response.toString(), 10);
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
      authorization: `${CLIENT_ID} ${this.getToken()}`
    };
  }

  private async generateSecret(): Promise<string> {
    const url = `${BASE_PATH}/secret`;
    const headers = this.getHeaders();
    return this.http.get(url, headers, { responseType: 'text' });
  }

  async setProgrammingMode(code: string): Promise<void> {
    const url = `${BASE_PATH}/programm`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async unsetProgrammingMode(): Promise<void> {
    const url = `${BASE_PATH}/programm`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers);
    return;
  }

  async getCurrentConfig(code?: string): Promise<any> {
    const url = `${BASE_PATH}`;
    const headers = this.getHeaders();
    return await this.http.get(url, headers);
  }

  async setGuestCode(code: string, guestCode: string): Promise<void> {
    const url = `${BASE_PATH}/codes/guest`;
    const body = { code, guestCode };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async setOwnerCode(code: string, newCode: string): Promise<void> {
    const url = `${BASE_PATH}/codes/owner`;
    const body = { code, newCode };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async setAdminCode(code: string, newCode: string): Promise<void> {
    const url = `${BASE_PATH}/codes/admin`;
    const body = { code, newCode };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async updateSensor(sensor: Sensor): Promise<void> {
    const url = `${BASE_PATH}/sensors`;
    const body = sensor;
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async removeSensor(location: SensorLocation): Promise<void> {
    const url = `${BASE_PATH}/sensors`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers, { parameters: { location } });
    return;
  }

  async updateEntryTime(time: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/times/entry`;
    const body = { time, code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async updateExitTime(time: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/times/exit`;
    const body = { time, code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async turnBeepOn(code?: string): Promise<void> {
    const url = `${BASE_PATH}/beep/on`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async turnBeepOff(code?: string): Promise<void> {
    const url = `${BASE_PATH}/beep/off`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async toggleBeep(code?: string): Promise<void> {
    const url = `${BASE_PATH}/beep/toggle`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async turnSilentOn(code?: string): Promise<void> {
    const url = `${BASE_PATH}/silent/on`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async turnSilentOff(code?: string): Promise<void> {
    const url = `${BASE_PATH}/silent/off`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async toggleSilent(code?: string): Promise<void> {
    const url = `${BASE_PATH}/silent/toggle`;
    const body = { code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async setCentralPhone(phone: string): Promise<void> {
    const url = `${BASE_PATH}/phones/central`;
    const body = phone;
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async unsetCentralPhone(): Promise<void> {
    const url = `${BASE_PATH}/phones/central`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers);
    return;
  }

  async setAdminPhone(phone: string): Promise<void> {
    const url = `${BASE_PATH}/phones/admin`;
    const body = phone;
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async unsetAdminPhone(): Promise<void> {
    const url = `${BASE_PATH}/phones/admin`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers);
    return;
  }

  async addOwnerPhone(phone: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/phones/owner`;
    const body = { phone, code };
    const headers = this.getHeaders();
    await this.http.post(url, body, headers);
    return;
  }

  async updateOwnerPhone(index: number, phone: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/phones/owner/${index}`;
    const body = { phone, code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async removeOwnerPhone(index: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/phones/owner/${index}`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers, { parameters: { code } });
    return;
  }

  async setCentralEmail(email: string): Promise<void> {
    const url = `${BASE_PATH}/emails/central`;
    const body = email;
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async unsetCentralEmail(): Promise<void> {
    const url = `${BASE_PATH}/emails/central`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers);
    return;
  }

  async setAdminEmail(email: string): Promise<void> {
    const url = `${BASE_PATH}/emails/admin`;
    const body = email;
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async unsetAdminEmail(): Promise<void> {
    const url = `${BASE_PATH}/emails/admin`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers);
    return;
  }

  async addOwnerEmail(email: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/emails/owner`;
    const body = { email, code };
    const headers = this.getHeaders();
    await this.http.post(url, body, headers);
    return;
  }

  async updateOwnerEmail(index: number, email: string, code?: string): Promise<void> {
    const url = `${BASE_PATH}/emails/owner/${index}`;
    const body = { email, code };
    const headers = this.getHeaders();
    await this.http.put(url, body, headers);
    return;
  }

  async removeOwnerEmail(index: number, code?: string): Promise<void> {
    const url = `${BASE_PATH}/emails/owner/${index}`;
    const headers = this.getHeaders();
    await this.http.delete(url, headers, { parameters: { code } });
    return;
  }

}
