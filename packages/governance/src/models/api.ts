import { PublicKey } from '@solana/web3.js';

import { ParsedAccount } from '@oyster/common';
import { getGovernanceSchemaForAccount } from './serialisation';
import {
  GovernanceAccount,
  GovernanceAccountClass,
  GovernanceAccountType,
  Realm,
} from './accounts';

import { getBorshProgramAccounts, MemcmpFilter } from './core/api';

export async function getRealms(endpoint: string, programId: PublicKey) {
  return getBorshProgramAccounts<Realm>(
    programId,
    at => getGovernanceSchemaForAccount(at),
    endpoint,
    Realm,
  );
}

export async function getGovernanceAccounts<TAccount extends GovernanceAccount>(
  programId: PublicKey,
  endpoint: string,
  accountClass: GovernanceAccountClass,
  accountTypes: GovernanceAccountType[],
  filters: MemcmpFilter[] = [],
) {
  if (accountTypes.length === 1) {
    return getBorshProgramAccounts<TAccount>(
      programId,
      at => getGovernanceSchemaForAccount(at),
      endpoint,
      accountClass as any,
      filters,
      accountTypes[0],
    );
  }

  const all = await Promise.all(
    accountTypes.map(at =>
      getBorshProgramAccounts<TAccount>(
        programId,
        at => getGovernanceSchemaForAccount(at),
        endpoint,
        accountClass as any,
        filters,
        at,
      ),
    ),
  );

  return all.reduce((res, r) => ({ ...res, ...r }), {}) as Record<
    string,
    ParsedAccount<TAccount>
  >;
}
