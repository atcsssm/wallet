// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBEP20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract PaymentDistributor {
    address public owner;
    IBEP20 public usdtToken;
    
    // Payment distribution configuration
    struct Recipient {
        address wallet;
        uint256 amount;
        string label;
    }
    
    Recipient[3] public recipients;
    uint256 public constant TOTAL_AMOUNT = 6 * 10**18; // 6 USDT (18 decimals)
    
    // Events
    event PaymentDistributed(
        address indexed payer,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event RecipientPaid(
        address indexed recipient,
        uint256 amount,
        string label
    );
    
    constructor(address _usdtToken) {
        owner = msg.sender;
        usdtToken = IBEP20(_usdtToken);
        
        // Initialize recipients with fixed distribution
        recipients[0] = Recipient({
            wallet: 0x742d35Cc6634C0532925a3b8D4C23E7F7A7D4A4b,
            amount: 1 * 10**18, // 1 USDT
            label: "Recipient 1"
        });
        
        recipients[1] = Recipient({
            wallet: 0x8ba1f109551bD432803012645Hac136c22C177ec,
            amount: 2 * 10**18, // 2 USDT
            label: "Recipient 2"
        });
        
        recipients[2] = Recipient({
            wallet: 0x1aE0EA4a72D944a8C7603FfB3eC30a6669E454C8,
            amount: 3 * 10**18, // 3 USDT
            label: "Recipient 3"
        });
    }
    
    /**
     * @dev Distributes USDT payment to all recipients in a single transaction
     * User must approve this contract to spend 6 USDT before calling this function
     */
    function distributePayment() external {
        address payer = msg.sender;
        
        // Check if user has enough USDT balance
        require(
            usdtToken.balanceOf(payer) >= TOTAL_AMOUNT,
            "Insufficient USDT balance"
        );
        
        // Check if user has approved enough USDT for this contract
        require(
            usdtToken.allowance(payer, address(this)) >= TOTAL_AMOUNT,
            "Insufficient USDT allowance. Please approve 6 USDT first."
        );
        
        // Transfer USDT from user to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                usdtToken.transferFrom(payer, recipients[i].wallet, recipients[i].amount),
                string(abi.encodePacked("Failed to transfer to ", recipients[i].label))
            );
            
            emit RecipientPaid(recipients[i].wallet, recipients[i].amount, recipients[i].label);
        }
        
        emit PaymentDistributed(payer, TOTAL_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Get all recipient details
     */
    function getRecipients() external view returns (Recipient[3] memory) {
        return recipients;
    }
    
    /**
     * @dev Get total payment amount
     */
    function getTotalAmount() external pure returns (uint256) {
        return TOTAL_AMOUNT;
    }
    
    /**
     * @dev Check if user has sufficient balance and allowance
     */
    function canUserPay(address user) external view returns (bool hasBalance, bool hasAllowance) {
        hasBalance = usdtToken.balanceOf(user) >= TOTAL_AMOUNT;
        hasAllowance = usdtToken.allowance(user, address(this)) >= TOTAL_AMOUNT;
    }
    
    /**
     * @dev Emergency function to update recipient (only owner)
     */
    function updateRecipient(uint256 index, address newWallet) external {
        require(msg.sender == owner, "Only owner can update recipients");
        require(index < recipients.length, "Invalid recipient index");
        recipients[index].wallet = newWallet;
    }
}