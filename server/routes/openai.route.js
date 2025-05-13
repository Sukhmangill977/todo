import express from 'express';
import { OpenAI } from 'openai';  // Correct import for OpenAI

const router = express.Router();

router.post('/generate', async (req, res) => {
  const { message } = req.body;

  try {
    const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,  // Correct access
});


    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Using gpt-3.5-turbo model
      messages: [
        {
          role: 'system',
          content: `You're a helpful assistant.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    res.json({
      response: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error with OpenAI request:', error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

export default router;
