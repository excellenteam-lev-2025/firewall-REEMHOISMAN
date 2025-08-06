import * as service from '../services/ServiceIP.js';
import {Router} from "express";

const routerIp = Router();

routerIp.post('/',service.addIpToList);

export default routerIp;