// Single source of truth for campaign data.
// Tomorrow, these functions will be replaced with real contract calls.

const campaigns = [
  {
    id: 0,
    name: "Flood Relief",
    goal: 10,
    raised: 6.2,
    used: 2,
    utilization: [
      { title: "Food Supplies", amount: 2, status: "Approved" }
    ]
  },
  {
    id: 1,
    name: "Medical Support",
    goal: 5,
    raised: 3.1,
    used: 0.5,
    utilization: [
      { title: "First Aid Kits", amount: 0.5, status: "Pending" }
    ]
  }
];

function getCampaigns() {
  return campaigns;
}

function getCampaignById(id) {
  return campaigns.find(c => c.id === Number(id));
}

function donateToCampaign(id, amount) {
  const campaign = getCampaignById(id);
  if (campaign) {
    campaign.raised = Math.round((campaign.raised + amount) * 100) / 100;
  }
  return campaign;
}