import * as service from '../services/ServiceRules.js';
import {Router} from "express";
import {isUrlsValid, isModeValid} from '../validators/validators.js'
const routerUrl = Router();


routerUrl.use(isModeValid, isUrlsValid)
routerUrl.post('/', service.addRuleService);
routerUrl.delete('/', service.deleteRuleService);

export default routerUrl;