window.addEventListener('load', (evt) => {
  tryCreateEd25519Key();
  onCreateMqttConnection();
});
const mqtturl = 'wss://broker.emqx.io:8084/mqtt';
let gMqttClient = false;
console.log('::mqtturl:=<', mqtturl, '>');
const clientID = 'mqttjs_' + Base58.encode(nacl.randomBytes(32))
console.log('::clientID:=<', clientID, '>');
const onCreateMqttConnection = () => {
  const options = {
    protocolId: 'MQTT',
    connectTimeout: 30 * 1000,
    clean: true,
    reconnectPeriod: 1000,
    // Authentication
    clientId: clientID,
    username: '',
    password: '',
    keepalive: 30*1000,
    clean: true,
  }
  gMqttClient = mqtt.connect(mqtturl,options);
  console.log('onCreateMqttConnection::gMqttClient.connected:=<', gMqttClient.connected, '>');
  gMqttClient.on('connect', () => {
    console.log('onCreateMqttConnection::gMqttClient.connected:=<', gMqttClient.connected, '>');
    const btn = document.getElementById('ui-gofuro-btn');
    console.log('onCreateMqttConnection::btn:=<', btn, '>');
    btn.disabled = false;
    gMqttClient.subscribe(publicKeyB64,{qos:1} );
  });
  gMqttClient.on('disconnect', () => {
    const btn = document.getElementById('ui-gofuro-btn');
    console.log('onCreateMqttConnection::btn:=<', btn, '>');
    btn.disabled = true;
  });
  gMqttClient.on('error', () => {
    const btn = document.getElementById('ui-gofuro-btn');
    console.log('onCreateMqttConnection::btn:=<', btn, '>');
    btn.disabled = true;
  });
  gMqttClient.on('message', (topic, message) => {
    console.log('onCreateMqttConnection::on message topic:=<', topic, '>');    
    console.log('onCreateMqttConnection::on message message:=<', message, '>');    
  });
}

const secretEdKeyPath = 'gofuro/v2/ed25519/secret';
const tryCreateEd25519Key = () => {
  const secretKey = localStorage.getItem(secretEdKeyPath);
  if(secretKey) {
    loadEd25519Key(secretKey);
  } else {
    const keyPair = nacl.sign.keyPair();
    console.log('tryCreateEd25519Key::keyPair:=<', keyPair, '>');
    const secretKey = nacl.util.encodeBase64(keyPair.secretKey);
    console.log('tryCreateEd25519Key::secretKey:=<', secretKey, '>');
    localStorage.setItem(secretEdKeyPath,secretKey);
    loadEd25519Key(secretKey);
  }
}
let secretKeyBin = false;
let publicKeyB64 = false;
let publicKeyB58 = false;
const loadEd25519Key = (secretKey)=> {
  console.log('loadEd25519Key::secretKey:=<', secretKey, '>');
  secretKeyBin = nacl.util.decodeBase64(secretKey);
  console.log('loadEd25519Key::secretKeyBin:=<', secretKeyBin, '>');
  const keyPair = nacl.sign.keyPair.fromSecretKey(secretKeyBin);
  console.log('loadEd25519Key::keyPair:=<', keyPair, '>');
  publicKeyB64 = nacl.util.encodeBase64(keyPair.publicKey);
  console.log('loadEd25519Key::publicKeyB64:=<', publicKeyB64, '>');
  publicKeyB58 = Base58.encode(keyPair.publicKey);
  console.log('loadEd25519Key::publicKeyB58:=<', publicKeyB58, '>');

  const keyElem = document.getElementById('ui-gofuro-public-key');
  console.log('onCreateMqttConnection::keyElem:=<', keyElem, '>');
  keyElem.textContent = 'addAuthedkey:<' + publicKeyB64 + '>';

}
const onUIClickGoFuro = (elem) => {
  console.log('onUIClickGoFuro::elem:=<', elem, '>');
  const radios = document.getElementsByName('gpio_port');
  for(const radio of radios) {
    console.log('onUIClickGoFuro::radio:=<', radio, '>');
    if (radio.checked) {
      publishGpio(parseInt(radio.value));
      break;
    }
  }
}
const publishGpio = (gpio) => {
  console.log('publishGpio::gpio:=<', gpio, '>');
  const msg = {
    gpio:gpio
  };
  const signedMsg = signByEd25519(msg);
  console.log('publishGpio::signedMsg:=<', signedMsg, '>');
  console.log('publishGpio::gMqttClient.connected:=<', gMqttClient.connected, '>');
  gMqttClient.publish(publicKeyB64,JSON.stringify(signedMsg));
}
const signByEd25519 = (msg) => {
  msg.iss = (new Date()).toISOString();
  const msgHash = CryptoJS.SHA256(JSON.stringify(msg)).toString(
    CryptoJS.enc.Base64
  );
  const signedMsg = {};
  signedMsg.payload = msg;
  const msgHashBin = nacl.util.decodeBase64(msgHash);
  const signedHash = nacl.sign(msgHashBin, secretKeyBin);
  signedMsg.auth = {};
  signedMsg.auth.pub = publicKeyB64;
  signedMsg.auth.sign = nacl.util.encodeBase64(signedHash);
  return signedMsg;
}
