# Copyright 2018 Salesforce.com All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


let nforce = require('nforce');
let faye = require('faye');
const fs = require('fs');
let express = require('express');
let cors = require('cors');
let app = express();
const path = require('path');
const Kafka = require('no-kafka');
const producerTopic = process.env.KAFKA_TOPIC;

let server = require('http').Server(app);

let PORT = process.env.PORT || 5000;

app.use(cors());

server.listen(PORT, () => console.log('Express server listening on ${ PORT }'));

let bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
bayeux.attach(server);
bayeux.on('disconnect', function(clientId) {
    console.log('Bayeux server disconnect');
});

// Connect to Salesforce
let SF_CLIENT_ID = process.env.SF_CLIENT_ID;
let SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
let SF_USER_NAME = process.env.SF_USERNAME;
let SF_USER_PASSWORD = process.env.SF_PASSWORD;
let SF_ENVIRONMENT = process.env.SF_ENVIRONMENT;

let org = nforce.createConnection({
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    environment: SF_ENVIRONMENT,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    mode: 'single',
    autoRefresh: true
});

org.authenticate({username: SF_USER_NAME, password: SF_USER_PASSWORD}, err => {
    if (err) {
        console.error("SFDC -> authentication error - " + err);
    } else {
        console.log("SFDC -> authentication successful - " + org.oauth.instance_url);
        subscribeToPlatformEvents();
    }
});

// Subscribe to Platform Events
let subscribeToPlatformEvents = () => {
    var client = new faye.Client(org.oauth.instance_url + '/cometd/40.0/');
    client.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
    client.subscribe('/event/contact_change__e', function(message) {

        var dump = message.payload.First_Name__c + ' : ' + message.payload.Last_Name__c
        console.log("SFDC -> contact_change__e platform event -> KAFKA topic contact-change - " + dump);

        //What to do when event happens
        producer.send({
            topic: 'contact-change',
            partition: 0,
            message: {
                value: dump
            }
        })
    });
};

// Check that required Kafka environment variables are defined
const cert = process.env.KAFKA_CLIENT_CERT;
const key  = process.env.KAFKA_CLIENT_CERT_KEY;
const url  = process.env.KAFKA_URL;
if (!cert) throw new Error('KAFKA_CLIENT_CERT environment variable must be defined.');
if (!key) throw new Error('KAFKA_CLIENT_CERT_KEY environment variable must be defined.');
if (!url) throw new Error('KAFKA_URL environment variable must be defined.');

// Write certs to disk because that's how no-kafka library needs them
fs.writeFileSync('./client.crt', process.env.KAFKA_CLIENT_CERT);
fs.writeFileSync('./client.key', process.env.KAFKA_CLIENT_CERT_KEY);

// Configure producer client
const producer = new Kafka.Producer({
    clientId: 'kafka-sfdc-event-subscriber',
    connectionString: url.replace(/\+ssl/g,''),
    ssl: {
      certFile: './client.crt',
      keyFile: './client.key'
    }
});

/*
 * Startup producer,
 */
return producer.init().then(function() {
    console.log('KAFKA - Producer connected and ready to publish');
    
});
