const logout = (system: { specSelectors: { specJson: Function}}) => ({
	statePlugins: {
		auth: {
			wrapActions: {
				logout: (originalFunction: Function) => (keys: Array<string>) => {
					originalFunction(keys);
					const spec = system.specSelectors.specJson();
					const components = spec.get('components');
					const securitySchemes = components.get('securitySchemes');
					const auth = securitySchemes.get('auth');
					const flows = auth.get('flows');
					const authorizationCode = flows.get('authorizationCode');
					const logoutUrl = authorizationCode.get('logoutUrl');
					window.location.assign(logoutUrl);
				}
			}
		}
	}
});

export { logout };
