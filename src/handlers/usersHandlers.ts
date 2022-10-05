import qs from 'qs';
import axios from 'axios';
import { isUser, isPostUser } from '../types';
import type { UserLogin, User, AccessTokenInterface } from '../types';
import type { AxiosError } from 'axios';
import type {
  Request,
  Response,
} from 'express';

const getUrl = (type: string): string => {
  const baseUrl = process.env.KEYCLOAK_BASE_URL ?? '';
  const realm = process.env.REALM ?? '';
  switch (type) {
    case 'login':
      return `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
    case 'register':
      return `${baseUrl}/admin/realms/${realm}/users`;
    case 'admin-token':
      return `${baseUrl}/realms/master/protocol/openid-connect/token`;
    default:
      return '';
  }
};

const registerUser = (req: Request<User>, res: Response): void => {
  if (!isPostUser(req.body)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request body.',
        errors: isPostUser.errors,
      });
    return;
  }
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const isEmail: boolean = emailRegex.test(req.body.email);
  if (!isEmail) {
    res.send({
      message: 'Please enter valid email.',
    });
    return;
  }
  if (req.body.password !== req.body.confirm_password) {
    res.send({
      message: 'Your passwords don\'t match.',
    });
    return;
  }
  const accessTokenUrl = getUrl('admin-token');
  const adminAccessData = {
    grant_type: 'client_credentials',
    client_id: process.env.ADMIN_CLIENT_ID ?? '',
    client_secret: process.env.ADMIN_CLIENT_SECRET ?? '',
  };
  const accessTokenRequest = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify(adminAccessData),
    url: accessTokenUrl,
  };

  const registerUrl = getUrl('register');
  const newUserData = {
    username: req.body.username,
    email: req.body.email,
    enabled: true,
    credentials: [
      {
        type: 'password',
        value: req.body.password,
        temporary: false,
      },
    ],
  };

  axios(accessTokenRequest)
    .then((response: AccessTokenInterface) => {
      const accessToken: string = response.data.access_token;
      axios({
        url: registerUrl,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        data: newUserData,
      })
        .then((resp) => {
          res.status(resp.status).send(resp.data);
        })
        .catch((_e: AxiosError) => {
          res.status(_e.response?.status ?? 409).send(_e.response?.data);
        });
    })
    .catch((_e: AxiosError) => {
      res.status(_e.response?.status ?? 409).send(_e.response?.data);
    });
};

const loginUser = (req: Request<UserLogin>, res: Response): void => {
  if (!isUser(req.body)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request body.',
        errors: isUser.errors,
      });
    return;
  }
  const url = getUrl('login');
  const data = {
    grant_type: 'password',
    client_id: process.env.CLIENT_ID ?? '',
    client_secret: process.env.CLIENT_SECRET ?? '',
    username: req.body.username,
    password: req.body.password,
  };
  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify(data),
    url,
  };
  axios(options).then(
    (response) => {
      res.status(200).send(response.data);
    },
  ).catch(() => {
    res.status(401).send({
      message: 'Invalid credentials',
    });
  });
};

export const usersHandlers = {
  registerUser,
  loginUser,
};
