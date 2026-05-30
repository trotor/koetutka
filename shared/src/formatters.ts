import type { Cost, CostObject, OptionalCost } from './types.js';

/**
 * Palauttaa kokeen perushinnan numerona, tai null jos ei tiedossa
 * tai vahingoittunutta dataa. Identtinen index.html:n alkuperäisen
 * getCostValue-funktion kanssa.
 */
export function getCostValue(cost: Cost): number | null {
  if (cost === null || cost === undefined || cost === '') return null;
  if (typeof cost === 'number') return cost;
  if (typeof cost === 'object' && typeof (cost as CostObject).normal === 'number') {
    return (cost as CostObject).normal as number;
  }
  return null;
}

/**
 * Palauttaa lisämaksulistan (esim. ruokailu) jos kustannusobjektissa
 * on optionalAdditionalCosts. Numero/null palauttaa tyhjän taulukon.
 */
export function getOptionalCosts(cost: Cost): OptionalCost[] {
  if (cost && typeof cost === 'object' && Array.isArray((cost as CostObject).optionalAdditionalCosts)) {
    return (cost as CostObject).optionalAdditionalCosts as OptionalCost[];
  }
  return [];
}
