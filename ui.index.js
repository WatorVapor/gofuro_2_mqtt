const KEY_GPIO_SELECTION = 'gofuro2/gpio/selection';

window.addEventListener('load', (evt) => {
  createApps();
});

const gPortApp = {
  gpio:{
    selected:26,
    ports:[]
  }
};
const loadDefaultOfPortApp = () => {
  for(let i = 1;i < 41;i++) {
      gPortApp.gpio.ports.push(i);
  }
}
const createApps = () => {
  const gpioApp = Vue.createApp({
    data() {
      try {
        const lsGpioStr = localStorage.getItem(KEY_GPIO_SELECTION);
        console.log('createApps::lsGpioStr:=<', lsGpioStr, '>');
        if(lsGpioStr) {
          gPortApp.gpio = JSON.parse(lsGpioStr);
        } else {
          loadDefaultOfPortApp();
          localStorage.setItem(KEY_GPIO_SELECTION,JSON.stringify(gPortApp.gpio));
        }
      } catch(err) {
        loadDefaultOfPortApp();
        localStorage.setItem(KEY_GPIO_SELECTION,JSON.stringify(gPortApp.gpio));
      }
      return {
        gpio:gPortApp.gpio
      };
    },
    methods: {
      onChange(evt) {
        console.log('createApps::evt:=<', evt, '>');
        localStorage.setItem(KEY_GPIO_SELECTION,JSON.stringify(this.gpio));
      }
    }
  });
  gPortApp.vm = gpioApp.mount('#vue-ui-gpio-port');
  console.log('createApps::gPortApp:=<', gPortApp, '>');
}
