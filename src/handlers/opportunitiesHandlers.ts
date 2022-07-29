import { getLogger } from '../logger';
import { db } from '../database';
import { Opportunity, isOpportunity, CanonicalField } from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';

const logger = getLogger(__filename);

const getOpportunities = (req: Request, res: Response): void => {
  db.sql('opportunities.fetchAll')
    .then((opportunitiesRaw) => {
      logger.debug(opportunitiesRaw, 'opportunities.fetchAll');
      let opportunitiesSomething: Omit<Opportunity,'applicationSchema'>[] = [];
      /*
      const buildOpportunities = (a: any, b: any) => {
        if ( a.opportunityId == b.opportunityId ) {
          logger.debug('Found a.id %s == b. %s',
            a.opportunityId, b.opportunityId );
        }
        else {
          a.id = b.opportunityId;
          a.canonicalFieldShortCode = b.canonicalFieldShortCode
        }
      };
      */
      type ShortOpportunity = Omit<Opportunity,'applicationSchema'>;
      interface Blah {
        opp: ShortOpportunity;
        can: CanonicalField;
      }
      const { rows } = opportunitiesRaw;
      const buildOpportunities2 = (it: any): Blah => {
        const opportunity: ShortOpportunity = {
          id: it.opportunityId,
          title: it.opportunityTitle,
          createdAt: it.opportunityCreatedAt,
        };
        const canonicalField: CanonicalField = {
          id: it.canonicalFieldId,
          label: it.canonicalFieldLabel,
          shortCode: it.canonicalFieldShortCode,
          dataType: it.canonicalFieldDataType,
          createdAt: it.canonicalFieldCreatedAt,
        };
        return { opp: opportunity, can: canonicalField };
      }
      const mapped = rows.map(buildOpportunities2);
      logger.debug(mapped);


      /*
      rows.map( (it) => { logger.debug(it); });
      logger.debug(rows);
      const reduced = rows.reduce(buildOpportunities, { id: -1, opportunityId: -1 });
      logger.debug(reduced);
      */
      if (isOpportunity(rows)) {
        res.status(200)
          .contentType('application/json')
          .send(rows);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isOpportunity.errors ?? [],
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
