import { generateLoadItemOperation } from '../generators';
import type { EphemeralAuthContext } from '../../../types';

const loadSystemEphemeralAuthContext = generateLoadItemOperation<
	EphemeralAuthContext,
	[]
>('ephemeralAuthContexts.selectSystemAuthContext', 'EphemeralAuthContext', []);

export { loadSystemEphemeralAuthContext };
