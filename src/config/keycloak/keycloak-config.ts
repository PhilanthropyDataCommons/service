import KeycloakConnect from 'keycloak-connect';
import { getLogger } from '../../logger';
import type { MemoryStore } from 'express-session';

const logger = getLogger(__filename);

let keyCloak: KeycloakConnect.Keycloak = {} as KeycloakConnect.Keycloak;

export function initKeycloak(memoryStore: MemoryStore): KeycloakConnect.Keycloak {
  logger.info('Initializing Keycloak...');
  keyCloak = new KeycloakConnect({ store: memoryStore }, './keycloak.json');
  return keyCloak;
}

export function getKeycloak(): KeycloakConnect.Keycloak {
  return keyCloak;
}
