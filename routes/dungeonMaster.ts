import express from 'express';
import DungeonMasterController from '../controllers/DungeonMasterController';

const router = express.Router();

// Get entire session history
router.get('/story/history', async (req, res) => {
  var { sessionToken } = req.body;
  Promise.resolve(DungeonMasterController.getSessionHistory(sessionToken)).then((data) => {
    return res.json({ message: data });
  });
});

export default router;
