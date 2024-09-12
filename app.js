const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

app.post('/api/ecg-data', async (req, res) => {
  const { userId, stage, ecgVoltage, time } = req.body;

  console.log('Received data:', JSON.stringify(req.body, null, 2));
  
  const item = {
    userId: userId,
    stage: stage,
    ecgVoltage: ecgVoltage,
    timestamp: time         
  };

  console.log('Item to be inserted:', JSON.stringify(item, null, 2));

  const params = {
    TableName: 'ECGMeasurements',
    Item: item
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
