import type { Writable } from './Writable';

interface User {
	readonly id: number;
	authenticationId: string;
	readonly createdAt: Date;
}

type WritableUser = Writable<User>;

export { User, WritableUser };
