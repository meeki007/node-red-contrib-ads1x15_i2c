
//Licensed under the Apache License, Version 2.0
// 2021 David L Burrows
//Contact me @ https://github.com/meeki007
//or meeki007@gmail.com

module.exports = function(RED) {
    const ads1x15 = require('ads1x15');
    function ads1x15MainFunction(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        // config
        this.property = config.property||"payload";
        this.i2c_device_number = parseInt(config.i2c_device_number, 10);
        this.chip = config.chip;
        this.i2c_address = config.i2c_address;
        this.inputsForChannel = config.inputsForChannel;
        this.singleEndedChannel0 = config.singleEndedChannel0;
        this.singleEndedChannel1 = config.singleEndedChannel1;
        this.singleEndedChannel2 = config.singleEndedChannel2;
        this.singleEndedChannel3 = config.singleEndedChannel3;
        this.differentialChannel0_1 = config.differentialChannel0_1;
        this.differentialChannel0_3 = config.differentialChannel0_3;
        this.differentialChannel1_3 = config.differentialChannel1_3;
        this.differentialChannel2_3 = config.differentialChannel2_3;
        this.samplesPerSecond1 = config.samplesPerSecond1; //tied to ads1115
        this.samplesPerSecond0 = config.samplesPerSecond0; //tied to ads1015
        this.progGainAmp = config.progGainAmp;

        var dply_rdy = true;

        //FORMAT
        //convert hexadec i2c chip and address to a number
        const number_of_chip = Number(this.chip);
        var format_number_of_chip;
        var format_samplesPerSeconds;
        if (number_of_chip === 1) {
            format_number_of_chip = 'ads1115';
            format_samplesPerSeconds = Number(this.samplesPerSecond1);
        }
        else {
            format_number_of_chip = 'ads1015';
            format_samplesPerSeconds = Number(this.samplesPerSecond0);
        }
        const number_of_i2c_address = Number(this.i2c_address);
        const format_number_of_i2c_address = this.i2c_address;
        const format_i2c_device_number = '/dev/i2c-' + this.i2c_device_number.toString();
        const format_inputsForChannel = this.inputsForChannel;
        const format_progGainAmp = Number(this.progGainAmp);

        //populate channels_array_of_objects
        var channels_array_of_objects = [];
        if (format_inputsForChannel === 'singleEnded') {
            if (this.singleEndedChannel0 === true || this.singleEndedChannel1 === true || this.singleEndedChannel2 === true || this.singleEndedChannel3 === true) {
                if (this.singleEndedChannel0 === true) {
                    channels_array_of_objects.push({channel: 0, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
                if (this.singleEndedChannel1 === true) {
                    channels_array_of_objects.push({channel: 1, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
                if (this.singleEndedChannel2 === true) {
                    channels_array_of_objects.push({channel: 2, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
                if (this.singleEndedChannel3 === true) {
                    channels_array_of_objects.push({channel: 3, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
            }
            else {
                this.warn("No Single Ended Channels Selected: Please Select a Channel");
                dply_rdy = "No Single Ended Channels Selected: Please Select a Channel";
            }
        }
        if (format_inputsForChannel === 'differential') {
            if (this.differentialChannel0_1 === true || this.differentialChannel0_3 === true || this.differentialChannel1_3 === true || this.differentialChannel2_3 === true) {
                if (this.differentialChannel0_1 === true) {
                    channels_array_of_objects.push({channelPositive: 0, channelNegative: 1, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
                if (this.differentialChannel0_3 === true) {
                    channels_array_of_objects.push({channelPositive: 0, channelNegative: 3, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
                if (this.differentialChannel1_3 === true) {
                    channels_array_of_objects.push({channelPositive: 1, channelNegative: 3, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
                if (this.differentialChannel2_3 === true) {
                    channels_array_of_objects.push({channelPositive: 2, channelNegative: 3, programmable_gain_amplifier: format_progGainAmp, samples_per_second: format_samplesPerSeconds});
                }
            }
            else {
                this.warn("No Differential Channels Selected: Please Select a Channel");
                dply_rdy = "No Differential Channels Selected: Please Select a Channel";
            }
        }

        //clear status icon if one is hanging about wehn you deploy the node
        node.status({});

        //Function to Clear user notices, used for timmer
        var status_clear = function() {
            //clear status icon
            node.status({});
        };

        //used for a sleap timmer in main async function
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        //setup the ads
        const adc = new ads1x15(number_of_chip, number_of_i2c_address);

        try {
            const adc = new ads1x15(number_of_chip, number_of_i2c_address);
        }
        catch (error) {
            this.warn("Load const adc: " + error);
            this.status({
                fill: 'red',
                shape: 'dot',
                text: "detected error"
            });
        }

        //is Bus ready - load device address number
        var bus_ready; //error check of bus_ready
        Promise.resolve (adc.openBus(this.i2c_device_number))
        .then( bus_ready = true )
        .catch(error => {
            bus_ready = ("adc.openBus: " + error),
            this.warn(bus_ready),
            this.status({
                fill: 'red',
                shape: 'dot',
                text: "detected error"
            });
        });


        //DO STUFF WHEN TRIGGERED
        this.on("input", async function(msg, send, done) {
            // For maximum backwards compatibility, check that send exists.
            // If this node is installed in Node-RED 0.x, it will need to
            // fallback to using `node.send`
            send = send || function() { node.send.apply(node,arguments); };

            //user error function
            function notify_user_errors(err) {
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                }
                else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
            }
            //clear status icon every new trigger input
            node.status({});
            if (dply_rdy !== true) {
                notify_user_errors(dply_rdy);
                this.status({
                    fill: 'red',
                    shape: 'dot',
                    text: "detected error"
                });
                if (done) { done(); }
            }
            else {
                // create object to store voltage values
                var voltage_output_object = {};
                voltage_output_object[format_i2c_device_number] = {};
                voltage_output_object[format_i2c_device_number][format_number_of_chip] = {};
                voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address] = {};
                voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel] = {};

                if (format_inputsForChannel === 'singleEnded') {
                    for await (let request of channels_array_of_objects) {
                        try {
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channel] = {};
                            const measure = await adc.readSingleEnded({
                                channel: request.channel,
                                pga: request.programmable_gain_amplifier,
                                sps: request.samples_per_second
                            });
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channel]['Volts'] = measure / 1e3;
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channel]['miliVolts'] = measure;
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channel]['samples_sec'] = request.samples_per_second;
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channel]['gain'] = request.programmable_gain_amplifier;
                        }
                        catch (error) { notify_user_errors(error); }
                    }
                }
                if (format_inputsForChannel === 'differential') {
                    for await (let request of channels_array_of_objects) {
                        try {
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channelPositive+'_'+request.channelNegative] = {};
                            const measure = await adc.readSingleEnded({
                                channelPositive: request.channelPositive,
                                channelNegative: request.channelNegative,
                                pga: request.programmable_gain_amplifier,
                                sps: request.samples_per_second
                            });
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channelPositive+'_'+request.channelNegative]['Volts'] = measure / 1e3;
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channelPositive+'_'+request.channelNegative]['miliVolts'] = measure;
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channelPositive+'_'+request.channelNegative]['samples_sec'] = request.samples_per_second;
                            voltage_output_object[format_i2c_device_number][format_number_of_chip][format_number_of_i2c_address][format_inputsForChannel]['channel_'+request.channelPositive+'_'+request.channelNegative]['gain'] = request.programmable_gain_amplifier;
                        }
                        catch (error) { notify_user_errors(error); }
                    }
                }
                //send voltage_output_object to payload
                RED.util.setMessageProperty(msg,node.property,voltage_output_object);
                send(msg);
                if (done) { done(); }
            }
        });
    }
    RED.nodes.registerType("ads1x15_i2c", ads1x15MainFunction);
};
