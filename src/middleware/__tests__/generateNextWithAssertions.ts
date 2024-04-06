const generateNextWithAssertions = (
	runAssertions: (err: unknown) => Promise<void>,
	done: jest.DoneCallback,
) =>
	jest.fn((err) => {
		try {
			expect(err).toBe(undefined);
		} catch (e) {
			done(e);
			return;
		}
		runAssertions(err)
			.catch((error) => {
				throw error;
			})
			.finally(done);
	});

export { generateNextWithAssertions };
