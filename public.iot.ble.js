const constPublicIotServiceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const constPublicIotRxUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const constPublicIotTxUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const constPublicIotBleFilter = {
  filters:[
    {namePrefix: 'PublicIot'}
  ],
  optionalServices:[
    constPublicIotServiceUUID
  ]
};

const BLE = {
  tx:false,
  rx:false,
};
const uiClickSearchBleDevice = async (elem) => {
  const device = await navigator.bluetooth.requestDevice(constPublicIotBleFilter);
  console.log('::uiClickSearchBleDevice::device=<',device,'>');
  const server = await device.gatt.connect();
  console.log('::uiClickSearchBleDevice::server=<',server,'>');
  const service = await server.getPrimaryService(constPublicIotServiceUUID);
  console.log('::uiClickSearchBleDevice::service=<',service,'>');
  const rxCh = await service.getCharacteristic(constPublicIotRxUUID);
  console.log('::uiClickSearchBleDevice::rxCh=<',rxCh,'>');
  
  rxCh.startNotifications().then(char => {
    rxCh.addEventListener('characteristicvaluechanged', (event) => {
      //console.log('::uiClickSearchBleDevice::event=<',event,'>');
      onBleData(rxCh,event.target.value)
    });
  })
  const txCh = await service.getCharacteristic(constPublicIotTxUUID);
  console.log('::uiClickSearchBleDevice::txCh=<',txCh,'>');
  BLE.tx = txCh;
}

const onBleData = (characteristic,value) => {
  //console.log('::onBleData::characteristic=<',characteristic,'>');
  //console.log('::onBleData::value=<',value,'>');
  const decoder = new TextDecoder('utf-8');
  const strData = decoder.decode(value).trim();
  //console.log('::onBleData::strData=<',strData,'>');
  const jData = JSON.parse(strData);
  console.log('::onBleData::jData=<',jData,'>');
}

const writeJsonCmd = (jCmd) => {
  const strCmd = JSON.stringify(jCmd);
  //console.log('::writeJsonCmd::strCmd=<',strCmd,'>');
  const bufCmd = new TextEncoder('utf-8').encode(strCmd);
  //console.log('::writeJsonCmd::bufCmd=<',bufCmd,'>');
  if(BLE.tx) {
    //console.log('::writeJsonCmd::BLE.tx=<',BLE.tx,'>');
    BLE.tx.writeValue(bufCmd);
  }  
}

const allowDevicePubKeyByBle = (pubKey,name) => {
  console.log('::allowDevicePubKeyByBle::pubKey=<',pubKey,'>');
  console.log('::allowDevicePubKeyByBle::name=<',name,'>');
  const allow = {
    allow:{
      pubKey:pubKey,
      name:name
  }};
  writeJsonCmd(allow);
}

const denyDevicePubKeyByBle = (pubKey) => {
  console.log('::denyDevicePubKeyByBle::pubKey=<',pubKey,'>');
  const deny = {
    deny:{
      pubKey:pubKey
  }};
  writeJsonCmd(deny);
}

