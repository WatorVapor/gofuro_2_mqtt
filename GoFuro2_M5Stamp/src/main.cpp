#include <Arduino.h>
#include "debug.hpp"
#include <M5StickC.h>


void BLETask( void * parameter);
void setup() {
  Serial.begin(115200);
  delay(3000);
  auto freqDefault = getCpuFrequencyMhz();
  LOG_I(freqDefault);
  xTaskCreatePinnedToCore(BLETask, "BLETask", 10000, nullptr, 1, nullptr,  1); 
}


bool restart = false;
void loop() {
  if(M5.BtnB.wasPressed()){
    LOG_I(M5.BtnB.wasPressed());
    restart = true;
  }
  if(restart) {
    Serial.println("restart ...");
    delay(1000);
    esp_restart();
  }
  M5.update();
}