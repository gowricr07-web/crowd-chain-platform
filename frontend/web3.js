// web3.js
// This file is the "bridge" between your frontend and the CrowdChain smart contract.
// It replaces the dummy functions that used to live in data.js.
//
// SETUP — do this before anything works:
// 1. Deploy CrowdChain.sol (e.g. using Remix + MetaMask) to a test network like Sepolia.
// 2. Paste the deployed contract's address below into CONTRACT_ADDRESS.
// That's it — the ABI is already filled in for you from your compiled contract.

const CONTRACT_ADDRESS = "0xc935CDd48A37E41566F493Ba14a5Ffb133Ea28d6";

const CONTRACT_ABI = [{"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_requestId", "type": "uint256"}], "name": "approveRequest", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "string", "name": "_title", "type": "string"}, {"internalType": "string", "name": "_description", "type": "string"}, {"internalType": "uint256", "name": "_goal", "type": "uint256"}, {"internalType": "address payable", "name": "_organizer", "type": "address"}], "name": "createCampaign", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}], "name": "donate", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_requestId", "type": "uint256"}], "name": "rejectRequest", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_amount", "type": "uint256"}, {"internalType": "string", "name": "_purpose", "type": "string"}], "name": "requestFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"inputs": [], "name": "admin", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "campaignCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "campaigns", "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "goal", "type": "uint256"}, {"internalType": "uint256", "name": "amountRaised", "type": "uint256"}, {"internalType": "uint256", "name": "amountUtilized", "type": "uint256"}, {"internalType": "address payable", "name": "organizer", "type": "address"}, {"internalType": "bool", "name": "active", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "donations", "outputs": [{"internalType": "address", "name": "donor", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "fundRequests", "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "uint256", "name": "campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "string", "name": "purpose", "type": "string"}, {"internalType": "bool", "name": "approved", "type": "bool"}, {"internalType": "bool", "name": "rejected", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_index", "type": "uint256"}], "name": "getDonation", "outputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}], "name": "getDonationCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_index", "type": "uint256"}], "name": "getFundRequest", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "string", "name": "", "type": "string"}, {"internalType": "bool", "name": "", "type": "bool"}, {"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}], "name": "getFundRequestCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}];

let provider;
let signer;
let contract;

// Try to (re)build the contract connection.
// requestAccounts=true pops up the MetaMask "connect" prompt (call this from a button click).
// requestAccounts=false only reconnects silently if the site was already authorized before.
async function initContract(requestAccounts) {
  if (typeof window.ethereum === "undefined") {
    if (requestAccounts) alert("Please install MetaMask to use CrowdChain!");
    return null;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  if (requestAccounts) {
    await provider.send("eth_requestAccounts", []);
  }

  const accounts = await provider.send("eth_accounts", []);
  if (accounts.length === 0) return null; // not connected yet, and we didn't ask

  signer = await provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const btn = document.getElementById("connectBtn");
  if (btn) btn.textContent = accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4);

  return contract;
}

// Called by the "Connect Wallet" button in every page
async function connectWallet() {
  await initContract(true);
  // Re-render whatever this page needs once the wallet is connected
  if (typeof onWalletConnected === "function") onWalletConnected();
}

// ---- Read functions (replace the old data.js dummy versions) ----

// Returns all campaigns in the same {id, name, goal, raised} shape index.html expects
async function getCampaigns() {
  if (!contract) return [];
  const count = await contract.campaignCount();
  const list = [];
  for (let i = 1; i <= Number(count); i++) {
    const c = await contract.campaigns(i);
    list.push({
      id: Number(c.id),
      name: c.title,
      goal: Number(ethers.formatEther(c.goal)),
      raised: Number(ethers.formatEther(c.amountRaised)),
      used: Number(ethers.formatEther(c.amountUtilized)),
      organizer: c.organizer,
      active: c.active
    });
  }
  return list;
}

async function getCampaignById(id) {
  if (!contract) return null;
  const c = await contract.campaigns(id);
  if (c.organizer === "0x0000000000000000000000000000000000000000") return null; // doesn't exist
  return {
    id: Number(c.id),
    name: c.title,
    description: c.description,
    goal: Number(ethers.formatEther(c.goal)),
    raised: Number(ethers.formatEther(c.amountRaised)),
    used: Number(ethers.formatEther(c.amountUtilized)),
    organizer: c.organizer,
    active: c.active,
    utilization: [] // fund-request UI can be added later using getFundRequestCount / getFundRequest
  };
}

// ---- Write functions (these cost real gas and pop up MetaMask) ----

async function donateToCampaign(id, amountEth) {
  if (!contract) { alert("Connect your wallet first!"); return null; }
  try {
    const tx = await contract.donate(id, { value: ethers.parseEther(amountEth.toString()) });
    await tx.wait(); // waits for the transaction to be mined
    return await getCampaignById(id);
  } catch (err) {
    console.error(err);
    alert("Donation failed: " + (err.reason || err.message));
    return null;
  }
}

async function createCampaignOnChain(title, description, goalEth, organizerAddress) {
  if (!contract) { alert("Connect your wallet first!"); return false; }
  try {
    const tx = await contract.createCampaign(
      title,
      description,
      ethers.parseEther(goalEth.toString()),
      organizerAddress
    );
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    // This will fire if the connected wallet isn't the admin (deployer) account —
    // createCampaign is restricted to admin only in the contract.
    alert("Failed to create campaign: " + (err.reason || err.message));
    return false;
  }
}
