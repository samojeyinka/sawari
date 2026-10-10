import { Router } from 'express'
import { me, updateMe } from '../../controllers/me.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { updateMeSchema } from '../../validators/authValidators.js'

const router = Router()

router.use(authenticate)
router.get('/', me)
router.patch('/', validate(updateMeSchema), updateMe)

export default router