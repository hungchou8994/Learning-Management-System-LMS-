const amqp = require("amqplib");
const logger = require("../utils/logger");

const QUEUE_NAME = "processing_queue";

async function connectQueue() {
  try {
    // Using the container name as the hostname for RabbitMQ
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://rabbitmq:5672"
    );
    const channel = await connection.createChannel();

    // Assert queue
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    // Set up consumer
    channel.consume(QUEUE_NAME, async (data) => {
      try {
        const task = JSON.parse(data.content);
        logger.info(`Processing task: ${task.id}`);

        // Process the task
        await processTask(task);

        // Acknowledge the message
        channel.ack(data);
      } catch (error) {
        logger.error("Error processing message:", error);
        // Reject the message and requeue
        channel.nack(data, false, true);
      }
    });

    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    logger.error("RabbitMQ connection error:", error);
    throw error;
  }
}

async function processTask(task) {
  // Implement your task processing logic here
  // This is just a placeholder
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.info(`Task ${task.id} processed successfully`);
      resolve();
    }, 1000);
  });
}

module.exports = {
  connectQueue,
  QUEUE_NAME,
};
