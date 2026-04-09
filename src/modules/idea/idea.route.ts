import { Router } from 'express'
import { adminOrManager, authMiddleware,} from '../../middleware/auth.middleware'
import * as ideaController from './ideas.controller'

const router = Router()

router.get('/',              ideaController.getAllIdeas)
router.get('/search/suggestions', ideaController.getSearchSuggestions)
router.get('/recommendations/trending', ideaController.getTrendingRecommendations)
router.get('/recommendations/personal', authMiddleware, ideaController.getPersonalRecommendations)
router.get('/recommendations/analytics-clicks', authMiddleware, adminOrManager, ideaController.getRecommendationClickAnalytics)
router.post('/:id/interactions', authMiddleware, ideaController.trackIdeaInteraction)
router.get('/my',   authMiddleware, ideaController.getMyIdeas)
router.get('/:id',           ideaController.getIdeaById)
router.post('/',    authMiddleware, ideaController.createIdea)
router.patch('/:id/submit', authMiddleware, ideaController.submitIdea)
router.patch('/:id',  authMiddleware, ideaController.uPdateIdea)
router.delete('/:id', authMiddleware, ideaController.deleteIdea)

export default router