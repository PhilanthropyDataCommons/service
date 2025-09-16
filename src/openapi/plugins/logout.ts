type DeepNestedMap = Map<string, Map<string, Map<string, Map<string, Map<string, Map<string, string>>>>>>;
type NestedMap = Map<string, Map<string, Map<string, Map<string, Map<string, string>>>>>;
interface System {
	getState: () => NestedMap;
	specSelectors: {
		specJson: () => DeepNestedMap;
	};
};
const getLogoutUrl = (system: System): string | undefined =>
	system.specSelectors.specJson().get('components')?.get('securitySchemes')?.get('auth')?.get('flows')?.get('authorizationCode')?.get('logoutUrl');

const getIdToken = (system: System): string | undefined =>
	system.getState().get('auth')?.get('authorized')?.get('auth')?.get('token')?.get('id_token');

const logout = (system: System): {
	statePlugins: {
		auth: {
			wrapActions: {
				logout: (originalFunction: (keys: string[]) => Map<string, object>) => (keys: string[]) => Map<string, object>;
			};
		};
	};
} => ({
	statePlugins: {
		auth: {
			wrapActions: {
				logout: (originalFunction: (keys: string[]) => Map<string, object>) => (keys: string[]) => {
					const logoutUrl = getLogoutUrl(system);
					const idToken = getIdToken(system);
					const { location: { href } } = window;
					const result = originalFunction(keys);
					if (logoutUrl !== undefined) {
						location.href = `${logoutUrl}?&id_token_hint=${idToken}&post_logout_redirect_uri=${href}`;
					}
					return result;
				},
			},
		},
	},
});

export { logout };