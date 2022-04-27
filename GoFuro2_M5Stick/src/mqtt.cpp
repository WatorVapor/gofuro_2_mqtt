#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <map>
#include <PubSubClient.h>

/*
#include <Ed25519.h>
#include <SHA256.h>
*/

#include <base64.hpp>
extern "C" {
  #include <tweetnacl.h>
  //extern int crypto_sign_open(unsigned char *,unsigned long long *,const unsigned char *,unsigned long long,const unsigned char *);
}

#include "debug.hpp"

static const char* ssid = "mayingkuiG";
static const char* password = "xuanxuanhaohao";
static const char* mqtt_server = "broker.emqx.io";
static WiFiClient espClient;
static PubSubClient client(espClient);

static StaticJsonDocument<1024> gMattMsgDoc;


static unsigned char gBase64TempBinary[512];
static unsigned char gOpenedTempMsg[512];

static uint8_t gSignBinary[512];
static uint8_t gPublicKeyBinary[32];

static bool verifySign(const std::string &pub,const std::string &sign,const std::string &sha){
  LOG_S(pub);
  LOG_S(sign);
  LOG_S(sha);
  int pubRet = decode_base64((unsigned char*)pub.c_str(),pub.size(),gBase64TempBinary);
  LOG_I(pubRet);
  memcpy(gPublicKeyBinary,gBase64TempBinary,sizeof(gPublicKeyBinary));
  LOG_H(gPublicKeyBinary,sizeof(gPublicKeyBinary));
  int signRet = decode_base64((unsigned char*)sign.c_str(),sign.size(),gBase64TempBinary);
  LOG_I(signRet);
  memcpy(gSignBinary,gBase64TempBinary,signRet);
  LOG_H(gSignBinary,signRet);
  
  unsigned long long mSize = 0;
  unsigned long long signSize = signRet;
  int openRet = crypto_sign_open(gOpenedTempMsg,&mSize,gSignBinary,signSize,gPublicKeyBinary);
  if(openRet == 0){
    int shaRet = encode_base64(gOpenedTempMsg,signRet,gBase64TempBinary);
    std::string shaOpened((char*)gBase64TempBinary,shaRet);
    LOG_S(shaOpened);
    LOG_I(shaRet);
    LOG_I(sha.size());
    LOG_LL(mSize);
  }
  return false;
}
bool checkAuth(const JsonVariant &msg,const std::string &topic) {
  std::string pubStr;
  std::string signStr;
  std::string shaStr;
  if(msg.containsKey("pub")){
    pubStr = msg["pub"].as<std::string>();
    LOG_S(pubStr);
  }
  if(msg.containsKey("sign")){
    signStr = msg["sign"].as<std::string>();
    LOG_S(signStr);
  }
  if(msg.containsKey("sha")){
    shaStr = msg["sha"].as<std::string>();
    LOG_S(shaStr);
  }
  if(pubStr.empty() == false && signStr.empty() == false && shaStr.empty() == false) {
    return verifySign(pubStr,signStr,shaStr);
  }
  return false;
}
void onMqttAuthedMsg(const JsonVariant &msg) {

}

void execMqttMsg(const std::string &msg,const std::string &topic) {
  LOG_S(msg);
  LOG_S(topic);
  DeserializationError error = deserializeJson(gMattMsgDoc, msg);
  LOG_S(error);
  if(error == DeserializationError::Ok) {
    if(gMattMsgDoc.containsKey("auth")) {
      JsonVariant auth = gMattMsgDoc["auth"];
      bool isGood = checkAuth(auth,topic);
      if(isGood) {
        if(gMattMsgDoc.containsKey("payload")) {
          JsonVariant payload = gMattMsgDoc["payload"];
          onMqttAuthedMsg(payload);
        }
      }
    }
  }
}

static std::map<std::string,std::string> gChannelTempMsg;

void insertTopicMsg(const std::string &msg,const std::string &topic){
    auto ir = gChannelTempMsg.find(topic);
    if(ir == gChannelTempMsg.end()) {
      gChannelTempMsg[topic] = msg;
    } else {
      ir->second += msg;
    }
}
void processOneMqttMsg(const std::string &topic){
    auto ir = gChannelTempMsg.find(topic);
    if(ir != gChannelTempMsg.end()) {
      execMqttMsg(ir->second,ir->first);
      gChannelTempMsg.erase(ir);
    }
}


void onMqttMsg(StaticJsonDocument<256> &doc,const std::string &topic ){
  if(doc.containsKey("buff")) {
    std::string buffStr = doc["buff"].as<std::string>();
    LOG_S(buffStr);
    if(doc.containsKey("finnish")) {
      bool finnish = doc["finnish"].as<bool>();
      insertTopicMsg(buffStr,topic);
      if(finnish) {
        processOneMqttMsg(topic);
      }
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  std::string topicStr(topic);
  LOG_S(topicStr);
  std::string payloadStr((char*)payload,length);
  LOG_S(payloadStr);
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payloadStr);
  LOG_S(error);
  if(error == DeserializationError::Ok) {
    onMqttMsg(doc,topicStr);
  }
}


void setupMQTT(void) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while ( true ) {
    auto result = WiFi.waitForConnectResult();
    LOG_I(result);
    if(result == WL_CONNECTED){
      break;
    }
  }
  LOG_S(WiFi.localIP().toString());
  LOG_S(WiFi.localIPv6().toString());
  Serial.println("Wifi Is Ready");
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}


static const char *defaultTopics = "PkvtzBcBSmk9OAKtiyiiRugO42zfCduTV2r8YIuBCbs=";

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    auto rc = client.connect(clientId.c_str());
    if (rc) {
      LOG_I(client.connected());
      // ... and resubscribe
      client.subscribe(defaultTopics,1);
      // Once connected, publish an announcement...
      client.publish(defaultTopics, "hello world");
    } else {
      LOG_I(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}


void MQTTTask( void * parameter){
  int core = xPortGetCoreID();
  LOG_I(core);
  setupMQTT();
  for(;;) {//
    if (!client.connected()) {
      reconnect();
    }
    client.loop();
    delay(1);
  }
}
