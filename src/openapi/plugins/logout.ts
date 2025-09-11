const logout = (system: { specSelectors: { specJson: () => Map<string,Map<string,Map<string,Map<string,Map<string,Map<string,string>>>>>> }}) => ({
	statePlugins: {
		auth: {
			wrapActions: {
				logout: (originalFunction: (keys: string[]) => Map<string,object>) => (keys: string[]) => {
					const spec = system.specSelectors.specJson();
					const components = spec.get('components');
					const securitySchemes = components?.get('securitySchemes');
					const auth = securitySchemes?.get('auth');
					const flows = auth?.get('flows');
					const authorizationCode = flows?.get('authorizationCode');
					const logoutUrl = authorizationCode?.get('logoutUrl');
					if (logoutUrl !== undefined) {
						window.location.href = logoutUrl;
					}
					return originalFunction(keys);
				}
			}
		}
	}
});

export { logout };
