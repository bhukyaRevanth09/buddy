import { mainRouter } from '../services/routerService.js'
import {userReg,buddyReg,userLog, buddyLog} from '../Controllers/auth.js'
import { tokenMiddleware, tokenRefreshWare } from '../middleware/tokenMiddleware.js'



mainRouter.route('/userReg').post(userReg)
mainRouter.route('/buddyReg').post(buddyReg)
mainRouter.route('/userLog').get(tokenMiddleware,userLog)
mainRouter.route('/buddyLog').get(tokenMiddleware,buddyLog)
mainRouter.route('/RefreshBuddyLog').post(tokenRefreshWare,buddyLog)
mainRouter.route('/RefreshUserLog').post(tokenRefreshWare,buddyLog)






export default mainRouter