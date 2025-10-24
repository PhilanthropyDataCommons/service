type DeepNestedMap = Map<
	string,
	Map<string, Map<string, Map<string, Map<string, Map<string, string>>>>>
>;
type NestedMap = Map<
	string,
	Map<string, Map<string, Map<string, Map<string, string>>>>
>;
interface System {
	getState: () => NestedMap;
	specSelectors: {
		specJson: () => DeepNestedMap;
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
					/* eslint-disable-next-line complexity --
				  To extract the two (complex) dot chains as functions would require additional plugins,
					see	https://swagger.io/docs/open-source-tools/swagger-ui/customization/plugin-api/#fn so
					that would be even more complex than keeping this barely-too-complex function complex. */
					(keys: string[]) => {
						const logoutUrl = system.specSelectors
							.specJson()
							.get('components')
							?.get('securitySchemes')
							?.get('auth')
							?.get('flows')
							?.get('authorizationCode')
							?.get('logoutUrl');
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
