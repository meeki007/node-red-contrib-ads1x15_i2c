
module.exports = function(RED)
{
//Licensed under the Apache License, Version 2.0
// 2021 David L Burrows
//Contact me @ https://github.com/meeki007
//or meeki007@gmail.com

    //"use strict";
    //const i2c = require('i2c-bus');
    const ads1x15 = require('ads1x15');

    function ads1x15MainFunction(config)
    {
        RED.nodes.createNode(this, config);
        var globalContext = this.context().global;
        var node = this;

        // config
        this.property = config.property||"payload";
        this.chip = config.chip || "IC_ADS1115";
        this.i2c_address = config.i2c_address || "ADDRESS_0x48";
        this.channel = config.channel || "CHANNEL_0";
        this.samplesPerSecond1 = config.samplesPerSecond1 || "SPS_128";
        this.samplesPerSecond0 = config.samplesPerSecond0 || "SPS_920";
        this.progGainAmp = config.progGainAmp || "PGA_4_096V";


        //Function to Clear user notices, used for timmer
        var status_clear = function()
        {
          //clear status icon
          node.status({});
        };

        //used for a sleap timmer in main async function
        function sleep(ms)
        {
          return new Promise(resolve => setTimeout(resolve, ms));
        }



        this.on("input", async function(msg, send, done)
        {

          // For maximum backwards compatibility, check that send exists.
          // If this node is installed in Node-RED 0.x, it will need to
          // fallback to using `node.send`
          send = send || function() { node.send.apply(node,arguments); };

          //user error function
          function notify_user_errors(err)
          {
            if (done)
            {
              // Node-RED 1.0 compatible
              done(err);
            }
            else
            {
              // Node-RED 0.x compatible
              node.error(err, msg);
            }
          }

          if ( true ) //is falsy
          {
            notify_user_errors("error test");
          }

          //send status msg
          //node.status(
          //{
          //    fill: 'blue',
          //    shape: 'dot',
          //    text: volts + 'v'
          //});
          // clear/end status msg after 3 seconds
          //var timmerClear = setTimeout(status_clear, 5000);

            //return node.error('Unable to connect to ADC and Failed to fetch value from Chipset:'+this.chip+" "+this.channel+" "+this.i2c_address, err);


            //clear status icon every new trigger input
            node.status({});

            //define samplesPerSecond to a var based on user selection that is based on chipset
            var samples_per_second = "SPS_250"; //value that works for both chips .....

            send(msg);

            if (done) {
                done();
            }
        }
    }
    RED.nodes.registerType("ads1x15-raspi", ads1x15MainFunction);
};
