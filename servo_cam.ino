#include <Servo.h>

//pan 0 > 90 > 100
//tilt 10 > 90 > 110

int tilt_deg=90, pan_deg=90;
Servo pan, tilt;  // create servo object to control a servo

void setup() {
  Serial.begin(9600);
  Serial.write("Serial connection established");
  pan.attach(10);  // attaches the pan servo on pin 10 to the servo object
  tilt.attach(9);  // attaches the tilt servo on pin 10 to the servo object
  pan.write(tilt_deg);
  tilt.write(pan_deg);
}

void loop() {
  if(Serial.available()){
    char val = Serial.read();
    switch(val){
      case 'u':  //tilt up
        if(tilt_deg>=10){
          tilt_deg--;
        }
        break;
      case 'd':  //tilt down
        if(tilt_deg<=110){
          tilt_deg++;
        }
        break;
      case 'l':  //pan left
        if(pan_deg<=180){
          pan_deg++;
        }
        break;
      case 'r':  //pan right
        if(pan_deg>=0){
          pan_deg--;
        }
        break;   
      default:
        break;   
    }
  }
  pan.write(pan_deg);    
  tilt.write(tilt_deg);                 
}
