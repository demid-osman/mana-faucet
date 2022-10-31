// SPDX-License-Identifier: MIT
// This MANA faucet created for Decentraland (https://decentraland.org/) developer community.

pragma solidity ^0.8.0;

import "./IERC20.sol";

contract ManaFaucet {
    address public owner;

    uint public amount = 100 ether;
    uint public cooldown = 24 hours;

    bool public paused = false;

    mapping(address => uint) public timeouts;

    IERC20 public constant MANA = IERC20(0xe7fDae84ACaba2A5Ba817B6E6D8A2d415DBFEdbe);

    event FaucetCreated(address indexed owner, uint indexed timestamp);
    event ManaRequested(address indexed to, uint indexed amount, uint timestamp);
    event AmountUpdated(address indexed owner, uint indexed oldAmount, uint indexed newAmount, uint timestamp);
    event CooldownUpdated(address indexed owner, uint indexed oldCooldown, uint indexed newCooldown, uint timestamp);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner, uint timestamp);
    event FaucetPaused(address indexed owner, bool indexed paused, uint timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner");
        _;
    }

    modifier correctAddress(address _address) {
        require(_address != address(0), "null address");
        _;
    }

    modifier hasMana() {
        require(MANA.balanceOf(address(this)) > 0, "faucet is empty");
        _;
    }

    modifier greaterThanZero(uint _value) {
        require(_value > 0, "value must be greater than zero");
        _;
    }

    modifier notPaused() {
        require(!paused, "faucet paused");
        _;
    }

    modifier notTimeout() {
        require(timeouts[msg.sender] <= block.timestamp - cooldown, "try later");
        _;
    }

    /**
    * Set owner.
    *
    * Emits a {FaucetCreated} event.
    */
    constructor() {
        owner = msg.sender;
        emit FaucetCreated(owner, block.timestamp);
    }

    /**
     * MANA Faucet
     *
     * Amount & cooldown can be changed by owner.
     *
     * Emits a {ManaRequested} event.
     *
     * Requirements:
     * - faucet not pauesed
     * - faucet is not empty
     * - timeout ended
     */
    function requestMana() public notPaused() notTimeout() {
        transferMana(msg.sender, amount);
        timeouts[msg.sender] = block.timestamp;
        emit ManaRequested(msg.sender, amount, block.timestamp);
    }

    /**
     * Updates the value for {timeouts} by address.
     *
     * The default value of {timeouts} is 100. 
     * To select a different value for {timeouts} {owner} should update it.
     *
     * Timeouts can be changed by owner.
     *
     * Requirements:
     * - `_timeout` cannot be less than zero
     * - the caller must be an owner
     */
    function setTimeout(address _address, uint _timeout) public onlyOwner() greaterThanZero(_timeout) {
        timeouts[_address] = _timeout;
    }

    /**
     * Updates the value for {amount}.
     *
     * The default value of {amount} is 100. 
     * To select a different value for {amount} {owner} should update it.
     *
     * Amount can be changed by owner.
     *
     * Requirements:
     * - `_newAmount` cannot be less than zero
     * - the caller must be an owner
     */
    function updateAmount(uint _newAmount) public onlyOwner() greaterThanZero(_newAmount) {
        emit AmountUpdated(msg.sender, amount, _newAmount, block.timestamp);
        amount = _newAmount;
    }

    /**
     * Updates the value for {cooldown}.
     *
     * The default value of {cooldown} is 24 hours. 
     * To select a different value for {cooldown} {owner} should update it.
     *
     * Cooldown can be changed by owner.
     *
     * Requirements:
     * - `_newCooldown` cannot be less than zero
     * - the caller must be an owner
     */
    function updateCooldown(uint _newCooldown) public onlyOwner() greaterThanZero(_newCooldown)  {
        emit CooldownUpdated(msg.sender, cooldown, _newCooldown, block.timestamp);
        cooldown = _newCooldown;
    }

    /**
     * Returns the amount of MANA owned by faucet.
     */
    function manaBalance() public view returns(uint) {
        return manaBalanceOf(address(this));
    }

    /**
     * Returns the amount of MANA owned by `_address`.
     */
    function manaBalanceOf(address _address) public view returns(uint) {
        return MANA.balanceOf(_address);
    }

    /**
     * Transfer `_amount` gETH from faucet to owner.
     *
     * Requirements:
     * - the caller must be an owner
     */
    function withdraw(uint _amount) public onlyOwner() {
        payable(owner).transfer(_amount);
    }

    /**
     * Transfer all gETH from faucet to owner.
     *
     * Requirements:
     * - the caller must be an owner
     */
    function withdrawAll() public onlyOwner() {
        uint balance = address(this).balance;
        payable(owner).transfer(balance);
    }

    /**
     * Transfer `_amount` MANA from faucet to owner.
     *
     * Requirements:
     * - the caller must be an owner
     */
    function withdrawMana(uint _amount) public onlyOwner() {
        transferMana(owner, _amount);
    }

    /**
     * Transfer all MANA from faucet to owner.
     *
     * Requirements:
     * - the caller must be an owner
     */
    function withdrawAllMana() public onlyOwner() {
        uint balance = manaBalance();
        transferMana(owner, balance);
    }

    /**
     * Transfer `_amount` MANA from faucet to `_to`.
     *
     * Emits a {Transfer} ERC20 event.
     *
     * Requirements:
     * - faucet must have MANA
     */
    function transferMana(address _to, uint _amount) private hasMana() {
        MANA.transfer(_to, _amount);
    }

    /**
     * Transfer ownership to `_newOwner`.
     *
     * Emits a {OwnershipTransferred} event.
     *
     * Requirements:
     * - new owner must not be address zero
     * - the caller must be the current owner
     */
    function transferOwnership(address _newOwner) public onlyOwner() correctAddress(_newOwner) {
        emit OwnershipTransferred(owner, _newOwner, block.timestamp);
        owner = _newOwner;
    }

    /**
     * Switches `pause`.
     *
     * Emits a {FaucetPaused} event.
     *
     * Requirements:
     * - the caller must be an owner
     */
    function pause() public onlyOwner() {
        paused = !paused;
        emit FaucetPaused(owner, paused, block.timestamp);
    }

    /**
     * Destroys faucet and transfer gETH & MANA to `owner`.
     *
     * Requirements:
     * - the caller must be an owner
     */
    function destroyFaucet() public onlyOwner() {
        withdrawAllMana();
        selfdestruct(payable(owner));
    }

    /**
    * Accepts funds without specifying the function.
    */
    receive() external payable {} 
}