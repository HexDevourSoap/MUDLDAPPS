import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router";
import { createPinia } from "pinia";
import vuetify from "./plugins/vuetify";
// import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.mount("#app");