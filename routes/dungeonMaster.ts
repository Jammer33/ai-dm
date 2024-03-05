import express from 'express';
import DungeonMasterController from '../controllers/DungeonMasterController';

const router = express.Router();

// Get entire session history
router.get('/story/history', async (req, res) => {
  var { campaignToken } = req.body;
  Promise.resolve(DungeonMasterController.getSessionHistory(campaignToken)).then((data) => {
    return res.json({ message: data });
  });
});

export default router;
