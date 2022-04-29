window.addEventListener('load', (evt) => {
  createPortApp();
  createOutputApp();
});

const KEY_GPIO_PORT_SELECTION = 'gofuro2/gpio/port/selection';
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
const createPortApp = () => {
  const app = Vue.createApp({
    data() {
      try {
        const lsGpioStr = localStorage.getItem(KEY_GPIO_PORT_SELECTION);
        console.log('createPortApp::lsGpioStr:=<', lsGpioStr, '>');
        if(lsGpioStr) {
          gPortApp.gpio = JSON.parse(lsGpioStr);
        } else {
          loadDefaultOfPortApp();
          localStorage.setItem(KEY_GPIO_PORT_SELECTION,JSON.stringify(gPortApp.gpio));
        }
      } catch(err) {
        loadDefaultOfPortApp();
        localStorage.setItem(KEY_GPIO_PORT_SELECTION,JSON.stringify(gPortApp.gpio));
      }
      return {
        gpio:gPortApp.gpio
      };
    },
    methods: {
      onChange(evt) {
        console.log('createPortApp::evt:=<', evt, '>');
        localStorage.setItem(KEY_GPIO_PORT_SELECTION,JSON.stringify(this.gpio));
      }
    }
  });
  gPortApp.vm = app.mount('#vue-ui-gpio-port');
  console.log('createApps::gPortApp:=<', gPortApp, '>');
}

const KEY_GPIO_OUTPUT_SELECTION = 'gofuro2/gpio/output/selection';
const gOutputApp = {
  gpio:{
    selected:0,
    values:[0,1]
  }
};

const createOutputApp = () => {
  const app = Vue.createApp({
    data() {
      try {
        const lsGpioStr = localStorage.getItem(KEY_GPIO_OUTPUT_SELECTION);
        console.log('createOutputApp::lsGpioStr:=<', lsGpioStr, '>');
        if(lsGpioStr) {
          gOutputApp.gpio = JSON.parse(lsGpioStr);
        } else {
          localStorage.setItem(KEY_GPIO_OUTPUT_SELECTION,JSON.stringify(gOutputApp.gpio));
        }
      } catch(err) {
        localStorage.setItem(KEY_GPIO_OUTPUT_SELECTION,JSON.stringify(gOutputApp.gpio));
      }
      return {
        gpio:gOutputApp.gpio
      };
    },
    methods: {
      onChange(evt) {
        console.log('createOutputApp::evt:=<', evt, '>');
        localStorage.setItem(KEY_GPIO_OUTPUT_SELECTION,JSON.stringify(this.gpio));
      }
    }
  });
  gOutputApp.vm = app.mount('#vue-ui-gpio-output');
  console.log('createOutputApp::gOutputApp:=<', gOutputApp, '>');
}

