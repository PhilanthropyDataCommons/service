import { isProposal } from '../../../types';
import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type {
  Bundle,
  Proposal,
} from '../../../types';

export const loadProposalBundle = async (
  queryParameters: TinyPgParams,
): Promise<Bundle<Proposal>> => loadBundle(
  'proposals.selectWithPagination',
  queryParameters,
  'proposals',
  isProposal,
);
