import express from 'express';
import DungeonMasterController from '../controllers/DungeonMasterController';

const router = express.Router();

// Get DM Response (Single)
router.get('/story/continue', async (req, res) => {
  var { message, sessionToken } = req.body;
  Promise.resolve(DungeonMasterController.getDMReply(message, sessionToken)).then((data) => {
    return res.json({ message: data });
  });
});

// initialize story
router.get('/story/init', async (req, res) => {
  var { characters, sessionToken } = req.body;
  Promise.resolve(DungeonMasterController.initStory(characters, sessionToken)).then((data) => {
    return res.json({ message: data });
  });
});

// Get a specific user
router.get('/story/context', async (req, res) => {
  var { sessionToken } = req.body;
  Promise.resolve(DungeonMasterController.getContext(sessionToken)).then((data) => {
    return res.json({ message: data });
  });
});

// Get entire session history
router.get('/story/history', async (req, res) => {
  var { sessionToken } = req.body;
  Promise.resolve(DungeonMasterController.getSessionHistory(sessionToken)).then((data) => {
    return res.json({ message: data });
  });
});

export default router;
