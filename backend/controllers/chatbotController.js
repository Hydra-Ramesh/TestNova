import axios from 'axios';
import { cacheGet, cacheSet } from '../services/cacheService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const sendMessage = async (req, res) => {
  try {
    const { message, questionId, context } = req.body;

    const cacheKey = `chatbot:${Buffer.from(message).toString('base64').slice(0, 50)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/chatbot/message`, {
      message,
      question_id: questionId,
      context,
      user_id: req.user._id.toString(),
    }, { timeout: 60000 });

    const response = {
      reply: aiResponse.data.reply,
      sources: aiResponse.data.sources || [],
    };

    await cacheSet(cacheKey, response, 3600);
    res.json(response);
  } catch (error) {
    console.error('Chatbot error:', error.message);
    res.json({
      reply: 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a moment.',
      sources: [],
    });
  }
};

export const explainQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const cacheKey = `explain:${questionId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/explain/solution`, {
      question_id: questionId,
    }, { timeout: 60000 });

    const response = {
      explanation: aiResponse.data.explanation,
      steps: aiResponse.data.steps,
      concept: aiResponse.data.concept,
      similarQuestions: aiResponse.data.similar_questions || [],
    };

    await cacheSet(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Explain error:', error.message);
    res.json({
      explanation: 'AI explanation service is temporarily unavailable.',
      steps: [],
      concept: '',
      similarQuestions: [],
    });
  }
};
