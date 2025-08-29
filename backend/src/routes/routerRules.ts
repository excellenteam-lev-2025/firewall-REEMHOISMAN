import * as service from '../services/ServiceRules.js';
import {Router} from "express";
import {isToggleValid} from '../validators/validators.js'

const routerRules = Router();

routerRules.get('/', service.getAllRules);
routerRules.put('/', isToggleValid, service.toggleRuleStatus);

export default routerRules;
