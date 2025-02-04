import { Request } from "express";

export interface CustomRequest
  extends Request<{ id: string; token: string }, any, any, any> {
  user?: {
    id: string;
    email: string;
  };
}
export interface SQSClientOptions {
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
}

export interface UserCreatedPayload {
  email: string;
  name: string;
}
export interface UserDeletedPayload {
  email: string;
  name: string;
}
export interface TodoUrgent {}
