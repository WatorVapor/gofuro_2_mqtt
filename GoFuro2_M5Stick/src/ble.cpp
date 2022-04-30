#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#include <ArduinoJson.h>
#include <Preferences.h>

#include <sstream>

#include "debug.hpp"

BLEServer *pServer = NULL;
BLECharacteristic * pTxCharacteristic;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      LOG_I(deviceConnected);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      LOG_I(deviceConnected);
    }
};

static StaticJsonDocument<1024> gAllowList;
static StaticJsonDocument<1024> gDenyList;
static Preferences preferences;
static const char *preferencesZone = "public.iot.1";
static const char *allowKey = "allows";
static const char *denyKey = "denys";
static String gTempAllowJsonBody;
static String gTempDenyJsonBody;
extern bool isPreferenceAllow;

void savePref(const char * key,const String &value){
  LOG_SC(key);
  LOG_S(value);
  int waitPressCounter = 10;
  while(waitPressCounter -- > 0) {
    if(isPreferenceAllow){
      LOG_I(isPreferenceAllow);
      preferences.putString(key,value);
      isPreferenceAllow = false;
      return;
    }
    delay(1000);
  }
}


void onExternalCommand(StaticJsonDocument<256> &doc) {
  preferences.begin(preferencesZone);
  if(doc.containsKey("allow")) {
    auto allow = doc["allow"];
    if(!gAllowList.containsKey("allows")) {
      gAllowList.createNestedArray("allows");
    }
     gAllowList["allows"].add(allow);
    serializeJson(gAllowList, gTempAllowJsonBody);
    savePref(allowKey,gTempAllowJsonBody);
  }
  if(doc.containsKey("deny")) {
    auto deny = doc["deny"];
    if(!gDenyList.containsKey("denys")) {
      gDenyList.createNestedArray("denys");
    }
    gDenyList["denys"].add(deny);
    serializeJson(gDenyList, gTempDenyJsonBody);
    savePref(denyKey,gTempDenyJsonBody);
  }
  preferences.end();
}

class MyCallbacks: public BLECharacteristicCallbacks {
  void onRead(BLECharacteristic *pCharacteristic) {
    //pCharacteristic->setValue("Hello World!");
    std::string value = pCharacteristic->getValue();
  }

  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    LOG_S(value);
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, value);
    LOG_S(error);
    if(error == DeserializationError::Ok) {
      onExternalCommand(doc);
    }
  }
};


#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E" // UART service UUID
#define CHARACTERISTIC_UUID_TX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

#include <list>
std::list<std::string> gAllowTopics;
std::list<std::string> gDenyTopics;

void loadPreferances(void) {
  preferences.begin(preferencesZone,true);

  gTempAllowJsonBody = preferences.getString(allowKey);
  DeserializationError error = deserializeJson(gAllowList, gTempAllowJsonBody);
  LOG_S(error);
  LOG_S(gTempAllowJsonBody);
  if(error == DeserializationError::Ok) {
    if(gAllowList.containsKey("allows")) {
      auto allows = gAllowList["allows"].as<JsonArray>();
      for(auto allow:allows) {
        if(allow.containsKey("pubKey")) {
          auto allowKey = allow["pubKey"].as<std::string>();
          LOG_S(allowKey);
          gAllowTopics.push_back(allowKey);
        }
      }
    }
  }

  gTempDenyJsonBody = preferences.getString(denyKey);
  DeserializationError errorDeny = deserializeJson(gDenyList, gTempDenyJsonBody);
  LOG_S(errorDeny);
  LOG_S(gTempDenyJsonBody);
  if(errorDeny == DeserializationError::Ok) {
    if(gDenyList.containsKey("denys")) {
      auto denys = gDenyList["denys"].as<JsonArray>();
      for(auto deny:denys) {
        if(deny.containsKey("pubKey")) {
          auto denyKey = deny["pubKey"].as<std::string>();
          LOG_S(denyKey);
          gDenyTopics.push_back(denyKey);
        }
      }
    }
  }

  preferences.end();
}


void setupBLE(void) {
  loadPreferances();
  BLEDevice::init("PublicIot");  // local name
  pServer = BLEDevice::createServer();  // Create the BLE Device
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pTxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_TX,BLECharacteristic::PROPERTY_NOTIFY);
  pTxCharacteristic->addDescriptor(new BLE2902());

  BLECharacteristic * pRxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_RX,BLECharacteristic::PROPERTY_WRITE										);
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  pService->start();
  pServer->getAdvertising()->start();

  Serial.println("Waiting a ble client connection ...");
}

std::string my_to_string(int i) {
  std::stringstream ss;
  ss << i;
  return ss.str();
}

std::string my_to_string_f(float f) {
  std::stringstream ss;
  ss << f;
  return ss.str();
}



static const long constWriteBLEIntervalMS = 50;


void runBleTransimit(void)
{
  if (deviceConnected) {
    static long previousMillis = 0;
    auto nowMS = millis();
    if(nowMS - previousMillis < constWriteBLEIntervalMS) {
      return;
    }
    previousMillis = nowMS;
  }
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected) {
  // do stuff here on connecting
      oldDeviceConnected = deviceConnected;
  }
}

void BLETask( void * parameter) {
  int core = xPortGetCoreID();
  LOG_I(core);
  setupBLE();
  for(;;) {//
    runBleTransimit();
    delay(1);
  }
}
