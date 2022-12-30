import { getValueWithFullFieldFromRow } from '../proposalsHandlers';
import type { ProposalRowWithFieldsAndValues } from '../../types';

describe('proposals handlers', () => {
  it('getValueWithFullFieldFromRow should throw an error when an application form field value is null', () => {
    const rowWithAlmostAllFieldsAndValues: ProposalRowWithFieldsAndValues = {
      id: 1,
      applicantId: 1,
      opportunityId: 1,
      externalId: 'external id',
      createdAt: new Date('2022-01-06T22:05:00Z'),
      proposalVersionId: 1,
      proposalVersionApplicationFormId: 1,
      proposalVersionVersion: 1,
      proposalVersionCreatedAt: new Date('2022-01-06T22:05:01Z'),
      proposalFieldValueId: 1,
      proposalFieldValueApplicationFormFieldId: 1,
      proposalFieldValueValue: 'blah',
      proposalFieldValuePosition: 1,
      proposalFieldValueCreatedAt: new Date('2022-01-06T22:06:00Z'),
      applicationFormFieldCanonicalFieldId: 1,
      applicationFormFieldPosition: 1,
      applicationFormFieldLabel: 'label',
      applicationFormFieldCreatedAt: null,
    };

    expect(() => { getValueWithFullFieldFromRow(rowWithAlmostAllFieldsAndValues); })
      .toThrow('Expected ProposalVersion, ProposalFieldValue, and ApplicationFormField values to be present.');
  });
});
