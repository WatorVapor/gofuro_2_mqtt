const onUIClickGoFuro = (elem) => {
  console.log('onUIClickGoFuro::elem:=<', elem, '>');
  const port_radios = document.getElementsByName('gpio_port');
  let port = false;
  for(const port_radio of port_radios) {
    console.log('onUIClickGoFuro::port_radio:=<', port_radio, '>');
    if (port_radio.checked) {
      port = parseInt(port_radio.value);
      break;
    }
  }
  const output_radios = document.getElementsByName('gpio_output');
  let output = false;
  for(const output_radio of output_radios) {
    console.log('onUIClickGoFuro::output_radio:=<', output_radio, '>');
    if (output_radio.checked) {
      output = parseInt(output_radio.value);
      break;
    }
  }
  if(port !== false && output !== false) {
    publishGpio(port,output);
  }
}

const onUIClickGoFuroBadTest = (elem) => {
  console.log('onUIClickGoFuroBadTest::elem:=<', elem, '>');
  const port_radios = document.getElementsByName('gpio_port');
  let port = false;
  for(const port_radio of port_radios) {
    console.log('onUIClickGoFuroBadTest::port_radio:=<', port_radio, '>');
    if (port_radio.checked) {
      port = parseInt(port_radio.value);
      break;
    }
  }
  const output_radios = document.getElementsByName('gpio_output');
  let output = false;
  for(const output_radio of output_radios) {
    console.log('onUIClickGoFuroBadTest::output_radio:=<', output_radio, '>');
    if (output_radio.checked) {
      output = parseInt(output_radio.value);
      break;
    }
  }
  if(port !== false && output !== false) {
    publishGpioBadTest(port,output);
  }
}

