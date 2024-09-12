const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const compression = require('compression');

const app = express();

// Apply compression
app.use(compression());

// Configure body-parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Configure AWS
AWS.config.update({ region: 'us-east-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Add a simple health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.post('/api/ecg-data', async (req, res) => {
  const { userId, stage, ecgVoltage, time } = req.body;

  console.log('Received data:', JSON.stringify({ userId, stage, ecgVoltageLength: ecgVoltage.length, time }, null, 2));

  const params = {
    TableName: 'ECGMeasurements',
    Item: {
      userId: userId,
      measurementId: `${stage}-${Date.now()}`, // Add a unique identifier
      stage: stage,
      ecgVoltage: ecgVoltage,
      time: time
    }
  };

  try {
    console.log('Attempting to store data in DynamoDB...');
    await dynamodb.put(params).promise();
    console.log('Data stored successfully');
    res.status(200).json({ message: 'Data stored successfully' });
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ error: 'Failed to store data', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 8081;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.timeout = 120000; // 120 seconds timeout

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});