import { createApp } from 'vue';
import App from './App.vue';

import mdiVue from 'mdi-vue/v3';
import * as mdijs from '@mdi/js';

import './assets/main.css';

const theApp = createApp(App);

// `App` according to the vue 3 documentation

theApp.use(mdiVue, {
  icons: mdijs
}); // etc...

theApp.mount('#app');
