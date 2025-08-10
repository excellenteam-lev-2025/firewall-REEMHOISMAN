import * as service from '../services/ServiceRules.js';
import {Router} from "express";
import {isPortsValid, isModeValid} from '../validators/validators.js'

const routerPort = Router();

routerPort.use(isModeValid, isPortsValid)
routerPort.post('/', service.addRuleService);
routerPort.delete('/', service.deleteRuleService);

export default routerPort;