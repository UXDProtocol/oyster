import { contexts, fromLamports } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import { useMarkets } from '../contexts/market';
import { Reserve, reserveMarketCap } from '../models';
import { useUserBalance } from './useUserBalance';

const { useMint } = contexts.Accounts;

export function useUserCollateralBalance(
  reserve?: Reserve,
  account?: PublicKey,
) {
  const mint = useMint(reserve?.collateral.mintPubkey);
  const { balanceLamports: userBalance, accounts } = useUserBalance(
    reserve?.collateral.mintPubkey,
    account,
  );

  const [balanceInUSD, setBalanceInUSD] = useState(0);
  const { marketEmitter, midPriceInUSD } = useMarkets();

  const balanceLamports = useMemo(
    () => reserve && calculateCollateralBalance(reserve, userBalance),
    [userBalance, reserve],
  );

  const balance = useMemo(() => fromLamports(balanceLamports, mint), [
    balanceLamports,
    mint,
  ]);

  useEffect(() => {
    const updateBalance = () => {
      setBalanceInUSD(
        balance *
          midPriceInUSD(reserve?.liquidity.mintPubkey.toBase58() || ''),
      );
    };

    const dispose = marketEmitter.onMarket(args => {
      if (args.ids.has(reserve?.liquidity.oraclePubkey.toBase58() || '')) {
        updateBalance();
      }
    });

    updateBalance();

    return () => {
      dispose();
    };
  }, [balance, midPriceInUSD, marketEmitter, mint, setBalanceInUSD, reserve]);

  return {
    balance,
    balanceLamports,
    balanceInUSD,
    mint: reserve?.collateral.mintPubkey,
    accounts,
    hasBalance: accounts.length > 0 && balance > 0,
  };
}
export function calculateCollateralBalance(
  reserve: Reserve,
  balanceLamports: number,
) {
  // @FIXME: use BigNumber
  return (
    reserveMarketCap(reserve) *
    (balanceLamports / (reserve?.collateral.mintTotalSupply.toNumber() || 1))
  );
}
