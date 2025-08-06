import * as service from '../services/ServiceIP.js';
import {Router} from "express";
import {isIpsValid, isBodyValid} from '../validators/validators.js'
const routerIp = Router();

routerIp.post('/', isBodyValid, isIpsValid,service.addIpsService);

export default routerIp;