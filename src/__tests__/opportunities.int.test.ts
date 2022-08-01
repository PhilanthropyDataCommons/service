import request from 'supertest';
import { app } from '../app';
import { db } from '../database';
import { getLogger } from '../logger';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/opportunities', () => {
  describe('/', () => {
    interface Id { id: number }

    logger.debug('Now running an opportunities test');
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/opportunities')
        .expect(200, []);
    });

    it('returns all opportunities present in the database', async () => {
      // Seed the db with canonical fields, opportunities, schemas with fields.
      const fields: Result<{ id: number; shortCode: string }> = await db.query(`
        INSERT INTO canonical_fields (
          label,
          short_code,
          data_type,
          created_at
        )
        VALUES
          ( 'First Name', 'firstName', 'string', '2525-01-01T00:00:01Z' ),
          ( 'Last Name', 'lastName', 'string', '2525-01-01T00:00:02Z' ),
          ( 'Proposal Summary', 'proposalSummary', 'string', '2525-01-01T00:00:03Z' ),
          ( 'Proposal Budget', 'proposalBudget', 'number', '2525-01-01T00:00:04Z' )
        RETURNING id, short_code AS "shortCode";
      `);
      logger.debug('fields: %o', fields);
      const opportunityIds: Result<Id> = await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' ),
          ( 'Terrific opportunity 👐', '2525-01-01T00:00:06Z' )
        RETURNING id;
      `);
      logger.debug('opportunityIds: %o', opportunityIds);

      // Create two schema versions each for two separate opportunities:
      const applicationSchemaIds: Result<Id> = await db.query(`
        INSERT INTO application_schemas (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( :opportunityOne, 7, '2525-01-01T00:00:07Z' ),
          ( :opportunityOne, 11, '2525-01-01T00:00:08Z' ),
          ( :opportunityTwo, 13, '2525-01-01T00:00:09Z' ),
          ( :opportunityTwo, 19, '2525-01-01T00:00:10Z' )
        returning id;
      `, {
        opportunityOne: opportunityIds.rows[0].id,
        opportunityTwo: opportunityIds.rows[1].id,
      });
      logger.debug('applicationSchemaIds: %o', applicationSchemaIds);

      const lastNameFieldId = fields.rows.filter((it) => it.shortCode === 'lastName')[0].id;
      const firstNameFieldId = fields.rows.filter((it) => it.shortCode === 'firstName')[0].id;
      const proposalBudgetFieldId = fields.rows.filter((it) => it.shortCode === 'proposalBudget')[0].id;
      const proposalSummaryFieldId = fields.rows.filter((it) => it.shortCode === 'proposalSummary')[0].id;

      // Add one field to each of the first application schema versions and
      // then two fields to the next/latest application schema version, with
      // the second application schema inserted out of order with regard to the
      // position of fields in the application schema.
      const applicationSchemaFieldIds: Result<Id> = await db.query(`
        INSERT INTO application_schema_fields (
          application_schema_id,
          canonical_field_id,
          position,
          label,
          created_at
        )
        VALUES
          ( :applicationSchemaOne, :lastNameFieldId, 1, 'Surname', '2525-01-01T00:00:11Z' ),
          ( :applicationSchemaTwo, :lastNameFieldId, 1, 'Surname', '2525-01-01T00:00:12Z' ),
          ( :applicationSchemaTwo, :firstNameFieldId, 2, 'Preferred Name', '2525-01-01T00:00:13Z' ),
          ( :applicationSchemaThree, :proposalBudgetFieldId, 1, 'Budget', '2525-01-01T00:00:14Z' ),
          ( :applicationSchemaFour, :proposalBudgetFieldId, 2, 'Budget', '2525-01-01T00:00:15Z' ),
          ( :applicationSchemaFour, :proposalSummaryFieldId, 1, 'Proposal Abstract', '2525-01-01T00:00:16Z' );
      `, {
        applicationSchemaOne: applicationSchemaIds.rows[0].id,
        applicationSchemaTwo: applicationSchemaIds.rows[1].id,
        applicationSchemaThree: applicationSchemaIds.rows[2].id,
        applicationSchemaFour: applicationSchemaIds.rows[3].id,
        lastNameFieldId,
        firstNameFieldId,
        proposalBudgetFieldId,
        proposalSummaryFieldId,
      });
      logger.debug('applicationSchemaFieldIds: %o', applicationSchemaFieldIds);
      await agent
        .get('/opportunities')
        .expect(
          200,
          [
            {
              id: 1,
              createdAt: '2525-01-01T00:00:05.000Z',
              title: 'Tremendous opportunity 👌',
              applicationSchema: {
                id: 2,
                createdAt: '2525-01-01T00:00:08.000Z',
                version: 11,
                fields: [
                  {
                    id: 2,
                    createdAt: '2525-01-01T00:00:12.000Z',
                    label: 'Surname',
                    position: 1,
                    canonicalField: {
                      id: lastNameFieldId,
                      createdAt: '2525-01-01T00:00:02.000Z',
                      shortCode: 'lastName',
                      label: 'Last Name',
                      dataType: 'string',
                    },
                  },
                  {
                    id: 3,
                    createdAt: '2525-01-01T00:00:13.000Z',
                    label: 'Preferred Name',
                    position: 2,
                    canonicalField: {
                      id: firstNameFieldId,
                      createdAt: '2525-01-01T00:00:01.000Z',
                      shortCode: 'firstName',
                      label: 'First Name',
                      dataType: 'string',
                    },
                  },
                ],
              },
            },
            {
              id: 2,
              createdAt: '2525-01-01T00:00:06.000Z',
              title: 'Terrific opportunity 👐',
              applicationSchema: {
                id: 4,
                createdAt: '2525-01-01T00:00:10.000Z',
                version: 19,
                fields: [
                  {
                    id: 5,
                    createdAt: '2525-01-01T00:00:15.000Z',
                    label: 'Budget',
                    position: 2,
                    canonicalField: {
                      id: proposalBudgetFieldId,
                      createdAt: '2525-01-01T00:00:04.000Z',
                      shortCode: 'proposalBudget',
                      label: 'Proposal Budget',
                      dataType: 'number',
                    },
                  },
                  {
                    id: 6,
                    createdAt: '2525-01-01T00:00:16.000Z',
                    label: 'Proposal Abstract',
                    position: 1,
                    canonicalField: {
                      id: proposalSummaryFieldId,
                      createdAt: '2525-01-01T00:00:03.000Z',
                      shortCode: 'proposalSummary',
                      label: 'Proposal Summary',
                      dataType: 'string',
                    },
                  },
                ],
              },
            },
          ],
        );
    });
  });
});
