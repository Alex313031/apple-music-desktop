/* eslint-disable */
global.ipc = require('electron').ipcRenderer;

global.ipc.invoke('finished-preload');
