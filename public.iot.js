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
    console.log('onCreateMqttConnection::on message message:=<', message.toString('utf-8'), '>');    
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
const publishGpio = (port,output) => {
  console.log('publishGpio::port:=<', port, '>');
  const msg = {
    d_out:{
      port:port,
      level:output
    }
  };
  const signedMsg = signByEd25519(msg);
  console.log('publishGpio::signedMsg:=<', signedMsg, '>');
  console.log('publishGpio::publicKeyB64:=<', publicKeyB64, '>');
  console.log('publishGpio::gMqttClient.connected:=<', gMqttClient.connected, '>');
  const allMsg = JSON.stringify(signedMsg);
  console.log('publishGpio::allMsg:=<', allMsg, '>');
  console.log('publishGpio::allMsg.length:=<', allMsg.length, '>');
  publishMqttMsg(allMsg);
}

const BUFFER_MAX_SIZE = 64;
const gSendBufferOfMqtt = [];
const MQTT_SEND_INTERVAL = 1000;
const publishMqttMsg = (allMsg) => {
  for(let start = 0;start < allMsg.length;start += BUFFER_MAX_SIZE) {
    const end = start + BUFFER_MAX_SIZE;
    if(end > allMsg.length) {
      const sendBuffer = allMsg.substring(start);
      const sendMsg = {
        buff:sendBuffer,
        finnish:true
      };
      const oneBuffer = JSON.stringify(sendMsg);
      gSendBufferOfMqtt.push(oneBuffer);
    } else {
      const sendBuffer = allMsg.substring(start,end);
      const sendMsg = {
        buff:sendBuffer,
        finnish:false
      };
      const oneBuffer = JSON.stringify(sendMsg);
      gSendBufferOfMqtt.push(oneBuffer);
    }
  }
  setTimeout(()=>{
    publishMsgStepByStep();
  },MQTT_SEND_INTERVAL);
}
const publishMsgStepByStep = ()=> {
  if(gSendBufferOfMqtt.length > 0) {
    const oneBuffer = gSendBufferOfMqtt[0];
    console.log('publishMqttMsg::oneBuffer:=<', oneBuffer, '>');
    console.log('publishMqttMsg::oneBuffer.length:=<', oneBuffer.length, '>');
    gMqttClient.publish(publicKeyB64,oneBuffer,{qos:1});
    gSendBufferOfMqtt.shift();
    setTimeout(()=>{
      publishMsgStepByStep();
    },MQTT_SEND_INTERVAL);    
  }
}

const signByEd25519 = (msg) => {
  msg.iss = (new Date()).toISOString();
  const payloadStr = JSON.stringify(msg);

  const encoder = new TextEncoder();
  const msgHashBin = nacl.hash(encoder.encode(payloadStr));
  console.log('signByEd25519::msgHashBin:=<', msgHashBin, '>');
  
  const signedMsg = {};
  signedMsg.payload = msg;
  const signedHash = nacl.sign(msgHashBin, secretKeyBin);
  signedMsg.auth = {};
  signedMsg.auth.sha = nacl.util.encodeBase64(msgHashBin);
  signedMsg.auth.pub = publicKeyB64;
  signedMsg.auth.sign = nacl.util.encodeBase64(signedHash);
  return signedMsg;
}
