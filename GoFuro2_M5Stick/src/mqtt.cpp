#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include "debug.hpp"

#include <PubSubClient.h>

static const char* ssid = "mayingkuiG";
static const char* password = "xuanxuanhaohao";
static const char* mqtt_server = "broker.emqx.io";
static WiFiClient espClient;
static PubSubClient client(espClient);


void callback(char* topic, byte* payload, unsigned int length) {
  LOG_SC(topic);
  std::string payloadStr((char*)payload,length);
  LOG_S(payloadStr);
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
