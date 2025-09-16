const logout = (system: {
	getState: () => Map<string,Map<string,Map<string,Map<string,Map<string,string>>>>>,
	specSelectors: { specJson: () => Map<string,Map<string,Map<string,Map<string,Map<string,Map<string,string>>>>>> }
}) => ({
	statePlugins: {
		auth: {
			wrapActions: {
				logout: (originalFunction: (keys: string[]) => Map<string,object>) => (keys: string[]) => {
					const spec = system.specSelectors.specJson();
					const logoutUrl = spec.get('components')?.get('securitySchemes')?.get('auth')?.get('flows')?.get('authorizationCode')?.get('logoutUrl');
					const idToken = system.getState().get('auth')?.get('authorized')?.get('auth')?.get('token')?.get('id_token');
					const { href } = window.location;
					const result = originalFunction(keys);
					if (logoutUrl !== undefined) {
						location.href = `${logoutUrl}?&id_token_hint=${idToken}&post_logout_redirect_uri=${href}`;
					}
					return result;
				}
			}
		}
	}
});

export { logout };
