import express from 'express'
import { tokenMiddleware,tokenRefreshWare } from '../middleware/tokenMiddleware.js'
import { rejectBooking } from '../instantBooking/rejectBooking.js'
import { acceptBooking } from '../instantBooking/acceptBooking.js'
import { completeWork } from '../instantBooking/completework.js'
import { startWork } from '../instantBooking/startwork.js'
import { autoAssignBuddy } from '../instantBooking/autoasginbuddy.js'
import { autorejectBooking } from '../instantBooking/autoRejectbuddy.js'

const instantRoute = express.Router()

instantRoute.route('/instantAutoBooking').post(autoAssignBuddy)
instantRoute.route('/instantAutorejectBookinig').post(autorejectBooking)
instantRoute.route('/instantCancel').post(rejectBooking)
instantRoute.route('/instatAccept').post(acceptBooking)
instantRoute.route('/instantStartWork').post(startWork)
instantRoute.route('/instantComplete').post(completeWork)




export  default instantRoute