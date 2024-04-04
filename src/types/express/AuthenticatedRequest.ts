import { Request as JwtRequest } from 'express-jwt';
import { User } from '../User';

interface AuthenticatedRequest extends JwtRequest {
	user?: User;
}

export { AuthenticatedRequest };
