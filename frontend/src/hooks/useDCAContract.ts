import { useState, useEffect } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { DCA_CONTRACT_ADDRESS, DCA_CONTRACT_ABI, USDC_CONTRACT_ABI, USDC_CONTRACT_ADDRESS } from '../config/contracts';

export interface DCAContractData {
  currentPrice: bigint | undefined;
  priceUpdatedAt: bigint | undefined;
  thresholds: bigint[];
  amounts: bigint[];
  executed: boolean[];
  contractBalance: bigint | undefined;
  owner: string | undefined;
  loading: boolean;
  error: Error | null;
}

export function useDCAContract(): DCAContractData {
  const [thresholds, setThresholds] = useState<bigint[]>([]);
  const [amounts, setAmounts] = useState<bigint[]>([]);
  const [executed, setExecuted] = useState<boolean[]>([]);

  // Get current price
  const { data: priceData, error: priceError } = useReadContract({
    address: DCA_CONTRACT_ADDRESS,
    abi: DCA_CONTRACT_ABI,
    functionName: 'getCurrentPrice',
  });

  // Get contract owner
  const { data: owner, error: ownerError } = useReadContract({
    address: DCA_CONTRACT_ADDRESS,
    abi: DCA_CONTRACT_ABI,
    functionName: 'owner',
  });

  // Get contract USDC balance
  const { data: contractBalance, error: balanceError } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [DCA_CONTRACT_ADDRESS],
  });

  // Get threshold array (assuming 3 thresholds)
  const { data: thresholdData } = useReadContracts({
    contracts: [
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'thresholds',
        args: [0n],
      },
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'thresholds',
        args: [1n],
      },
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'thresholds',
        args: [2n],
      },
    ],
  });

  // Get amount array
  const { data: amountData } = useReadContracts({
    contracts: [
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'amounts',
        args: [0n],
      },
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'amounts',
        args: [1n],
      },
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'amounts',
        args: [2n],
      },
    ],
  });

  // Get execution status array
  const { data: executedData } = useReadContracts({
    contracts: [
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'executed',
        args: [0n],
      },
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'executed',
        args: [1n],
      },
      {
        address: DCA_CONTRACT_ADDRESS,
        abi: DCA_CONTRACT_ABI,
        functionName: 'executed',
        args: [2n],
      },
    ],
  });

  // Process data
  useEffect(() => {
    if (thresholdData) {
      const thresholdValues = thresholdData
        .filter(result => result.status === 'success')
        .map(result => result.result as bigint);
      setThresholds(thresholdValues);
    }
  }, [thresholdData]);

  useEffect(() => {
    if (amountData) {
      const amountValues = amountData
        .filter(result => result.status === 'success')
        .map(result => result.result as bigint);
      setAmounts(amountValues);
    }
  }, [amountData]);

  useEffect(() => {
    if (executedData) {
      const executedValues = executedData
        .filter(result => result.status === 'success')
        .map(result => result.result as boolean);
      setExecuted(executedValues);
    }
  }, [executedData]);

  const loading = !priceData || !owner || !contractBalance || thresholds.length === 0;
  const error = priceError || ownerError || balanceError;

  return {
    currentPrice: priceData ? (priceData as [bigint, bigint])[0] : undefined,
    priceUpdatedAt: priceData ? (priceData as [bigint, bigint])[1] : undefined,
    thresholds,
    amounts,
    executed,
    contractBalance,
    owner: owner as string,
    loading,
    error,
  };
}
