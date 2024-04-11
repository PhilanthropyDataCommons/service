import type { Writable } from './Writable';

interface User {
	readonly id: number;
	authenticationId: string;
	readonly createdAt: string;
}

type WritableUser = Writable<User>;

export { User, WritableUser };
