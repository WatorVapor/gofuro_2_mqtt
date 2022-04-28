window.addEventListener('load', (evt) => {
  createApps();
});

let portVM = false;
const KEY_GPIO_CHECK = 'gofuro2/gpio/selected';
const DEFAULT_GPIO_CHECK_VALUE = [
];
for(let i = 1;i < 41;i++) {
  if(i === 26) {
    DEFAULT_GPIO_CHECK_VALUE.push({gpio:i,value:1});
  } else {
    DEFAULT_GPIO_CHECK_VALUE.push({gpio:i,value:0});    
  }
}
const createApps = () => {
  const debugApp = Vue.createApp({
    data() {
      let ports = [];
      try {
        const lsGpioStr = localStorage.getItem(KEY_GPIO_CHECK);
        if(lsGpioStr) {
          ports = JSON.parse(lsGpioStr);
        }
      } catch(err) {
        ports = DEFAULT_GPIO_CHECK_VALUE;
        localStorage.setItem(KEY_GPIO_CHECK,JSON.stringify(DEFAULT_GPIO_CHECK_VALUE));
      }
      return {
        ports:ports
      };
    },
    methods: {
    }
  });
  portVM = debugApp.mount('#vue-ui-gpio-port');
}
