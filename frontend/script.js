// Handles interactive actions (Wallet, Donate, Create Campaign)

function connectWallet() {
  alert("MetaMask connection UI ready — connecting to contract tomorrow!");
}

function donate() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const input = document.getElementById("donateAmount");
  const amount = parseFloat(input.value);

  if (!amount || amount <= 0) return;

  const campaign = donateToCampaign(id, amount);
  if (!campaign) return;

  alert(`Donated ${amount} ETH (dummy transaction)`);

  document.getElementById("raised").textContent = campaign.raised;
  document.getElementById("available").textContent = (campaign.raised - campaign.used).toFixed(2);
}

function createCampaign(event) {
  event.preventDefault();
  alert("Campaign created (dummy) — this will call the smart contract tomorrow.");
  event.target.reset();
}