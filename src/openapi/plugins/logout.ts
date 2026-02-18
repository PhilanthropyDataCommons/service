type NestedMap = Map<string, Map<string, Map<string, Map<string, string>>>>;
type DeepNestedMap = Map<
	string,
	Map<string, Map<string, Map<string, Map<string, string>>>>
>;
interface System {
	getState: () => DeepNestedMap;
	specSelectors: {
		specJson: () => NestedMap;
	};
}

const logout = (
	system: System,
): {
	statePlugins: {
		auth: {
			wrapActions: {
				logout: (
					originalFunction: (keys: string[]) => Map<string, object>,
				) => (keys: string[]) => Map<string, object>;
			};
		};
	};
} => ({
	statePlugins: {
		auth: {
			wrapActions: {
				logout:
					(originalFunction: (keys: string[]) => Map<string, object>) =>
					(keys: string[]) => {
						const logoutUrl = system.specSelectors
							.specJson()
							.get('components')
							?.get('securitySchemes')
							?.get('auth')
							?.get('x-logoutUrl');
						const idToken = system
							.getState()
							.get('auth')
							?.get('authorized')
							?.get('auth')
							?.get('token')
							?.get('id_token');
						const {
							location: { href },
						} = window;
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
