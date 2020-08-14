import { Injectable } from '@angular/core';
import { MQTTChannel } from './mqtt.channel.service';
import { getTotp } from './otp.provider.service';
import { environment } from 'src/environments/environment';
import { WebSocketChannel } from './ws.channel.service';

const CLIENT_SECRET = environment.client_secret;

export const AtsEvents = {
    NOT_AUTHORIZED: 'NOT_AUTHORIZED',
    PIN_CODE_UPDATED: 'PIN_CODE_UPDATED',
    SYSTEM_STATE_CHANGED: 'SYSTEM_STATE_CHANGED',
    SENSOR_REGISTERED: 'SENSOR_REGISTERED',
    SENSOR_CHANGED: 'SENSOR_CHANGED',
    SENSOR_DELETED: 'SENSOR_DELETED',
    SENSOR_ACTIVED: 'SENSOR_ACTIVED',
    ENTRY_TIME_CHANGED: 'ENTRY_TIME_CHANGED',
    EXIT_TIME_CHANGED: 'EXIT_TIME_CHANGED',
    BEEP_CHANGED: 'BEEP_CHANGED',
    SILENT_ALARM_CHANGED: 'SILENT_ALARM_CHANGED',
    CENTRAL_PHONE_CHANGED: 'CENTRAL_PHONE_CHANGED',
    ADMIN_PHONE_CHANGED: 'ADMIN_PHONE_CHANGED',
    OWNER_PHONE_ADDED: 'OWNER_PHONE_ADDED',
    OWNER_PHONE_CHANGED: 'OWNER_PHONE_CHANGED',
    OWNER_PHONE_DELETED: 'OWNER_PHONE_DELETED',
    CENTRAL_EMAIL_CHANGED: 'CENTRAL_EMAIL_CHANGED',
    ADMIN_EMAIL_CHANGED: 'ADMIN_EMAIL_CHANGED',
    OWNER_EMAIL_ADDED: 'OWNER_EMAIL_ADDED',
    OWNER_EMAIL_CHANGED: 'OWNER_EMAIL_CHANGED',
    OWNER_EMAIL_DELETED: 'OWNER_EMAIL_DELETED',
    BYPASS_CHANGE: 'BYPASS_CHANGE',
    SYSTEM_ARMED: 'SYSTEM_ARMED',
    SYSTEM_DISARMED: 'SYSTEM_DISARMED',
    SYSTEM_ALARMED: 'SYSTEM_ALARMED',
    SYSTEM_ALERT: 'SYSTEM_ALERT',
    SIREN_ACTIVED: 'SIREN_ACTIVED',
    SIREN_SILENCED: 'SIREN_SILENCED',
    MAX_ALERTS: 'MAX_ALERTS',
    MAX_UNAUTHORIZED_INTENTS: 'MAX_UNAUTHORIZED_INTENTS',
    WEB_SOCKET_CONNECTED: 'WEB_SOCKET_CONNECTED',
    WEB_SOCKET_DISCONNECTED: 'WEB_SOCKET_DISCONNECTED',
    MQTT_CONNECTED: 'MQTT_CONNECTED',
    MQTT_DISCONNECTED: 'MQTT_DISCONNECTED',
    SERVER_LWT_ONLINE: 'SERVER_LWT_ONLINE',
    SERVER_LWT_OFFLINE: 'SERVER_LWT_OFFLINE',
    SENSORS_UPDATED: 'SENSORS_UPDATED'
};

export const ProtocolMesssages = {
    Time: 'Time',
    Events: 'Events',
    Sensors: 'Sensors',
    is: 'is',
    Who: 'Who',
    state: 'state',
    command: 'command'
};

const PayloadEvents = [
    AtsEvents.SYSTEM_STATE_CHANGED,
    AtsEvents.SYSTEM_ALARMED,
    AtsEvents.SYSTEM_ARMED,
    AtsEvents.SYSTEM_DISARMED,
    AtsEvents.SYSTEM_ALERT
];

export const AtsModes = ['AWAY', 'STAY', 'MAXIMUM', 'NIGHT STAY', 'INSTANT', 'CHIME'];

export const AtsStates = ['READY', 'DISARMED', 'LEAVING', 'ARMED', 'ENTERING', 'ALARMED', 'PROGRAMMING'];

export enum SensorTypes {
    PIR_MOTION = 0,
    MAGNETIC_SWITCH = 1,
    IR_SWITCH = 2
}

export enum SensorGroup {
    INTERIOR = 0,
    PERIMETER = 1,
    EXTERIOR = 2,
    ACCESS = 3
}

export interface SensorLocation {
    mac: string;
    pin: number;
}

export interface Sensor {
    location: SensorLocation;
    type: SensorTypes;
    name: string;
    group: SensorGroup;
    bypass: boolean;
    chime?: string;
    online?: boolean;
}

export interface SystemState {
    before: number;
    state: number;
    mode: number;
    activedSensors: Array<number>;
    leftTime: number;
    uptime: number;
}

export enum AtsErrors {
    NOT_AUTHORIZED = 0,
    INVALID_SYSTEM_STATE = 1,
    BAD_REQUEST = 2,
    WAS_A_PROBLEM = 3,
    EMPTY_RESPONSE = 4,
    NOT_CONNECTED = 5,
    TIMEOUT = 6
}

export interface Channel {
    connect(): void;
    connected(): boolean;
    onConnected(handler: () => void): void;
    onDisconnected(handler: () => void): void;
    getServerTime(): Promise<number>;
    sendIsMessage(token: string): void;
    getState(token: string): Promise<SystemState>;
    arm(token: string, mode: number, code?: string): Promise<void>;
    disarm(token: string, code: string): Promise<void>;
    bypass(token: string, location: SensorLocation, code: string): Promise<void>;
    bypassAll(token: string, locations: SensorLocation[], code: string): Promise<void>;
    clearBypass(token: string, code: string): Promise<void>;
    clearBypassOne(token: string, location: SensorLocation, code: string): Promise<void>;
    programm(token: string, code: string): Promise<void>;
    onReceiveTime(handler: (time: number) => void): void;
    onReceiveWho(handler: () => void): void;
    onReceiveEvents(handler: (config: any) => void): void;
    onReceiveSensors(handler: (sensors: any) => void): void;
    subscribe(topic: string, callback: (data: any) => void, config?: any): void;
}

@Injectable({
  providedIn: 'root'
})
export class AtsService {

  private timeDiff = 0;
  private lastTimeSynchronization: Date | null = null;
  private timeSynchronizationFrequency = 10;
  private timeSynchronizationIntervalId: NodeJS.Timeout | null = null;

  private sensorList: Array<Sensor> = [];

  private listeners: any = {};

  constructor(
      private webSocketChannel: WebSocketChannel,
      private mqttChannel: MQTTChannel) {

    this.startWebSocketChannel();

    this.startMQTTChannel();

    if (environment.channel === 'ws') {
      this.webSocketChannel.connect();
    } else {
      this.mqttChannel.connect();
    }

    this.startServerTimeSync();
  }

  get sensors(): Array<Sensor> {
    return this.sensorList;
  }

  get connected(): boolean {
    return this.webSocketChannel.connected() || this.mqttChannel.connected();
  }

  get locallyConnected(): boolean {
    return this.webSocketChannel.connected();
  }

  get remotelyConnected(): boolean {
    return this.mqttChannel.connected();
  }

  private startWebSocketChannel(): void {
    this.webSocketChannel.onConnected(this.onWebSocketChannelConnected.bind(this));
    this.webSocketChannel.onDisconnected(this.onWebSocketChannelDisconnected.bind(this));
    this.webSocketChannel.onReceiveTime(this.onReceiveTime.bind(this));
    this.webSocketChannel.onReceiveWho(this.onReceiveWho.bind(this));
    this.webSocketChannel.onReceiveEvents((c: any) => this.onReceiveEventsFromWebSockets.call(this, this.webSocketChannel, c));
    this.webSocketChannel.onReceiveSensors(this.onReceiveSensors.bind(this));
  }

  private startMQTTChannel(): void {
    this.mqttChannel.onConnected(this.onMQTTChannelConnected.bind(this));
    this.mqttChannel.onDisconnected(this.onMQTTChannelDisconnected.bind(this));
    this.mqttChannel.onReceiveTime(this.onReceiveTime.bind(this));
    this.mqttChannel.onReceiveWho(this.onReceiveWho.bind(this));
    this.mqttChannel.onReceiveEvents((c: any) => this.onReceiveEventsFromMqtt.call(this, this.mqttChannel, c));
    this.mqttChannel.onReceiveSensors(this.onReceiveSensors.bind(this));
    (this.mqttChannel as MQTTChannel).onLWT(this.onLWT.bind(this));
  }

  private startServerTimeSync(): void {
    const frequency: number = 60000 * this.timeSynchronizationFrequency; // minutes
    this.timeSynchronizationIntervalId = setInterval(this.syncServerTime.bind(this), frequency);
  }

  private getToken(): string {
    const time = Date.now() - this.timeDiff;
    const epoch = Math.round(time / 1000.0);
    const code = getTotp(CLIENT_SECRET, { epoch });
    return code;
  }

  private getChannel(): Channel {
    if (this.webSocketChannel.connected()) {
      console.log('using WebSockets');
      return this.webSocketChannel;
    } else {
      console.log('using MQTT');
      return this.mqttChannel;
    }
  }

  private onWebSocketChannelConnected(): void {
    if (!this.timeSynchronizationIntervalId || !this.lastTimeSynchronization) {
      this.startServerTimeSync();
    }
    this.publish(AtsEvents.WEB_SOCKET_CONNECTED);
  }

  private onWebSocketChannelDisconnected(): void {
    if (!this.connected) {
      clearInterval(this.timeSynchronizationIntervalId);
      this.timeSynchronizationIntervalId = null;
      this.lastTimeSynchronization = null;
    }
    this.publish(AtsEvents.WEB_SOCKET_DISCONNECTED);
  }

  private onMQTTChannelConnected(): void {
    if (!this.timeSynchronizationIntervalId || !this.lastTimeSynchronization) {
      this.startServerTimeSync();
    }
    this.publish(AtsEvents.MQTT_CONNECTED);
  }

  private onMQTTChannelDisconnected(): void {
    if (!this.connected) {
      clearInterval(this.timeSynchronizationIntervalId);
      this.timeSynchronizationIntervalId = null;
      this.lastTimeSynchronization = null;
    }
    this.publish(AtsEvents.MQTT_DISCONNECTED);
  }

  private syncServerTime(): void {
    this.getChannel().getServerTime()
      .then(this.onReceiveTime.bind(this));
  }

  private onReceiveTime(time: number): void {
    const serverTime = new Date(time * 1000);
    const localTime = new Date();
    this.timeDiff = localTime.getTime() - serverTime.getTime();
    this.lastTimeSynchronization = localTime;
  }

  private onReceiveWho(): void {
    let needSync = false;
    let wait = 10;
    if (this.lastTimeSynchronization) {
      const frequency: number = 60000 * this.timeSynchronizationFrequency; // minutes
      const localTime = new Date();
      if (localTime.getTime() - this.lastTimeSynchronization.getTime() > frequency) {
        needSync = true;
      }
    } else {
      needSync = true;
    }
    if (needSync) {
      this.syncServerTime();
      wait = 2000;
    }
    setTimeout(() => {
      const token: string = this.getToken();
      this.getChannel().sendIsMessage(token);
    }, wait);
  }

  private payloadEventsIncludes(event: string): boolean {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < PayloadEvents.length; i++) {
        if (PayloadEvents[i] === event) {
            return true;
        }
    }
    return false;
  }

  private handleEventWithPayloadCode(data: any, event: string): void {
    const d = data.toString();
    const systemState = { state: 0, mode: 0, activedSensors: [] };
    systemState.state = Number.parseInt(d.charAt(0), 32);
    systemState.mode = Number.parseInt(d.charAt(1), 32);
    const leftTimeout = Number.parseInt(d.charAt(2) + '' + d.charAt(3), 32);
    const count = Number.parseInt(d.charAt(4) + '' + d.charAt(5), 32);
    for (let i = 6; i < 6 + count * 2; i++) {
      systemState.activedSensors.push(Number.parseInt(d.charAt(i++) + '' + d.charAt(i), 32));
    }
    const payload = { system: systemState, leftTimeout };
    this.publish(AtsEvents[event], payload);
  }

  private onReceiveEventsFromWebSockets(channel: Channel, config: any): void {
    // tslint:disable-next-line: forin
    for (const event in config) {
      let cb: (data: any) => void;
      if (this.payloadEventsIncludes(event)) {
        cb = (data: any): void => this.handleEventWithPayloadCode.call(this, data, event);
      } else {
        cb = (data: any): void => this.publish(AtsEvents[event], data);
      }
      channel.subscribe(event, cb, config);
    }
  }

  private onReceiveEventsFromMqtt(channel: Channel, config: any): void {
    // tslint:disable-next-line: forin
    for (const event in config) {
      channel.subscribe(event, d => this.publish(AtsEvents[event], d), config);
    }
  }

  private onReceiveSensors(sensors: any): void {
      if (sensors && Array.isArray(sensors)) {
          this.sensorList = sensors;
      } else {
          this.sensorList = [];
      }
      this.publish(AtsEvents.SENSORS_UPDATED, this.sensorList);
  }

  private onLWT(online: boolean): void {
    console.log('onLWT', online);
    if (online) {
      this.publish(AtsEvents.SERVER_LWT_ONLINE);
    } else {
      this.publish(AtsEvents.SERVER_LWT_OFFLINE);
    }
  }

  private publish(event: string, data?: any): void {
    if (AtsEvents[event] && this.listeners[event]) {
      this.listeners[event].forEach((h: (data: any) => any) => h(data));
    }
  }

  getState(): Promise<SystemState> {
    const token: string = this.getToken();
    return this.getChannel().getState(token);
  }

  arm(mode: number, code?: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().arm(token, mode, code);
  }

  disarm(code: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().disarm(token, code);
  }

  bypass(location: SensorLocation, code: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().bypass(token, location, code);
  }

  bypassAll(locations: SensorLocation[], code: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().bypassAll(token, locations, code);
  }

  clearBypass(code: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().clearBypass(token, code);
  }

  clearBypassOne(location: SensorLocation, code: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().clearBypassOne(token, location, code);
  }

  programm(code: string): Promise<void> {
    const token: string = this.getToken();
    return this.getChannel().programm(token, code);
  }

  subscribe(event: string, callback: (data: any) => void): void {
    if (AtsEvents[event]) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      if (typeof callback === 'function') {
        this.listeners[event].push(callback);
      }
    }
  }

  getSensor(index: number): Sensor | null {
    if (index >= 0 && index < this.sensorList.length) {
      return this.sensorList[index];
    }
    return null;
  }
}
