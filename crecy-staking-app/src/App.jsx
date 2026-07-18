import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import { Wallet, ArrowRightLeft, TrendingUp, AlertCircle, CheckCircle2, Sun, Moon, Globe } from 'https://esm.sh/lucide-react@0.300.0';
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from 'https://esm.sh/@web3modal/ethers@5.1.11/react?external=react';
import { BrowserProvider, Contract, parseUnits, formatUnits, MaxUint256, JsonRpcProvider } from 'https://esm.sh/ethers@6.11.1';

// Inject Google Fonts dynamically
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap');
      
      .font-title {
        font-family: 'Atkinson Hyperlegible', sans-serif;
        font-weight: 400;
      }
      .font-body {
        font-family: 'Red Hat Display', sans-serif;
        font-weight: 400;
      }
      
      input[type=number]::-webkit-inner-spin-button, 
      input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
    `}
  </style>
);

const translations = {
  en: {
    title: "Staking",
    subtitle: "22% Max APY • Impact Investment",
    connect: "Connect Wallet",
    connected: "Connected",
    totalStaked: "Total Staked",
    currentYield: "Current Yield",
    treasuryPool: "Treasury Pool",
    filled: "Filled",
    cap: "Cap",
    baseMilestone: "15.0% Base + 7.0% Milestone",
    sustainsTvl: "Sustains current TVL automatically",
    yourPosition: "Your Position",
    stakedBalance: "Staked Balance",
    walletBalance: "Wallet Balance",
    pendingRewards: "Pending Rewards",
    liquidBase: "Liquid Base (15%):",
    milestone: "Unlocked Milestone (7%):",
    nextUnlock: "Next 1.75% Bonus Unlock:",
    claimRewards: "Claim All Rewards",
    stakeTokens: "Stake Tokens",
    max: "Max",
    approve: "Approve cRECY",
    approving: "Approving...",
    processing: "Processing...",
    stake: "Stake",
    unstakeTokens: "Unstake Tokens",
    unstakeClaim: "Unstake & Claim",
    unstakeNote: "Note: Unstaking early forfeits the unearned bonus for the withdrawn amount, but preserves the timer for the remaining principal.",
    uniswapTitle: "Uniswap V3 Fee Redirection",
    uniswapDesc: "Link your Uniswap V3 cRECY liquidity position. Automatically redirect a percentage of your trading fees to fund the staking rewards pool while retaining the rest.",
    regPos: "1. Register Position",
    nftId: "NFT Token ID",
    feeSplit: "Fee Split to Stakers (%)",
    feeNote: "Enter in basis points (1000 = 10%, max 10000)",
    linkLp: "Link LP Position",
    harvestFees: "2. Harvest & Redirect",
    harvestDesc: "Anyone can trigger the harvest. The protocol automatically swaps paired tokens to cRECY, deposits your chosen split into the Rewards Pool, and sends the remaining fees to your wallet.",
    targetNft: "Target NFT ID",
    harvestBtn: "Execute LP Harvest",
    msgApprove: "Successfully approved cRECY contract.",
    msgStake: "Successfully staked",
    msgUnstake: "Successfully unstaked",
    msgClaim: "Successfully claimed rewards.",
    msgRegister: "LP Position linked",
    msgHarvest: "Harvested fees from LP",
    errInvalid: "Invalid amount or insufficient balance.",
    errSplitBounds: "Fee split must be between 0 and 10000.",
    txConfirm: "Confirming transaction on network...",
    na: "N/A"
  },
  pt: {
    title: "Staking",
    subtitle: "Até 22% APY • Investimento de Impacto",
    connect: "Conectar Carteira",
    connected: "Conectado",
    totalStaked: "Total em Staking",
    currentYield: "Rendimento Atual",
    treasuryPool: "Fundo de Recompensas",
    filled: "Preenchido",
    cap: "Capacidade",
    baseMilestone: "15.0% Base + 7.0% Marco",
    sustainsTvl: "Sustenta o TVL atual automaticamente",
    yourPosition: "Sua Posição",
    stakedBalance: "Saldo em Staking",
    walletBalance: "Saldo na Carteira",
    pendingRewards: "Recompensas Pendentes",
    liquidBase: "Base Líquida (15%):",
    milestone: "Bônus Desbloqueado (7%):",
    nextUnlock: "Próximo Bônus de 1.75% em:",
    claimRewards: "Resgatar Todas as Recompensas",
    stakeTokens: "Fazer Staking",
    max: "Máx",
    approve: "Aprovar cRECY",
    approving: "Aprovando...",
    processing: "Processando...",
    stake: "Fazer Staking",
    unstakeTokens: "Retirar do Staking",
    unstakeClaim: "Retirar & Resgatar",
    unstakeNote: "Nota: A retirada antecipada abre mão do bônus não ganho para o valor retirado, mas preserva o cronômetro do capital principal restante.",
    uniswapTitle: "Redirecionamento de Taxas Uniswap V3",
    uniswapDesc: "Vincule sua posição de liquidez cRECY na Uniswap V3. Redirecione automaticamente uma porcentagem de suas taxas de negociação para o fundo de staking mantendo o restante.",
    regPos: "1. Registrar Posição",
    nftId: "ID do Token NFT",
    feeSplit: "Taxa para Stakers (%)",
    feeNote: "Insira em pontos base (1000 = 10%, máx 10000)",
    linkLp: "Vincular Posição LP",
    harvestFees: "2. Coletar & Redirecionar",
    harvestDesc: "Qualquer pessoa pode iniciar a coleta. O protocolo converte automaticamente os tokens pareados para cRECY, deposita a divisão escolhida no Fundo e envia o restante para sua carteira.",
    targetNft: "ID do NFT Alvo",
    harvestBtn: "Executar Coleta LP",
    msgApprove: "Contrato cRECY aprovado com sucesso.",
    msgStake: "em staking com sucesso.",
    msgUnstake: "retirados do staking e resgatados.",
    msgClaim: "Recompensas resgatadas com sucesso.",
    msgRegister: "Posição LP vinculada com sucesso.",
    msgHarvest: "Taxas coletadas da Posição LP",
    errInvalid: "Valor inválido ou saldo insuficiente.",
    errSplitBounds: "A divisão de taxas deve ser entre 0 e 10000.",
    txConfirm: "Confirmando transação na rede...",
    na: "N/D"
  }
};

// ==========================================
// CONFIGURATION VARIABLES
// ==========================================
const PROJECT_ID = "YOUR_WALLETCONNECT_PROJECT_ID_HERE" || "1234";

// WARNING: Ensure this is your newly deployed Staking Contract Address starting with 0x
const STAKING_CONTRACT_ADDRESS = "0xCF1B48e2E7B4588b6673c4aB1855aFE71368e872";
const CRECY_TOKEN_ADDRESS = "0x34C11A932853Ae24E845Ad4B633E3cEf91afE583";

// Celo Network Configuration
const celo = {
  chainId: 42220,
  name: 'Celo',
  currency: 'CELO',
  explorerUrl: 'https://celoscan.io',
  rpcUrl: 'https://forno.celo.org'
};

const metadata = {
  name: 'cRECY Staking',
  description: 'cRECY Impact Investment Staking Dashboard',
  url: 'https://crecy-staking.com', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
});

if (PROJECT_ID !== "YOUR_WALLETCONNECT_PROJECT_ID_HERE") {
  createWeb3Modal({
    ethersConfig,
    chains: [celo],
    projectId: PROJECT_ID,
    enableAnalytics: false
  });
}

// Minimal ABIs required for interaction
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function registerLpPosition(uint256 tokenId, uint256 feeSplitBps, bool active) external",
  "function collectAndRedirectLpFees(uint256 tokenId, uint256 amountMinimum, uint256 deadline) external",
  "function stakedBalance(address) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function maxCapacity() view returns (uint256)",
  "function pendingBaseYield(address) view returns (uint256)",
  "function pendingMilestoneYield(address) view returns (uint256)",
  "function userStakeTime(address) view returns (uint256)"
];

export default function StakingDashboard() {
  const [lang, setLang] = useState('en');
  const [isDark, setIsDark] = useState(true);
  const t = translations[lang];

  // Web3Modal Hooks
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  // Component State
  const [isLoading, setIsLoading] = useState(false);
  const [txMessage, setTxMessage] = useState({ type: '', text: '' });

  // Protocol State
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [rewardsPool, setRewardsPool] = useState(0);

  // User State
  const [walletBalance, setWalletBalance] = useState(0);
  const [rawWalletBalance, setRawWalletBalance] = useState("");
  const [allowance, setAllowance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [rawStakedAmount, setRawStakedAmount] = useState("");
  const [pendingBase, setPendingBase] = useState(0);
  const [pendingMilestone, setPendingMilestone] = useState(0);
  const [lastMilestoneTime, setLastMilestoneTime] = useState(0);

  // Form State
  const [stakeInput, setStakeInput] = useState("");
  const [unstakeInput, setUnstakeInput] = useState("");
  const [lpTokenId, setLpTokenId] = useState("");
  const [lpFeeSplit, setLpFeeSplit] = useState("");

  const MILESTONE_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

  const fetchData = async () => {
    try {
      // 1. Fetch Global Public Data (Works for guests without connected wallets)
      const publicProvider = new JsonRpcProvider(celo.rpcUrl);
      const publicStakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, publicProvider);
      
      try {
        const totalWei = await publicStakingContract.totalStaked();
        setTotalStaked(Number(formatUnits(totalWei, 18)));
      } catch (e) { 
        console.warn("Could not fetch totalStaked", e); 
      }

      try {
        const maxCapWei = await publicStakingContract.maxCapacity();
        setMaxCapacity(Number(formatUnits(maxCapWei, 18)));
      } catch (e) { 
        console.warn("Could not fetch maxCapacity", e); 
      }

      try {
        const publicTokenContract = new Contract(CRECY_TOKEN_ADDRESS, ERC20_ABI, publicProvider);
        const contractBalanceWei = await publicTokenContract.balanceOf(STAKING_CONTRACT_ADDRESS);
        const contractBalance = Number(formatUnits(contractBalanceWei, 18));
        
        const currentTotalWei = await publicStakingContract.totalStaked();
        const currentTotalStaked = Number(formatUnits(currentTotalWei, 18));
        
        const calculatedPool = Math.max(0, contractBalance - currentTotalStaked);
        setRewardsPool(calculatedPool);
      } catch (e) {
        console.warn("Could not calculate rewardsPool", e);
      }

      // 2. Fetch User Specific Data (Requires connected wallet)
      if (isConnected && walletProvider) {
        const ethersProvider = new BrowserProvider(walletProvider);
        const tokenContract = new Contract(CRECY_TOKEN_ADDRESS, ERC20_ABI, ethersProvider);
        const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, ethersProvider);

        try {
          const balanceWei = await tokenContract.balanceOf(address);
          setWalletBalance(Number(formatUnits(balanceWei, 18)));
          setRawWalletBalance(formatUnits(balanceWei, 18));
        } catch (e) { console.warn("Could not fetch wallet balance", e); }

        try {
          const allowanceWei = await tokenContract.allowance(address, STAKING_CONTRACT_ADDRESS);
          setAllowance(Number(formatUnits(allowanceWei, 18)));
        } catch (e) { console.warn("Could not fetch allowance", e); }

        try {
          const stakedWei = await stakingContract.stakedBalance(address);
          setStakedAmount(Number(formatUnits(stakedWei, 18)));
          setRawStakedAmount(formatUnits(stakedWei, 18));
        } catch (e) { console.warn("Could not fetch stakedBalance", e); }
        
        try {
          const baseYieldWei = await stakingContract.pendingBaseYield(address);
          setPendingBase(Number(formatUnits(baseYieldWei, 18)));
        } catch (e) {}
        
        try {
          const milestoneYieldWei = await stakingContract.pendingMilestoneYield(address);
          setPendingMilestone(Number(formatUnits(milestoneYieldWei, 18)));
        } catch (e) {}

        try {
          const stakeTime = await stakingContract.userStakeTime(address);
          setLastMilestoneTime(Number(stakeTime) * 1000);
        } catch (e) {}
      }
    } catch (error) {
      console.error("Error connecting to blockchain data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [isConnected, address, walletProvider]);

  // Fallback Simulator for visuals between real-time blockchain updates
  useEffect(() => {
    if (stakedAmount > 0) {
      const interval = setInterval(() => {
        const yieldPerSecond = (stakedAmount * 0.15) / 31536000;
        setPendingBase(prev => prev + yieldPerSecond);
        
        if (lastMilestoneTime > 0 && Date.now() >= lastMilestoneTime + MILESTONE_DURATION) {
          const milestonesPassed = Math.floor((Date.now() - lastMilestoneTime) / MILESTONE_DURATION);
          const earnedMilestone = stakedAmount * 0.0175 * milestonesPassed;
          setPendingMilestone(earnedMilestone);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stakedAmount, lastMilestoneTime]);

  const handleTx = async (action, successMsg) => {
    if (!walletProvider) return;
    setIsLoading(true);
    setTxMessage({ type: 'info', text: t.txConfirm });
    
    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      await action(signer);
      
      setTxMessage({ type: 'success', text: successMsg });
      
      // Fetch immediately, and again after 3 seconds to catch node indexing lag
      fetchData(); 
      setTimeout(fetchData, 3000);
      
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxMessage({ type: 'error', text: error.reason || "Transaction failed." });
    } finally {
      setTimeout(() => setTxMessage({ type: '', text: '' }), 5000);
      setIsLoading(false);
    }
  };

  const handleApprove = () => {
    if (!stakeInput || isNaN(stakeInput)) return;
    handleTx(async (signer) => {
      const tokenContract = new Contract(CRECY_TOKEN_ADDRESS, ERC20_ABI, signer);
      const tx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, MaxUint256);
      await tx.wait();
    }, t.msgApprove);
  };

  const handleStake = () => {
    const amount = parseFloat(stakeInput);
    if (!amount || amount <= 0) {
      setTxMessage({ type: 'error', text: t.errInvalid });
      return;
    }
    
    handleTx(async (signer) => {
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const amountWei = parseUnits(stakeInput, 18);
      const tx = await stakingContract.stake(amountWei);
      await tx.wait();
      setStakeInput("");
    }, `${amount} cRECY ${t.msgStake}`);
  };

  const handleUnstake = () => {
    const amount = parseFloat(unstakeInput);
    if (!amount || amount <= 0) {
      setTxMessage({ type: 'error', text: t.errInvalid });
      return;
    }

    handleTx(async (signer) => {
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const amountWei = parseUnits(unstakeInput, 18);
      const tx = await stakingContract.unstake(amountWei);
      await tx.wait();
      setUnstakeInput("");
    }, `${amount} cRECY ${t.msgUnstake}`);
  };

  const handleClaim = () => {
    handleTx(async (signer) => {
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.claimRewards();
      await tx.wait();
    }, t.msgClaim);
  };

  const handleRegisterLp = () => {
    if (!lpTokenId || !lpFeeSplit) return;
    if (Number(lpFeeSplit) < 0 || Number(lpFeeSplit) > 10000) {
      setTxMessage({ type: 'error', text: t.errSplitBounds });
      return;
    }
    handleTx(async (signer) => {
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.registerLpPosition(lpTokenId, Number(lpFeeSplit), true);
      await tx.wait();
      setLpTokenId("");
      setLpFeeSplit("");
    }, `${t.msgRegister} #${lpTokenId}`);
  };

  const handleHarvestLp = () => {
    if (!lpTokenId) return;
    handleTx(async (signer) => {
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 mins from now
      const tx = await stakingContract.collectAndRedirectLpFees(lpTokenId, 0, deadline);
      await tx.wait();
    }, `${t.msgHarvest} #${lpTokenId}.`);
  };

  const needsApproval = allowance < parseFloat(stakeInput || "0");
  const capacityProgress = maxCapacity > 0 ? (totalStaked / maxCapacity) * 100 : 0;
  const nextMilestoneDate = lastMilestoneTime > 0 ? lastMilestoneTime + MILESTONE_DURATION : 0;
  
  const formatTime = (ms) => {
    if (ms === 0) return t.na;
    const date = new Date(ms);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'pt' : 'en');
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <div className={isDark ? "dark" : ""}>
      <FontStyles />
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 font-body text-neutral-800 dark:text-neutral-200 transition-colors duration-300">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          
          {/* Top Bar Settings */}
          <div className="flex justify-end items-center space-x-3 mb-2">
            <button onClick={toggleLang} className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-normal">
              <Globe size={14} />
              <span>{lang.toUpperCase()}</span>
            </button>
            <button onClick={toggleTheme} className="p-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
            <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-0 w-full md:w-auto justify-center md:justify-start">
              
              <img 
                src="/14.png" 
                alt="cRECY Logo" 
                className="h-24 md:h-32 object-contain drop-shadow-sm dark:drop-shadow-md transition-all"
              />
              
              <div>
                <h1 className="text-xl md:text-3xl font-normal font-title text-neutral-900 dark:text-white tracking-tight">{t.title}</h1>
                <p className="text-emerald-600 dark:text-emerald-400 font-normal text-xs md:text-sm mt-0.5 md:mt-1">{t.subtitle}</p>
              </div>
            </div>
            
            <button 
              onClick={() => open()}
              className={`flex items-center justify-center space-x-2 w-full md:w-auto px-6 py-3 rounded-xl font-normal transition-all ${
                isConnected 
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20'
              }`}
            >
              <Wallet size={18} />
              <span>{isConnected ? `${address.substring(0,6)}...${address.substring(address.length-4)}` : t.connect}</span>
            </button>
          </div>

          {/* Transaction Notifications */}
          {txMessage.text && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 transition-all ${
              txMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400' :
              txMessage.type === 'error' ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-400' :
              'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-400'
            }`}>
              {txMessage.type === 'success' && <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-500 shrink-0" />}
              {txMessage.type === 'error' && <AlertCircle size={20} className="text-red-600 dark:text-red-500 shrink-0" />}
              {txMessage.type === 'info' && <ArrowRightLeft size={20} className="text-blue-600 dark:text-blue-500 animate-spin shrink-0" />}
              <span className="font-normal font-body text-sm md:text-base">{txMessage.text}</span>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
              <h3 className="text-xs md:text-sm font-normal font-title text-neutral-400 dark:text-neutral-500 tracking-wider uppercase mb-2">{t.totalStaked}</h3>
              <p className="text-2xl md:text-3xl font-normal text-neutral-800 dark:text-white font-title">{totalStaked.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-base md:text-lg text-neutral-400 font-normal font-body">cRECY</span></p>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 md:h-2 mt-4 overflow-hidden">
                <div className="bg-emerald-500 dark:bg-emerald-400 h-1.5 md:h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(capacityProgress, 100)}%` }}></div>
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] md:text-xs font-normal text-emerald-600 dark:text-emerald-400">{capacityProgress.toFixed(1)}% {t.filled}</p>
                <p className="text-[10px] md:text-xs text-neutral-400 font-normal">{t.cap}: {maxCapacity.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
              <h3 className="text-xs md:text-sm font-normal font-title text-neutral-400 dark:text-neutral-500 tracking-wider uppercase mb-2">{t.currentYield}</h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-emerald-500 dark:text-emerald-400 w-5 h-5 md:w-6 md:h-6" />
                <p className="text-2xl md:text-3xl font-normal font-title text-emerald-600 dark:text-emerald-400">22.0%</p>
              </div>
              <p className="text-xs md:text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-3">{t.baseMilestone}</p>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors sm:col-span-2 md:col-span-1">
              <h3 className="text-xs md:text-sm font-normal font-title text-neutral-400 dark:text-neutral-500 tracking-wider uppercase mb-2">{t.treasuryPool}</h3>
              <p className="text-2xl md:text-3xl font-normal font-title text-neutral-800 dark:text-white">{rewardsPool.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-base md:text-lg text-neutral-400 font-normal font-body">cRECY</span></p>
              <p className="text-xs md:text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-3">{t.sustainsTvl}</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* Left Column: User Position */}
            <div className="bg-white dark:bg-neutral-900 p-5 md:p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors">
              <h2 className="text-lg md:text-xl font-normal font-title text-neutral-800 dark:text-white mb-5 md:mb-6 flex items-center"><Wallet className="mr-2 text-neutral-400" size={20} /> {t.yourPosition}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 md:p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] md:text-xs font-normal text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{t.stakedBalance}</p>
                  <p className="text-xl md:text-2xl font-normal font-title text-neutral-800 dark:text-white">{stakedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 md:p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] md:text-xs font-normal text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{t.walletBalance}</p>
                  <p className="text-xl md:text-2xl font-normal font-title text-neutral-800 dark:text-white">{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5 md:pt-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-xs md:text-sm font-normal font-title text-neutral-800 dark:text-white mb-3 md:mb-4">{t.pendingRewards}</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center p-2 md:p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors">
                      <span className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-normal">{t.liquidBase}</span>
                      <span className="font-mono text-base md:text-lg font-normal text-emerald-600 dark:text-emerald-400">{pendingBase.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 md:p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors">
                      <span className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-normal">{t.milestone}</span>
                      <span className="font-mono text-base md:text-lg font-normal text-emerald-600 dark:text-emerald-400">{pendingMilestone.toFixed(6)}</span>
                    </div>
                    
                    {stakedAmount > 0 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-3 md:p-4 rounded-xl mt-4">
                        <span className="text-blue-800 dark:text-blue-300 font-normal mb-2 sm:mb-0 text-center sm:text-left">{t.nextUnlock}</span>
                        <span className="font-mono font-normal text-blue-900 dark:text-blue-100 bg-blue-100/50 dark:bg-blue-800/50 px-2 py-1 md:px-3 md:py-1 rounded-md">
                          {formatTime(nextMilestoneDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={handleClaim}
                  disabled={!isConnected || isLoading || (pendingBase === 0 && pendingMilestone === 0)}
                  className="w-full mt-6 md:mt-8 bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white dark:text-neutral-900 py-3 md:py-4 rounded-xl font-normal font-title transition-all shadow-md active:scale-[0.98] text-sm md:text-base"
                >
                  {t.claimRewards}
                </button>
              </div>
            </div>

            {/* Right Column: Staking Actions */}
            <div className="space-y-6 md:space-y-8">
              <div className="bg-white dark:bg-neutral-900 p-5 md:p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-colors">
                
                {/* Stake Form */}
                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  <div className="flex justify-between items-end mb-1 md:mb-2">
                    <label className="text-base md:text-lg font-normal font-title text-neutral-800 dark:text-white">{t.stakeTokens}</label>
                    <button className="text-xs md:text-sm font-normal text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 md:px-3 md:py-1 rounded-md transition-colors" onClick={() => setStakeInput(rawWalletBalance)}>{t.max}</button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      placeholder="0.00" 
                      disabled={!isConnected || isLoading}
                      className="w-full p-3 md:p-4 pl-4 md:pl-6 text-base md:text-lg font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50 transition-all"
                    />
                    <span className="absolute right-4 md:right-6 top-3.5 md:top-4 font-normal text-neutral-400 dark:text-neutral-500 text-sm md:text-base">cRECY</span>
                  </div>
                  
                  {needsApproval ? (
                    <button 
                      onClick={handleApprove}
                      disabled={!isConnected || isLoading || !stakeInput}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white py-3 md:py-4 rounded-xl font-normal font-title transition-all shadow-md active:scale-[0.98] text-sm md:text-base"
                    >
                      {isLoading ? t.approving : t.approve}
                    </button>
                  ) : (
                    <button 
                      onClick={handleStake}
                      disabled={!isConnected || isLoading || !stakeInput || parseFloat(stakeInput) <= 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white py-3 md:py-4 rounded-xl font-normal font-title transition-all shadow-md active:scale-[0.98] text-sm md:text-base"
                    >
                      {isLoading ? t.processing : t.stake}
                    </button>
                  )}
                </div>

                {/* Unstake Form */}
                <div className="space-y-3 md:space-y-4 pt-6 md:pt-8 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-end mb-1 md:mb-2">
                    <label className="text-base md:text-lg font-normal font-title text-neutral-800 dark:text-white">{t.unstakeTokens}</label>
                    <button className="text-xs md:text-sm font-normal text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-1 md:px-3 md:py-1 rounded-md transition-colors" onClick={() => setUnstakeInput(rawStakedAmount)}>{t.max}</button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={unstakeInput}
                      onChange={(e) => setUnstakeInput(e.target.value)}
                      placeholder="0.00" 
                      disabled={!isConnected || isLoading}
                      className="w-full p-3 md:p-4 pl-4 md:pl-6 text-base md:text-lg font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50 transition-all"
                    />
                    <span className="absolute right-4 md:right-6 top-3.5 md:top-4 font-normal text-neutral-400 dark:text-neutral-500 text-sm md:text-base">cRECY</span>
                  </div>
                  <button 
                    onClick={handleUnstake}
                    disabled={!isConnected || isLoading || !unstakeInput || parseFloat(unstakeInput) <= 0}
                    className="w-full bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 disabled:bg-neutral-50 dark:disabled:bg-neutral-900/50 disabled:text-neutral-300 dark:disabled:text-neutral-700 disabled:border-neutral-100 dark:disabled:border-neutral-800 py-3 md:py-4 rounded-xl font-normal font-title transition-all active:scale-[0.98] text-sm md:text-base"
                  >
                    {t.unstakeClaim}
                  </button>
                  <p className="text-[10px] md:text-xs font-normal text-neutral-500 dark:text-neutral-400 text-center px-2 md:px-4 leading-relaxed">
                    {t.unstakeNote}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Uniswap Section */}
          <div className="bg-neutral-900 dark:bg-neutral-950 text-white p-5 md:p-8 rounded-3xl shadow-xl mt-8 md:mt-12 relative overflow-hidden border border-neutral-800">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 md:w-64 h-48 md:h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-normal font-title mb-2 md:mb-3 flex items-center">
                <ArrowRightLeft className="mr-2 md:mr-3 text-emerald-400" size={24} /> {t.uniswapTitle}
              </h2>
              <p className="text-sm md:text-base text-neutral-400 font-normal mb-6 md:mb-8 max-w-2xl">
                {t.uniswapDesc}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                <div className="space-y-4 md:space-y-5 bg-neutral-800/50 dark:bg-neutral-900/50 p-5 md:p-6 rounded-2xl border border-neutral-700 dark:border-neutral-800">
                  <h3 className="font-normal font-title text-emerald-400 text-sm md:text-base">{t.regPos}</h3>
                  <div>
                    <label className="text-xs md:text-sm font-normal font-title text-neutral-300 block mb-1 md:mb-2">{t.nftId}</label>
                    <input 
                      type="number" 
                      value={lpTokenId}
                      onChange={(e) => setLpTokenId(e.target.value)}
                      placeholder="e.g. 12345" 
                      disabled={!isConnected || isLoading}
                      className="w-full p-2.5 md:p-3 text-sm md:text-base bg-neutral-900 dark:bg-black border border-neutral-700 dark:border-neutral-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all disabled:opacity-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-normal font-title text-neutral-300 block mb-1 md:mb-2">{t.feeSplit}</label>
                    <input 
                      type="number" 
                      value={lpFeeSplit}
                      onChange={(e) => setLpFeeSplit(e.target.value)}
                      placeholder="e.g. 2500 (25%)" 
                      disabled={!isConnected || isLoading}
                      className="w-full p-2.5 md:p-3 text-sm md:text-base bg-neutral-900 dark:bg-black border border-neutral-700 dark:border-neutral-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all disabled:opacity-50 font-mono"
                    />
                    <p className="text-[10px] md:text-xs text-neutral-500 mt-1 md:mt-2">{t.feeNote}</p>
                  </div>
                  <button 
                    onClick={handleRegisterLp}
                    disabled={!isConnected || isLoading || !lpTokenId || !lpFeeSplit}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white py-2.5 md:py-3 rounded-xl font-normal font-title transition-colors mt-2 text-sm md:text-base"
                  >
                    {t.linkLp}
                  </button>
                </div>

                <div className="space-y-4 md:space-y-5 bg-neutral-800/50 dark:bg-neutral-900/50 p-5 md:p-6 rounded-2xl border border-neutral-700 dark:border-neutral-800 flex flex-col justify-center">
                  <h3 className="font-normal font-title text-emerald-400 text-sm md:text-base">{t.harvestFees}</h3>
                  <p className="text-xs md:text-sm text-neutral-400 font-normal leading-relaxed">
                    {t.harvestDesc}
                  </p>
                  
                  <div className="pt-2 md:pt-4">
                    <label className="text-xs md:text-sm font-normal font-title text-neutral-300 block mb-1 md:mb-2">{t.targetNft}</label>
                    <input 
                      type="number" 
                      value={lpTokenId}
                      onChange={(e) => setLpTokenId(e.target.value)}
                      placeholder={t.targetNft}
                      disabled={!isConnected || isLoading} 
                      className="w-full p-2.5 md:p-3 text-sm md:text-base bg-neutral-900 dark:bg-black border border-neutral-700 dark:border-neutral-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all disabled:opacity-50 mb-3 md:mb-4 font-mono"
                    />
                    <button 
                      onClick={handleHarvestLp}
                      disabled={!isConnected || isLoading || !lpTokenId}
                      className="w-full bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 disabled:bg-neutral-800 disabled:border-neutral-800 disabled:text-neutral-500 py-2.5 md:py-3 rounded-xl font-normal font-title transition-colors text-sm md:text-base"
                    >
                      {t.harvestBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}