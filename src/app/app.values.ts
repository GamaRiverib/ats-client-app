import { SensorLocation } from './services/ats.service';

export const KEYS_ICONS = [
    'ready',
    'disarmed',
    'leaving',
    'armed',
    'entering',
    'alarmed',
    'programming'
];

export const SensorTypesFriendlyNames = [
    'Pir motion',
    'Magnetic switch',
    'IR switch'
];

export const SensorGroupFriendlyNames = [
    'Interior',
    'Perimeter',
    'Exterior',
    'Access'
];

export interface SensorData {
    location: SensorLocation;
    name: string;
    type: number;
    group: number;
    typeName: string;
    groupName: string;
    actived: boolean;
    bypass: boolean;
    online: boolean;
}

export const PATHS = {
    PROGRAMMING: 'programming',
    PROGRAMMING_SENSORS: 'programming/sensors'
};
