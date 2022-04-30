document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(() => {
    createBleApp();
  },100);
})
const gPairBleApp = {
};

const createBleApp = () => {
  const app = Vue.createApp({
    data() {
      return {
        pubKey:getPubKey(),
        name:'',
        allows:[
          {
            pubKey:'***',
            name:'---'
          }
        ]
      }
    },
    methods: {
      allowDevicePermission(evt) {
        //console.log('allowDevicePermission::evt:=<', evt, '>');
        //console.log('allowDevicePermission::this.pubKey:=<', this.pubKey, '>');
        //console.log('allowDevicePermission::this.name:=<', this.name, '>');
        allowDevicePubKeyByBle(this.pubKey,this.name);
      },
      denyDevicePermission(pubKey) {
        console.log('denyDevicePermission::pubKey:=<', pubKey, '>');
        denyDevicePubKeyByBle(pubKey);
      }
    }
  });
  gPairBleApp.vm = app.mount('#vue-ui-ble-pairing');
  console.log('createBleApp::gPairBleApp:=<', gPairBleApp, '>');
};
