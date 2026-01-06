enum PermissionGrantEntityKeyType {
	ID = 'id',
	SHORT_CODE = 'shortCode',
}

const jsonSchemaTypeForEntityKeyType: Record<
	PermissionGrantEntityKeyType,
	string
> = {
	[PermissionGrantEntityKeyType.ID]: 'integer',
	[PermissionGrantEntityKeyType.SHORT_CODE]: 'string',
};

const getJsonSchemaTypeForEntityKeyType = (
	keyType: PermissionGrantEntityKeyType,
): string => jsonSchemaTypeForEntityKeyType[keyType];

export { getJsonSchemaTypeForEntityKeyType, PermissionGrantEntityKeyType };
