import * as service from '../services/ServiceRules.js';
import {Router} from "express";
import {isIpsValid, isModeValid} from '../validators/validators.js'

const routerIp = Router();

routerIp.use(isModeValid, isIpsValid)
routerIp.post('/', service.addRuleService);
routerIp.delete('/', service.deleteRuleService);

export default routerIp;