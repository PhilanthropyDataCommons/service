import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface User {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export const userSchema: JSONSchemaType<UserLogin> = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
  required: [
    'username',
    'password',
  ],
};

export const postUserSchema: JSONSchemaType<User> = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
    confirm_password: {
      type: 'string',
    },
  },
  required: [
    'username',
    'email',
    'password',
    'confirm_password',
  ],
};

export const isUser = ajv.compile(userSchema);
export const isPostUser = ajv.compile(postUserSchema);
