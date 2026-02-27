import { ErrorResponse } from "src/filters/type";
import { ResponseStatus } from "../enum";

export type ApiResponse = {
  status: ResponseStatus;
  message?: string;
  data?: any;
  error?: ErrorResponse;
};
