
const getPubKey = ()=> {
  return publicKeyB64;
}

window.addEventListener('load', (evt) => {
  tryCreateEd25519Key();
});
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
}

const signByEd25519BadTest = (msg) => {
  msg.iss = (new Date()).toISOString();
  const payloadStr = JSON.stringify(msg);

  const encoder = new TextEncoder();
  const msgHashBin = nacl.hash(encoder.encode(payloadStr));
  console.log('signByEd25519BadTest::msgHashBin:=<', msgHashBin, '>');
  
  const signedMsg = {};
  signedMsg.payload = msg;
  
  const keyPair = nacl.sign.keyPair();
  
  const signedHash = nacl.sign(msgHashBin, keyPair.secretKey);
  signedMsg.auth = {};
  signedMsg.auth.sha = nacl.util.encodeBase64(msgHashBin);
  signedMsg.auth.pub = publicKeyB64;
  signedMsg.auth.sign = nacl.util.encodeBase64(signedHash);
  return signedMsg;
}
