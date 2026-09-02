const express = require('express');
const router = express.Router();
const { supabaseRequest } = require('../utils/supabase');
const { resolveSuperadminProfile } = require('../utils/profile');
const { createChat, sendMessage, sendMessageStream } = require('../controllers/chatController');

async function getUserId(req) {
  if (req.user) return req.user.id;
  return resolveSuperadminProfile();
}

router.post('/', createChat);
router.post('/:id/message', sendMessage);
router.post('/:id/message/stream', sendMessageStream);

router.get('/', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId || userId.startsWith('local-')) {
      return res.json({ success: true, data: [] });
    }
    let path = `/rest/v1/chat_histories?select=*&user_id=eq.${userId}`;
    try {
      path += '&order=created_at.desc';
      const data = await supabaseRequest('GET', path);
      return res.json({ success: true, data: Array.isArray(data) ? data : [] });
    } catch {
      const data = await supabaseRequest('GET', path.replace('&order=created_at.desc', ''));
      return res.json({ success: true, data: Array.isArray(data) ? data : [] });
    }
  } catch (error) {
    return res.json({ success: true, data: [] });
  }
});

router.get('/search/*', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId || userId.startsWith('local-')) {
      return res.json({ success: true, data: [] });
    }
    const term = req.params[0] || '';
    const data = await supabaseRequest('GET', `/rest/v1/chat_histories?select=*&user_id=eq.${userId}&title=ilike.*${encodeURIComponent(term)}*&order=updated_at.desc`);
    return res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (error) {
    return res.json({ success: true, data: [] });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    if (chatId && (chatId.startsWith('local-') || chatId === 'undefined' || chatId === 'null')) {
      return res.json({ success: true, data: { id: chatId, title: 'New Chat', messages: [] } });
    }
    const data = await supabaseRequest('GET', `/rest/v1/chat_histories?id=eq.${chatId}&select=*`);
    const chat = Array.isArray(data) ? data[0] : data;
    return res.json({ success: true, data: chat || { id: chatId, title: 'New Chat', messages: [] } });
  } catch (error) {
    return res.json({ success: true, data: { id: req.params.id, title: 'New Chat', messages: [] } });
  }
});

router.put('/:id/rename', async (req, res) => {
  try {
    const chatId = req.params.id;
    if (chatId && (chatId.startsWith('local-') || chatId === 'undefined' || chatId === 'null')) {
      return res.json({ success: true });
    }
    await supabaseRequest('PATCH', `/rest/v1/chat_histories?id=eq.${chatId}`, { title: req.body.title });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: true });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    if (chatId && (chatId.startsWith('local-') || chatId === 'undefined' || chatId === 'null')) {
      return res.json({ success: true });
    }
    await supabaseRequest('DELETE', `/rest/v1/chat_histories?id=eq.${chatId}`);
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: true });
  }
});

module.exports = router;