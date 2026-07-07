import express from 'express';
import {
  saveJournal, getJournals, getJournalById,
  deleteJournal, finalizeJournal,
} from '../controller/journalController.js';
import userAuth from '../middleware/userAuth.js';

const journalRouter = express.Router();

journalRouter.post('/save',        userAuth, saveJournal);
journalRouter.post('/list',        userAuth, getJournals);
journalRouter.get('/:id',          userAuth, getJournalById);  // ✅ GET for reading
journalRouter.delete('/:id',       userAuth, deleteJournal);
journalRouter.post('/:id/finalize',userAuth, finalizeJournal);

export default journalRouter;
