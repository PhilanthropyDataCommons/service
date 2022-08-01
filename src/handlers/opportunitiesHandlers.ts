import { getLogger } from '../logger';
import { db } from '../database';
import { isOpportunity, isOpportunityArraySchema } from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';
import type {
  Opportunity,
  CanonicalField,
  ApplicationSchema,
} from '../types';
import type { ApplicationSchemaField } from '../types/ApplicationSchemaField';

const logger = getLogger(__filename);

const getOpportunities = (req: Request, res: Response): void => {
  db.sql('opportunities.fetchAll')
    .then((opportunitiesRaw) => {
      logger.debug(opportunitiesRaw, 'opportunities.fetchAll');
      type ShortOpportunity = Omit<Opportunity, 'applicationSchema'>;
      type ShortApplicationSchema = Omit<ApplicationSchema, 'fields'>;
      type ShortApplicationSchemaField = Omit<ApplicationSchemaField, 'canonicalField'>;

      // Here is how each raw, de-normalized row fetched from the DB looks:
      interface RowPerField {
        opportunity: ShortOpportunity;
        applicationSchema: ShortApplicationSchema;
        applicationSchemaField: ShortApplicationSchemaField;
        canonicalField: CanonicalField;
      };

      const { rows } = opportunitiesRaw;
      const formalizeRow = (it: any): RowPerField => {
        const opportunity: ShortOpportunity = {
          id: it.opportunityId,
          title: it.opportunityTitle,
          createdAt: it.opportunityCreatedAt,
        };
        const applicationSchema: ShortApplicationSchema = {
          id: it.applicationSchemaId,
          version: it.applicationSchemaVersion,
          createdAt: it.applicationSchemaCreatedAt,
        };
        const applicationSchemaField: ShortApplicationSchemaField = {
          id: it.applicationSchemaFieldId,
          label: it.applicationSchemaFieldLabel,
          position: it.applicationSchemaFieldPosition,
          createdAt: it.applicationSchemaFieldCreatedAt,
        };
        const canonicalField: CanonicalField = {
          id: it.canonicalFieldId,
          label: it.canonicalFieldLabel,
          shortCode: it.canonicalFieldShortCode,
          dataType: it.canonicalFieldDataType,
          createdAt: it.canonicalFieldCreatedAt,
        };
        return {
          opportunity: opportunity,
          applicationSchema: applicationSchema,
          applicationSchemaField: applicationSchemaField,
          canonicalField: canonicalField,
        };
      }
      const formalized = rows.map(formalizeRow);
      logger.debug(formalized);

      const schematize = (it: RowPerField[]): Opportunity[] => {
        const merged: Opportunity[] = [];
        let lastOpportunity: Opportunity;
        let lastApplicationSchema: ApplicationSchema;

        it.forEach((row: RowPerField) => {
          const field: ApplicationSchemaField = {
            ...row.applicationSchemaField,
            canonicalField: row.canonicalField
          };

          let applicationSchema: ApplicationSchema = {
            ...row.applicationSchema,
            fields: [field]
          };

          if (lastApplicationSchema !== null && lastApplicationSchema !== undefined
              && row.applicationSchema.id === lastApplicationSchema.id) {
            applicationSchema = lastApplicationSchema;
            applicationSchema.fields.push(field);
          }

          let opportunity: Opportunity = {
            ...row.opportunity,
            applicationSchema: applicationSchema
          };

          if (lastOpportunity !== null && lastOpportunity !== undefined
              && row.opportunity.id === lastOpportunity.id ) {
          }
          else{
            merged.push(opportunity);
          }

          lastOpportunity = opportunity;
          lastApplicationSchema = applicationSchema;
        });

        return merged;
      };

      const schematized = schematize(formalized);
      logger.debug(schematized);

      if (isOpportunityArraySchema(schematized)) {
        res.status(200)
          .contentType('application/json')
          .send(schematized);
      } else {
        throw new ValidationError(
          'Unable to build the expected format.',
          isOpportunityArraySchema.errors ?? [],
        );
      }
    })
    .catch((error: unknown) => {
      logger.error(error);
      res.status(500)
        .contentType('application/json')
        .send(error);
    });
};

export const opportunitiesHandlers = {
  getOpportunities,
};
