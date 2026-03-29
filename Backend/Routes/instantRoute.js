import express from 'express'
import { createInstantBooking } from '../instantBooking/createInstantBooking.js'
import { tokenMiddleware,tokenRefreshWare } from '../middleware/tokenMiddleware.js'
import { rejectBooking } from '../instantBooking/rejectBooking.js'
import { acceptBooking } from '../instantBooking/acceptBooking.js'
import { completeWork } from '../instantBooking/completework.js'
import { startWork } from '../instantBooking/startwork.js'
import { autoAssignBuddy } from '../instantBooking/automaticBooking/autoasginbuddy.js'
import { autorejectBooking } from '../instantBooking/automaticBooking/autoRejectbuddy.js'

const instantRoute = express.Router()

instantRoute.route('/instantBooking').post(createInstantBooking)
instantRoute.route('/instantCancel').post(rejectBooking)
instantRoute.route('/instatAccept').post(acceptBooking)
instantRoute.route('/instantStartWork').post(startWork)
instantRoute.route('/instantComplete').post(completeWork)

instantRoute.route('/instantAutoBooking').post(autoAssignBuddy)
instantRoute.route('/instantAutorejectBookinig').post(autorejectBooking)


export  default instantRoute