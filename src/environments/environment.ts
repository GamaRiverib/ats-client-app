// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false
};

export const CLIENT_ID = 'devmobile';
export const CLIENT_SECRET = '0DOH6NGJ1HB1ERPF';
export const SERVER_URL = 'https://192.168.0.173:3443';
export const BROKER = {
  host: '192.168.0.173',
  port: 8883,
  protocol: 'ws',
  username: '',
  password: '',
  topic: '/ats',
  commands: 'commands'
};
export const SERVER_TRUST_MODE = 'pinned';

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
