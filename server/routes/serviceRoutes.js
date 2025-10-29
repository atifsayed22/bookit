import { Router } from "express";
import {
    createService,
    getMyServices,
    updateService,
    deleteService,
} from '../controllers/serviceController.js'
import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router()
router.use(requireAuth)
router.route('/my-services')
    .get(getMyServices)
router.route('/')
    .post(createService)
router.route('/:id')
    .put(updateService)
    .delete(deleteService)

export default router 