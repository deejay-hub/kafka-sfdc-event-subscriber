# Salesforce Platform Events -> Kafka Topics

This is a simple implementation in node that listens to a given platform event then creates a topic in kafka. It demonstrates the ability to create microservices to filter and maintain replayid's that scale independently of the Salesforce core services. The service requires a managed kafka instance to be attached.

More info about Platform Events be found here:
[Platform Events Developer Guide](https://resources.docs.salesforce.com/212/latest/en-us/sfdc/pdf/platform_events.pdf)

More info about Heroku Kafka be found here:
[Apache Kafka on Heroku](https://www.heroku.com/kafka)

# Deploy to:
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# What does the service do?
It uses a nodejs implementation to implement a worker dyno that subscribes to a Salesforce [Platform Event](https://resources.docs.salesforce.com/212/latest/en-us/sfdc/pdf/platform_events.pdf).
The service simply listens to a Salesforce Platform Event and then publishes to a Kafka topic.

## License
See [LICENSE](LICENSE).

This is not an official Salesforce product


