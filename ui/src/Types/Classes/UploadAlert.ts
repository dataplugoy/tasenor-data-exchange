import { Alert } from "../API/Alert";
import { AlertMethod } from "../API/AlertMethod";
import { AlertType } from "../API/AlertType";

export class UploadAlert implements Alert {

  id: number;
  userId: number;
  type: AlertType;
  method: AlertMethod;
  url: string;
  payload: string;
  delivered: null | string;
  created?: string;
  updated?: string;


  constructor(alert: Alert) {
    Object.assign(this, alert)
  }
}
