import * as service from '../services/ServiceRules.js';
import {Router} from "express";
import {isToggleValid} from '../validators/validators.js'

const routerRules = Router();

routerRules.get('/', service.getAllRulesService);
routerRules.put('/', isToggleValid, service.toggleRuleStatusService);

export default routerRules;