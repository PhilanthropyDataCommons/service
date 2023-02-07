import {
  joinApplicationFormFieldsToProposalFieldValues,
  joinProposalFieldValuesToProposalVersion,
} from '../proposalsHandlers';
import type {
  ApplicationFormField,
  ProposalFieldValue,
  ProposalVersion,
} from '../../types';

describe('mergeProposalFieldValues', () => {
  it('should merge proposal values into proposal version', () => {
    const proposalVersion: ProposalVersion = {
      id: 3049,
      proposalId: 3019,
      applicationFormId: 3061,
      version: 3067,
      createdAt: new Date('2023-01-23T12:08:00-0600'),
    };
    const fieldValues: ProposalFieldValue[] = [
      {
        id: 3109,
        proposalVersionId: 3049,
        applicationFormFieldId: 3119,
        position: 3121,
        value: 'Three thousand one hundred thirty seven',
        createdAt: new Date('2023-01-23T12:14:00-0600'),
      },
      {
        id: 3163,
        proposalVersionId: 3049,
        applicationFormFieldId: 3167,
        position: 3169,
        value: 'Three thousand one hundred eighty one',
        createdAt: new Date('2023-01-23T12:16:00-0600'),
      },
      {
        id: 3187,
        proposalVersionId: 3079,
        applicationFormFieldId: 3191,
        position: 3203,
        value: 'Three thousand two hundred nine',
        createdAt: new Date('2023-01-23T12:17:00-0600'),
      },
      {
        id: 3217,
        proposalVersionId: 3079,
        applicationFormFieldId: 3251,
        position: 3253,
        value: 'Three thousand two hundred fifty seven',
        createdAt: new Date('2023-01-23T12:18:00-0600'),
      },
    ];
    const proposalVersionWithFieldValues = joinProposalFieldValuesToProposalVersion(
      proposalVersion,
      fieldValues,
    );
    const expectedProposalVersion = {
      id: 3049,
      proposalId: 3019,
      applicationFormId: 3061,
      version: 3067,
      createdAt: new Date('2023-01-23T12:08:00-0600'),
      fieldValues: [
        {
          id: 3109,
          proposalVersionId: 3049,
          applicationFormFieldId: 3119,
          position: 3121,
          value: 'Three thousand one hundred thirty seven',
          createdAt: new Date('2023-01-23T12:14:00-0600'),
        },
        {
          id: 3163,
          proposalVersionId: 3049,
          applicationFormFieldId: 3167,
          position: 3169,
          value: 'Three thousand one hundred eighty one',
          createdAt: new Date('2023-01-23T12:16:00-0600'),
        },
      ],
    };
    expect(proposalVersionWithFieldValues).toEqual(expectedProposalVersion);
  });

  it('should return a proposal version like the one given when no field values are given', () => {
    const proposalVersion: ProposalVersion = {
      id: 3413,
      proposalId: 3433,
      applicationFormId: 3449,
      version: 3457,
      createdAt: new Date('2023-01-23T13:54:00-0600'),
    };
    expect(joinProposalFieldValuesToProposalVersion(proposalVersion, [])).toEqual({
      id: 3413,
      proposalId: 3433,
      applicationFormId: 3449,
      version: 3457,
      createdAt: new Date('2023-01-23T13:54:00-0600'),
    });
  });
});

describe('mergeApplicationFormFields', () => {
  it('should merge application form fields into proposal field values', () => {
    const values: ProposalFieldValue[] = [
      {
        id: 3271,
        proposalVersionId: 3299,
        applicationFormFieldId: 3301,
        position: 3307,
        value: 'Three thousand three hundred thirteen',
        createdAt: new Date('2023-01-23T13:39:00-0600'),
      },
      {
        id: 3319,
        proposalVersionId: 3323,
        applicationFormFieldId: 3329,
        position: 3331,
        value: 'Three thousand three hundred forty three',
        createdAt: new Date('2023-01-23T13:41:00-0600'),
      },
    ];
    const fields: ApplicationFormField[] = [
      {
        id: 3301,
        applicationFormId: 3347,
        canonicalFieldId: 3359,
        position: 3361,
        label: 'Three thousand three hundred sixty one',
        createdAt: new Date('2023-01-23T13:42:00-0600'),
      },
      {
        id: 3329,
        applicationFormId: 3371,
        canonicalFieldId: 3389,
        position: 3391,
        label: 'Three thousand four hundred seven',
        createdAt: new Date('2023-01-23T13:43:00-0600'),
      },
    ];
    const valuesWithFields = joinApplicationFormFieldsToProposalFieldValues(values, fields);
    expect(valuesWithFields).toEqual([
      {
        id: 3271,
        proposalVersionId: 3299,
        applicationFormFieldId: 3301,
        position: 3307,
        value: 'Three thousand three hundred thirteen',
        createdAt: new Date('2023-01-23T13:39:00-0600'),
        applicationFormField: {
          id: 3301,
          applicationFormId: 3347,
          canonicalFieldId: 3359,
          position: 3361,
          label: 'Three thousand three hundred sixty one',
          createdAt: new Date('2023-01-23T13:42:00-0600'),
        },
      },
      {
        id: 3319,
        proposalVersionId: 3323,
        applicationFormFieldId: 3329,
        position: 3331,
        value: 'Three thousand three hundred forty three',
        createdAt: new Date('2023-01-23T13:41:00-0600'),
        applicationFormField: {
          id: 3329,
          applicationFormId: 3371,
          canonicalFieldId: 3389,
          position: 3391,
          label: 'Three thousand four hundred seven',
          createdAt: new Date('2023-01-23T13:43:00-0600'),
        },
      },
    ]);
  });

  it('should throw an Error when lengths of the two args differ', () => {
    const values: ProposalFieldValue[] = [
      {
        id: 3631,
        proposalVersionId: 3637,
        applicationFormFieldId: 3643,
        position: 3659,
        value: 'Three thousand six hundred seventy one',
        createdAt: new Date('2023-01-23T14:14:00-0600'),
      },
    ];
    const fields: ApplicationFormField[] = [
      {
        id: 3643,
        applicationFormId: 3673,
        canonicalFieldId: 3677,
        position: 3691,
        label: 'Three thousand six hundred ninety seven',
        createdAt: new Date('2023-01-23T14:15:00-0600'),
      },
      {
        id: 3701,
        applicationFormId: 3673,
        canonicalFieldId: 3709,
        position: 3719,
        label: 'Three thousand seven hundred twenty seven',
        createdAt: new Date('2023-01-23T14:16:00-0600'),
      },
    ];
    expect(() => {
      joinApplicationFormFieldsToProposalFieldValues(values, fields);
    }).toThrow(Error);
  });

  it('should throw an Error when a field is missing at the same index as value', () => {
    const values: ProposalFieldValue[] = [
      {
        id: 3733,
        proposalVersionId: 3739,
        applicationFormFieldId: 3761,
        position: 3767,
        value: 'Three thousand seven hundred sixty seven',
        createdAt: new Date('2023-01-23T14:28:00-0600'),
      },
      {
        id: 3769,
        proposalVersionId: 3779,
        applicationFormFieldId: 3793,
        position: 3797,
        value: 'Three thousand eight hundred three',
        createdAt: new Date('2023-01-23T14:30:00-0600'),
      },
    ];
    // Skip array index 2, go to 3, such that we have an array like [a, b, undefined, c]:
    values[3] = {
      id: 3821,
      proposalVersionId: 3823,
      applicationFormFieldId: 3833,
      position: 3847,
      value: 'Three thousand eight hundred fifty one',
      createdAt: new Date('2023-01-23T14:32:00-0600'),
    };

    const fields: ApplicationFormField[] = [
      {
        // Matches the first value.
        id: 3761,
        applicationFormId: 3863,
        canonicalFieldId: 3877,
        position: 3881,
        label: 'Three thousand eight hundred eighty nine',
        createdAt: new Date('2023-01-23T14:33:00-0600'),
      },
    ];
    // Skip array index 1, go to 2, such that we have an array like [a, undefined, b, c]:
    fields[2] = {
      // Matches the second value, but in the wrong position here.
      id: 3793,
      applicationFormId: 3907,
      canonicalFieldId: 3911,
      position: 3917,
      label: 'Three thousand nine hundred nineteen',
      createdAt: new Date('2023-01-23T14:36:00-0600'),
    };
    fields[3] = {
      // Matches the third value, but in the wrong position here.
      id: 3833,
      applicationFormId: 3923,
      canonicalFieldId: 3929,
      position: 3931,
      label: 'Three thousand nine forty three',
      createdAt: new Date('2023-01-23T14:39:00-0600'),
    };
    // We now have values and fields of equal length, defined either by max index or by element
    // count, but with mismatches in position within those arrays. This should throw an Error.
    expect(() => {
      joinApplicationFormFieldsToProposalFieldValues(values, fields);
    }).toThrow(Error);
  });

  it('should throw an Error when the application form field IDs do not match', () => {
    const values: ProposalFieldValue[] = [
      {
        id: 3947,
        proposalVersionId: 3967,
        /// This application form field id 3989 does not match the below 4007
        applicationFormFieldId: 3989,
        position: 4001,
        value: 'Four thousand three',
        createdAt: new Date('2023-01-24T08:49:00-0600'),
      },
    ];
    const fields: ApplicationFormField[] = [
      {
        /// This application form field id 4007 does not match the above 3989
        id: 4007,
        applicationFormId: 4013,
        canonicalFieldId: 4019,
        position: 4021,
        label: 'Four thousand twenty seven',
        createdAt: new Date('2023-01-24T08:50:00-0600'),
      },
    ];
    expect(() => {
      joinApplicationFormFieldsToProposalFieldValues(values, fields);
    }).toThrow(Error);
  });
});
