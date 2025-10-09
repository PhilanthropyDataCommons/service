import { BaseFieldSensitivityClassification } from "../../types";

interface AdaptedEnumFilter<E> {
	name: string;
	isNegated: boolean;
  list: E[];
}

export const getBaseFieldSensitivity = (parameter: { name: string, value: string }): AdaptedEnumFilter<BaseFieldSensitivityClassification> => {
  const { name } = parameter;
  const isNegated = parameter.value.startsWith('!');
  const rawList = parameter.value.split(',');
  if (isNegated && rawList[0] !== undefined) {
    rawList[0] = rawList[0]?.substring(1);
  }
  /* my first attempt
  const list = rawList.map((s: string): BaseFieldSensitivityClassification => {
    if (s.toUpperCase() in BaseFieldSensitivityClassification) {
      return BaseFieldSensitivityClassification[s];
    }
  });
  */

  // Qwen3's follows, almost right.

  // Extract the enum values for comparison
  const enumValues = new Set(Object.values(BaseFieldSensitivityClassification));

  const list = rawList
    .map((s: string): BaseFieldSensitivityClassification | undefined => {
      const normalized = s.trim().toLowerCase();
      return enumValues.has(normalized) ? normalized as BaseFieldSensitivityClassification : undefined;
    })
    // Optionally filter out undefined values if invalid strings are not allowed
    .filter((value): value is BaseFieldSensitivityClassification => value !== undefined);

  return {
    name,
    isNegated,
    list,
  }
};

/*

Qwen3 says:

To correctly map a list of input strings to the enum values in TypeScript, we need to ensure that each string is validated against the set of known enum values. The original code 
attempts to use `in` with the enum object, which checks for keys rather than values, leading to incorrect behavior.

---

### ✅ **Correct Approach Summary**

1. **Normalize the input strings** (e.g., trim and convert to lowercase).
2. **Check if the normalized string is among the enum's values** using `Object.values()` to extract the enum values.
3. **Return the normalized string** as the enum value if it's valid.
4. **Handle invalid strings** gracefully, either by filtering or throwing an error.

---

### ✅ **Corrected Code**

```typescript
enum BaseFieldSensitivityClassification {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  FORBIDDEN = 'forbidden',
}

interface AdaptedEnumFilter<E> {
  name: string;
  isNegated: boolean;
  list: E[];
}

export const getBaseFieldSensitivity = (
  parameter: { name: string; value: string }
): AdaptedEnumFilter<BaseFieldSensitivityClassification> => {
  const { name } = parameter;
  const isNegated = parameter.value.startsWith('!');
  const rawList = parameter.value.split(',');

  // Remove the '!' if negated
  if (isNegated && rawList[0] !== undefined) {
    rawList[0] = rawList[0]?.substring(1);
  }

  // Extract the enum values for comparison
  const enumValues = new Set(Object.values(BaseFieldSensitivityClassification));

  const list = rawList
    .map((s: string): BaseFieldSensitivityClassification | undefined => {
      const normalized = s.trim().toLowerCase();
      return enumValues.has(normalized) ? normalized as BaseFieldSensitivityClassification : undefined;
    })
    // Optionally filter out undefined values if invalid strings are not allowed
    .filter((value): value is BaseFieldSensitivityClassification => value !== undefined);

  return {
    name,
    isNegated,
    list,
  };
};
```

---

### 🔍 **Explanation**

- **`Object.values(BaseFieldSensitivityClassification)`** gives us an array of the enum's string values: `['public', 'restricted', 'forbidden']`.
- **`normalized = s.trim().toLowerCase()`** ensures that the input is case-insensitive.
- **`enumValues.has(normalized)`** checks if the normalized string is one of the valid enum values.
- **Type assertion (`as BaseFieldSensitivityClassification`)** is safe because the enum type is a union of these exact strings.
- **Filtering `undefined`** ensures that only valid enum values are included in the final list.

---

### 🧠 **Why the Original Code Didn't Work**

- Using `s.toUpperCase() in BaseFieldSensitivityClassification` checks for keys in the enum, not values.
- `BaseFieldSensitivityClassification[s]` is incorrect because it uses the original string `s` as the key, which may not match any enum key.
- This approach could cause incorrect mapping or return `undefined` for invalid inputs.

---

### ✅ **Result**

This corrected code ensures that the `list` field in `AdaptedEnumFilter` is an array of only valid enum values, with case-insensitive matching and proper filtering of invalid inputs.

*/