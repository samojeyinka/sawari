import { Router } from 'express'
import { getSettings, updateSettings } from '../../controllers/settings.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { updateSettingsSchema } from '../../validators/settingsValidators.js'

const router = Router()

router.use(authenticate)
router.get('/', getSettings)
router.patch('/', validate(updateSettingsSchema), updateSettings)

export default router
