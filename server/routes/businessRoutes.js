import {Router} from 'express'
import{
    getMyBusinessProfile,
    createMyBusinessProfile,
    updateMyBusinessProfile,

} from '../controllers/businessController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
const router = Router()
router.use(requireAuth)
router.route('/profile')
    .get(requireAuth, getMyBusinessProfile)
    .post(requireAuth, createMyBusinessProfile)
    .put(requireAuth, updateMyBusinessProfile)


export default router 