// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CrowdChain {

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    struct Campaign {
        uint id;
        string title;
        string description;
        uint goal;
        uint amountRaised;
        uint amountUtilized;
        address payable organizer;
        bool active;
    }

    struct Donation {
        address donor;
        uint amount;
    }

    struct FundRequest {
    uint id;
    uint campaignId;
    uint amount;
    string purpose;
    bool approved;
    bool rejected;
    }

mapping(uint => FundRequest[]) public fundRequests;
mapping(uint => Donation[]) public donations;

    uint public campaignCount;

    mapping(uint => Campaign) public campaigns;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function createCampaign(
        string memory _title,
        string memory _description,
        uint _goal,
        address payable _organizer
    ) public onlyAdmin {

        campaignCount++;

        campaigns[campaignCount] = Campaign(
            campaignCount,
            _title,
            _description,
            _goal,
            0,
            0,
            _organizer,
            true
        );
    }

function donate(uint _campaignId) public payable {

    require(
        _campaignId > 0 && _campaignId <= campaignCount,
        "Campaign does not exist"
    );

    require(
        campaigns[_campaignId].active,
        "Campaign is not active"
    );

    require(
        msg.value > 0,
        "Donation must be greater than zero"
    );

    campaigns[_campaignId].amountRaised += msg.value;

    donations[_campaignId].push(
        Donation(msg.sender, msg.value)
    );
}

function getDonationCount(uint _campaignId)
    public
    view
    returns (uint)
{
    return donations[_campaignId].length;
}

function getDonation(
    uint _campaignId,
    uint _index
)
    public
    view
    returns (address, uint)
{
    Donation memory donation =
        donations[_campaignId][_index];

    return (
        donation.donor,
        donation.amount
    );
}

function requestFunds(
    uint _campaignId,
    uint _amount,
    string memory _purpose
) public {

    require(
        _campaignId > 0 && _campaignId <= campaignCount,
        "Campaign does not exist"
    );

    require(
        msg.sender == campaigns[_campaignId].organizer,
        "Only organizer can request funds"
    );

    require(
        _amount > 0,
        "Amount must be greater than zero"
    );

    require(
        _amount <= campaigns[_campaignId].amountRaised,
        "Not enough funds available"
    );

    uint requestId = fundRequests[_campaignId].length;

    fundRequests[_campaignId].push(
        FundRequest(
            requestId,
            _campaignId,
            _amount,
            _purpose,
            false,
            false
        )
    );
}

function getFundRequestCount(uint _campaignId)
    public
    view
    returns (uint)
{
    return fundRequests[_campaignId].length;
}

function getFundRequest(
    uint _campaignId,
    uint _index
)
    public
    view
    returns (
        uint,
        uint,
        string memory,
        bool,
        bool
    )
{
    FundRequest memory request =
        fundRequests[_campaignId][_index];

    return (
        request.id,
        request.amount,
        request.purpose,
        request.approved,
        request.rejected
    );
}

function approveRequest(
    uint _campaignId,
    uint _requestId
) public onlyAdmin {

    require(
        _campaignId > 0 && _campaignId <= campaignCount,
        "Campaign does not exist"
    );

    require(
        _requestId < fundRequests[_campaignId].length,
        "Request does not exist"
    );

    FundRequest storage request =
        fundRequests[_campaignId][_requestId];

    require(!request.approved, "Request already approved");
    require(!request.rejected, "Request already rejected");

    Campaign storage campaign = campaigns[_campaignId];

    uint availableFunds =
        campaign.amountRaised - campaign.amountUtilized;

    require(
        request.amount <= availableFunds,
        "Insufficient available funds"
    );

    request.approved = true;

    campaign.amountUtilized += request.amount;

    (bool sent, ) = campaign.organizer.call{value: request.amount}("");
    require(sent, "Transfer to organizer failed");
}

function rejectRequest(
    uint _campaignId,
    uint _requestId
) public onlyAdmin {

    require(
        _campaignId > 0 && _campaignId <= campaignCount,
        "Campaign does not exist"
    );

    require(
        _requestId < fundRequests[_campaignId].length,
        "Request does not exist"
    );

    FundRequest storage request =
        fundRequests[_campaignId][_requestId];

    require(!request.approved, "Request already approved");
    require(!request.rejected, "Request already rejected");

    request.rejected = true;
}

}