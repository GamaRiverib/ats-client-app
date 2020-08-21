import { Injectable } from '@angular/core';
import { HTTP, HTTPResponse } from '@ionic-native/http/ngx';
import { Socket } from 'ngx-socket-io';
import { Channel, ProtocolMesssages, AtsErrors, SystemState, SensorLocation } from '../app.values';
import { SERVER_URL, CLIENT_ID } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class WebSocketChannel implements Channel {

  private online = false;

  private reconnectIntents = 0;
  private reconnectIntervalId: NodeJS.Timeout | null = null;

  private connectedHandler: () => void = null;
  private disconnectedHandler: () => void = null;

  private receiveTimeHandler: (time: number) => void = null;
  private receiveWhoHandler: () => void = null;
  private receiveEventsHandler: (config: any) => void = null;
  private receiveSensorsHandler: (sensors: any) => void = null;

  constructor(private socket: Socket, private http: HTTP) {
    this.init();
  }

  private init(): void {
    this.socket.on('connect', this.onSocketConnected.bind(this));
    this.socket.on('disconnect', this.onSocketDisconnected.bind(this));
    this.socket.on(ProtocolMesssages.Time, this.onReceiveTimeHandler.bind(this));
    this.socket.on(ProtocolMesssages.Who, this.onReceiveWhoHandler.bind(this));
    this.socket.on(ProtocolMesssages.Events, this.onReceiveEventsHandler.bind(this));
    this.socket.on(ProtocolMesssages.Sensors, this.onReceiveSensorsHandler.bind(this));
  }

  private reconnect(): void {
    if (this.reconnectIntents > 15) {
      clearInterval(this.reconnectIntervalId);
      this.reconnectIntervalId = null;
      this.reconnectIntents = 0;
      // this._reconnectIntervalId = setInterval(this.reconnect.bind(this), 60000 * 5);
      if (this.disconnectedHandler) {
        this.disconnectedHandler();
      }
    } else {
      this.reconnectIntents++;
      this.socket.connect();
    }
  }

  private onSocketConnected(): void {
    this.online = true;
    this.reconnectIntents = 0;
    clearInterval(this.reconnectIntervalId);
    this.reconnectIntervalId = null;
    if (this.connectedHandler) {
      this.connectedHandler();
    }
  }

  private onSocketDisconnected(): void {
    this.online = false;
    this.reconnectIntervalId = setInterval(this.reconnect.bind(this), 5000);
    if (this.disconnectedHandler) {
      this.disconnectedHandler();
    }
  }

  private onReceiveTimeHandler(time: number): void {
    if (this.receiveTimeHandler) {
      this.receiveTimeHandler(time);
    }
  }

  private onReceiveWhoHandler(): void {
    if (this.receiveWhoHandler) {
      this.receiveWhoHandler();
    }
  }

  private onReceiveEventsHandler(config: any): void {
    if (this.receiveEventsHandler) {
      this.receiveEventsHandler(config);
    }
  }

  private onReceiveSensorsHandler(sensors: any): void {
    if (this.receiveSensorsHandler) {
      this.receiveSensorsHandler(sensors);
    }
  }

  connect(): void {
    console.log('WS connected', this.connected());
    if (this.connected()) {
      console.log('WebSocket channel is already connected');
      return;
    }
    console.log(`AtsService connecting to server ${SERVER_URL}`);
    this.socket.connect();
  }

  connected(): boolean {
    return this.online;
  }

  onConnected(handler: () => void): void {
    this.connectedHandler = handler;
  }

  onDisconnected(handler: () => void): void {
    this.disconnectedHandler = handler;
  }

  async getServerTime(): Promise<number> {
    const url = `${SERVER_URL}/uptime`;
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.get(url, {}, {});
    if (response.status !== 200) {
      console.log('getDevices Error', { status: response.status, error: response.error });
      throw new Error('Fail get server time');
    }
    return parseInt(response.data, 10);
  }

  sendIsMessage(token: string): void {
    const clientId = CLIENT_ID;
    const code = parseInt(token, 10);
    const payload = { code, clientId };
    this.socket.emit(ProtocolMesssages.is, payload);
  }

  async getState(token: string): Promise<SystemState> {
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/state`;
    const headers = { Authorization: `${clientId} ${token}` };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.get(url, {}, headers);
    switch (response.status) {
      case 403:
      case 401:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 200:
      case 201:
      case 204:
        if (response.data) {
          return JSON.parse(response.data);
        }
        throw { error: AtsErrors.EMPTY_RESPONSE };

      default:
        throw { error: AtsErrors.WAS_A_PROBLEM };
    }
  }

  async arm(token: string, mode: number, code?: string): Promise<void> {
      const clientId = CLIENT_ID;
      const url = `${SERVER_URL}/arm`;
      let body = `mode=${mode}`;
      if (code) {
        body += `&code=${code}`;
      }
      const headers = {
        Authorization: `${clientId} ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      this.http.clearCookies();
      const response: HTTPResponse = await this.http.put(url, body, headers);
      switch (response.status) {
        case 401:
        case 403:
          throw { error: AtsErrors.NOT_AUTHORIZED };

        case 409:
          throw { error: AtsErrors.INVALID_SYSTEM_STATE };

        case 204:
          return;

        default:
          throw { error: AtsErrors.BAD_REQUEST };
      }
  }

  async disarm(token: string, code: string): Promise<void> {
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/disarm`;
    const body = `code=${code}`;
    const headers = {
      Authorization: `${clientId} ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    switch (response.status) {
      case 401:
      case 403:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 409:
        throw { error: AtsErrors.INVALID_SYSTEM_STATE };

      case 204:
        return;

      default:
        throw { error: AtsErrors.BAD_REQUEST };
    }
  }

  async bypass(token: string, location: SensorLocation, code: string): Promise<void> {
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/bypass/one`;
    let body = `location=${JSON.stringify(location)}`;
    if (code) {
      body += `&code=${code}`;
    }
    const headers = {
      Authorization: `${clientId} ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    switch (response.status) {
      case 401:
      case 403:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 409:
        throw { error: AtsErrors.INVALID_SYSTEM_STATE };

      case 204:
        return;

      default:
        throw { error: AtsErrors.BAD_REQUEST };
    }
  }

  async bypassAll(token: string, locations: SensorLocation[], code: string): Promise<void> {
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/bypass/all`;
    let body = `locations=${JSON.stringify(locations)}`;
    if (code) {
      body += `&code=${code}`;
    }
    const headers = {
      Authorization: `${clientId} ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    switch (response.status) {
      case 401:
      case 403:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 409:
        throw { error: AtsErrors.INVALID_SYSTEM_STATE };

      case 204:
        return;

      default:
        throw { error: AtsErrors.BAD_REQUEST };
    }
  }

  async clearBypass(token: string, code: string): Promise<void> {
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/unbypass/all`;
    const body = `code=${code}`;
    const headers = {
      Authorization: `${clientId} ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    switch (response.status) {
      case 401:
      case 403:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 409:
        throw { error: AtsErrors.INVALID_SYSTEM_STATE };

      case 204:
        return;

      default:
        throw { error: AtsErrors.BAD_REQUEST };
    }
  }

  async clearBypassOne(token: string, location: SensorLocation, code: string): Promise<void> {
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/unbypass/one`;
    let body = `location=${JSON.stringify(location)}`;
    if (code) {
      body += `&code=${code}`;
    }
    const headers = {
      Authorization: `${clientId} ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    switch (response.status) {
      case 401:
      case 403:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 409:
        throw { error: AtsErrors.INVALID_SYSTEM_STATE };

      case 204:
        return;

      default:
        throw { error: AtsErrors.BAD_REQUEST };
    }
  }

  async programm(token: string, code: string): Promise<void>{
    const clientId = CLIENT_ID;
    const url = `${SERVER_URL}/config/programm`;
    const body = `code=${code}`;
    const headers = {
      Authorization: `${clientId} ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.http.clearCookies();
    const response: HTTPResponse = await this.http.put(url, body, headers);
    switch (response.status) {
      case 401:
      case 403:
        throw { error: AtsErrors.NOT_AUTHORIZED };

      case 409:
        throw { error: AtsErrors.INVALID_SYSTEM_STATE };

      case 204:
        return;

      default:
        throw { error: AtsErrors.BAD_REQUEST };
    }
  }

  onReceiveTime(handler: (time: number) => void): void {
    this.receiveTimeHandler = handler;
  }

  onReceiveWho(handler: () => void): void {
    this.receiveWhoHandler = handler;
  }

  onReceiveEvents(handler: (config: any) => void): void {
    this.receiveEventsHandler = handler;
  }

  onReceiveSensors(handler: (sensors: any) => void): void {
    this.receiveSensorsHandler = handler;
  }

  subscribe(topic: string, callback: (data: any) => void, config?: any): void {
    if (config) {
      this.socket.on(config[topic] || topic, callback);
      return;
    }
    this.socket.on(topic, callback);
  }
}
