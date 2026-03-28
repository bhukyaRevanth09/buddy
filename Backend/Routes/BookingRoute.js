import express from 'express'
import { createInstantBooking } from '../Controllers/quickBooking.js'
import { tokenMiddleware,tokenRefreshWare } from '../middleware/tokenMiddleware.js'

const instantRoute = express.Router()

instantRoute.route('/instant').post(createInstantBooking)




export  default instantRoute