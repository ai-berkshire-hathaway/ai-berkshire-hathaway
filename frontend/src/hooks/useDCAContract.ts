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

  // 获取当前价格
  const { data: priceData, error: priceError } = useReadContract({
    address: DCA_CONTRACT_ADDRESS,
    abi: DCA_CONTRACT_ABI,
    functionName: 'getCurrentPrice',
  });

  // 获取合约所有者
  const { data: owner, error: ownerError } = useReadContract({
    address: DCA_CONTRACT_ADDRESS,
    abi: DCA_CONTRACT_ABI,
    functionName: 'owner',
  });

  // 获取合约 USDC 余额
  const { data: contractBalance, error: balanceError } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [DCA_CONTRACT_ADDRESS],
  });

  // 获取阈值数组 (假设有3个阈值)
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

  // 获取金额数组
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

  // 获取执行状态数组
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

  // 处理数据
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
