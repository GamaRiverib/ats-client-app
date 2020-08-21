import { Injectable } from '@angular/core';
import { MqttService, IMqttServiceOptions, IMqttMessage,
         IOnConnectEvent, IOnErrorEvent, IPublishOptions } from 'ngx-mqtt';
import { Channel, AtsErrors, SystemState, SensorLocation } from '../app.values';
import { BROKER, CLIENT_ID } from 'src/environments/environment';

const brokerUrl = BROKER.host;
const brokerPort = BROKER.port;
const brokerProtocol = BROKER.protocol as 'ws' | 'wss';
const mqttUser = BROKER.username;
const mqttPass = BROKER.password;
const mqttTopic = BROKER.topic;
const cmndTopic = BROKER.commands;

const timeout = 30000;

interface Listener {
  topic: string;
  callback: [(data: any) => void];
}

@Injectable({
  providedIn: 'root'
})
export class MQTTChannel implements Channel {

  private online = false;

  private connectedHandler: () => void = null;
  private disconnectedHandler: () => void = null;

  private receiveTimeHandler: (time: number) => void = null;
  private receiveWhoHandler: () => void = null;
  private receiveEventsHandler: (config: any) => void = null;
  private receiveSensorsHandler: (sensors: any) => void = null;

  private lwtHandler: (online: boolean) => void = null;

  private listeners: Listener[] = [];

  constructor(private mqttService: MqttService) {
    this.init();
  }

  private init(): void {
    this.mqttService.onError.subscribe(this.onMqttConnectionFailure.bind(this));
    this.mqttService.onConnect.subscribe(this.onMqttConnectionSuccess.bind(this));
    this.mqttService.onOffline.subscribe(this.onMqttConnectionLost.bind(this));
    // this.mqttService.onMessageArrived.on(this.onMqttMessageArrived.bind(this));
  }

  private onMqttConnectionFailure(event: IOnErrorEvent): void {
    this.online = false;
    console.log('MQTT connection failure', event);
  }

  private onMqttConnectionSuccess(event: IOnConnectEvent): void {
    this.online = true;
    if (this.connectedHandler) {
      this.connectedHandler();
    }
    console.log('Connected to MQTT', brokerUrl, brokerPort);
    try {
      this.mqttService
        .observe(`${mqttTopic}/time`, { qos: 0 })
        .subscribe(this.onMqttMessageArrived.bind(this));
      this.mqttService
        .observe(`${mqttTopic}/sensors`, { qos: 0 })
        .subscribe(this.onMqttMessageArrived.bind(this));
      this.mqttService
        .observe(`${mqttTopic}/events`, { qos: 0 })
        .subscribe(this.onMqttMessageArrived.bind(this));
      this.mqttService
        .observe(`${mqttTopic}/lwt`, { qos: 0 })
        .subscribe(this.onMqttMessageArrived.bind(this));
      this.mqttService
        .observe(`${mqttTopic}/devices/${CLIENT_ID}/response/#`, { qos: 0 })
        .subscribe(this.onMqttMessageArrived.bind(this));
      this.mqttService
        .observe(`${mqttTopic}/state/#`, { qos: 0 })
        .subscribe(this.onMqttMessageArrived.bind(this));
    } catch (e) {
      console.log(e);
    }
  }

  private onMqttConnectionLost(): void {
    this.online = false;
    if (this.disconnectedHandler) {
      this.disconnectedHandler();
    }
    console.log('MQTT connection lost');
  }

  private onMqttMessageArrived(message: IMqttMessage): void {
    const topic: string = message.topic;
    const subTopic: string = topic.substr(mqttTopic.length + 1);
    const payload: string = message.payload.toString();

    console.log(topic, payload);

    if (subTopic === 'sensors') {
      const sensors = JSON.parse(payload);
      this.receiveSensorsHandler(Array.isArray(sensors) ? sensors : []);
    } else if (subTopic === 'time') {
      const time: number = Number.parseInt(payload, 10);
      if (Number.isInteger(time) && time > 0) {
        this.receiveTimeHandler(time);
      }
    } else if (subTopic === 'events') {
      this.receiveEventsHandler(JSON.parse(payload));
    } else if (subTopic === 'lwt') {
      if (this.lwtHandler) {
        const online: boolean = payload.toLowerCase() === 'online';
        this.lwtHandler(online);
      }
    } else if (subTopic.startsWith('state/')) {
      const event: string = subTopic.split('/')[1];
      const state = JSON.parse(payload);
      console.log(event, state);
      this.emit(event, state);
    } else if (subTopic.startsWith(`devices/${CLIENT_ID}/response/`)) {
      const messageId: string = subTopic.split('/')[3];
      this.emit(messageId, payload);
      this.forgetResult(messageId);
    }
  }

  private getListenerIndex(topic: string): number {
    let index = -1;
    this.listeners.forEach((l: Listener, i: number) => {
      if (l.topic === topic) {
        index = i;
        return;
      }
    });
    return index;
  }

  private addListener(topic: string, callback: (data: any) => void): void {
    const index: number = this.getListenerIndex(topic);
    if (index >= 0) {
        this.listeners[index].callback.push(callback);
    } else {
        this.listeners.push({ topic, callback: [callback] });
    }
  }

  private removeAllListeners(topic: string): void {
    const index: number = this.getListenerIndex(topic);
    if (index >= 0) {
      this.listeners.slice(index, 1);
    }
  }

  private emit(topic: string, data: any): void {
    const index: number = this.getListenerIndex(topic);
    if (index >= 0) {
      const listeners = this.listeners[index].callback;
      listeners.forEach((l: (data: any) => void) => {
        if (l) {
          l(data);
        }
      });
    }
  }

  private waitResult(messageId: string, callback: (data: any) => void): void {
    // this._mqtt.subscribe(`${mqttTopic}/devices/${this.clientId}/response/${messageId}`, { qos: 0 });
    this.addListener(messageId, callback);
  }

  private forgetResult(messageId: string): void {
    this.removeAllListeners(messageId);
    // this._mqtt.unsubscribe(`${mqttTopic}/devices/${this.clientId}/response/${messageId}`);
  }

  connect(): void {
    console.log('MQTT connected', this.connected());
    if (this.connected()) {
      console.log('MQTT channel is already connected');
      return;
    }
    console.log('Connecting to MQTT broker...');

    const opts: IMqttServiceOptions = {
      hostname: brokerUrl,
      port: brokerPort,
      protocol: brokerProtocol,
      username: mqttUser,
      password: mqttPass,
      reconnectPeriod: 3000,
      clean: false,
      clientId: `${CLIENT_ID}-${Math.floor((Math.random() * 1000) + 1)}`
    };

    this.mqttService.connect(opts);
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

  getServerTime(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      if (!this.connected()) {
        reject({ error: AtsErrors.NOT_CONNECTED });
      }
      const messageId = `${Date.now().toString().substr(3)}`;

      const payload = {
          command: 'time',
          id: messageId
      };

      const topic = `${mqttTopic}/devices/${CLIENT_ID}/${cmndTopic}`;
      const message = JSON.stringify(payload);
      const opts: IPublishOptions = {
        qos: 0,
        retain: false
      };

      const callback = (data: any) => {
        clearTimeout(timeoutId);
        timeoutId = null;
        const response: number = Number.parseInt(data, 10);
        resolve(response);
      };

      this.waitResult(messageId, callback);

      let timeoutId = setTimeout(() => {
        this.forgetResult(messageId);
        reject({ error: AtsErrors.TIMEOUT });
      }, timeout);

      this.mqttService.unsafePublish(topic, message, opts);
    });
  }

  sendIsMessage(token: string): void {
    throw new Error('Method not implemented.');
  }

  getState(token: string): Promise<SystemState> {
    return new Promise<SystemState>((resolve, reject) => {
      if (!this.connected()) {
        reject({ error: AtsErrors.NOT_CONNECTED });
      }
      let messageId: string;
      if (token) {
        messageId = `${token}${Date.now().toString().substr(9)}`;
      } else {
        messageId = `${Date.now().toString().substr(3)}`;
      }

      const payload = {
        command: 'state',
        id: messageId
      };

      const topic = `${mqttTopic}/devices/${CLIENT_ID}/${cmndTopic}`;
      const message = JSON.stringify(payload);
      const opts: IPublishOptions = {
        qos: 0,
        retain: false
      };

      const callback = (data: any): void => {
        clearTimeout(timeoutId);
        timeoutId = null;
        const response: SystemState = JSON.parse(data);
        resolve(response);
      };

      this.waitResult(messageId, callback);

      let timeoutId = setTimeout(() => {
        this.forgetResult(messageId);
        reject({ error: AtsErrors.TIMEOUT });
      }, timeout);

      this.mqttService.unsafePublish(topic, message, opts);
    });
  }

  arm(token: string, mode: number, code?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.connected()) {
        console.log('ERROR', 'MQTT Channel disconnected');
        reject({ error: AtsErrors.NOT_CONNECTED });
      }

      const messageId = `${token}${Date.now().toString().substr(9)}`;
      const command = 'arm';
      const payload: any = { command, id: messageId, params: { token, mode, code }};

      const topic = `${mqttTopic}/devices/${CLIENT_ID}/${cmndTopic}`;
      const message = JSON.stringify(payload);
      const opts: IPublishOptions = {
        qos: 0,
        retain: false
      };

      const callback = (data: any) => {
        clearTimeout(timeoutId);
        if (data && data.toString() === 'TRUE') {
          resolve();
        } else {
          reject({ error: -1 });
        }
      };

      this.waitResult(messageId, callback);

      const timeoutId = setTimeout(() => {
        this.forgetResult(messageId);
        reject({ error: AtsErrors.TIMEOUT });
      }, timeout);

      this.mqttService.unsafePublish(topic, message, opts);
    });
  }

  disarm(token: string, code: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.connected()) {
        console.log('ERROR', 'MQTT Channel disconnected');
        reject({ error: AtsErrors.NOT_CONNECTED });
      }

      const messageId = `${token}${Date.now().toString().substr(9)}`;
      const command = 'disarm';
      const payload: any = { command, id: messageId, params: { token, code }};

      const topic = `${mqttTopic}/devices/${CLIENT_ID}/${cmndTopic}`;
      const message = JSON.stringify(payload);
      const opts: IPublishOptions = {
        qos: 0,
        retain: false
      };

      const callback = (data: any) => {
        clearTimeout(timeoutId);
        if (data && data.toString() === 'TRUE') {
          resolve();
        } else {
          reject({ error: -1 });
        }
      };

      this.waitResult(messageId, callback);

      const timeoutId = setTimeout(() => {
        this.forgetResult(messageId);
        reject({ error: AtsErrors.TIMEOUT });
      }, timeout);

      this.mqttService.unsafePublish(topic, message, opts);
    });
  }

  bypass(token: string, location: SensorLocation, code: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.connected()) {
        reject({ error: AtsErrors.NOT_CONNECTED });
      }

      const messageId = `${token}${Date.now().toString().substr(9)}`;
      const command = 'bypass';
      const payload: any = { command, id: messageId, params: { token, code, location }};

      const topic = `${mqttTopic}/devices/${CLIENT_ID}/${cmndTopic}`;
      const message = JSON.stringify(payload);
      const opts: IPublishOptions = {
        qos: 0,
        retain: false
      };

      const callback = (data: any) => {
        clearTimeout(timeoutId);
        if (data && data.toString() === 'TRUE') {
          resolve();
        } else {
          reject({ error: -1 });
        }
      };

      this.waitResult(messageId, callback);

      const timeoutId = setTimeout(() => {
        this.forgetResult(messageId);
        reject({ error: AtsErrors.TIMEOUT });
      }, timeout);

      try {
        this.mqttService.unsafePublish(topic, message, opts);
      } catch (e) {
        console.log(e);
        reject({ error: e });
      }
    });
  }

  bypassAll(token: string, locations: SensorLocation[], code: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  clearBypass(token: string, code: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  clearBypassOne(token: string, location: SensorLocation, code: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.connected()) {
        reject({ error: AtsErrors.NOT_CONNECTED });
      }

      const messageId = `${token}${Date.now().toString().substr(9)}`;
      const command = 'clearbypassone';
      const payload: any = { command, id: messageId, params: { token, code, location }};

      const topic = `${mqttTopic}/devices/${CLIENT_ID}/${cmndTopic}`;
      const message = JSON.stringify(payload);
      const opts: IPublishOptions = {
        qos: 0,
        retain: false
      };

      const callback = (data: any) => {
        clearTimeout(timeoutId);
        if (data && data.toString() === 'TRUE') {
          resolve();
        } else {
          reject({ error: -1 });
        }
      };

      this.waitResult(messageId, callback);

      const timeoutId = setTimeout(() => {
        this.forgetResult(messageId);
        reject({ error: AtsErrors.TIMEOUT });
      }, timeout);

      this.mqttService.unsafePublish(topic, message, opts);
    });
  }

  programm(token: string, code: string): Promise<void> {
    throw new Error('Method not implemented.');
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
    if (this.connected()) {
      this.addListener(topic, callback);
    }
  }

  onLWT(handler: (online: boolean) => void): void {
    this.lwtHandler = handler;
  }
}
