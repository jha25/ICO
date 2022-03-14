// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ERC20Interface {
    function transfer(address to, uint256 tokens)
        external
        returns (bool success);

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) external returns (bool success);

    function balanceOf(address tokenOwner)
        external
        view
        returns (uint256 balance);

    function approve(address spender, uint256 tokens)
        external
        returns (bool success);

    function allowance(address tokenOwner, address spender)
        external
        view
        returns (uint256 remaining);

    function totalSupply() external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 tokens);
    event Approval(
        address indexed tokenOwner,
        address indexed spender,
        uint256 tokens
    );
}

contract ERC20Token is ERC20Interface {
    string public name;
    string public symbol;
    uint256 public decimals;
    uint256 public override totalSupply;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowed;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }

    function transfer(address to, uint256 value)
        public
        override
        returns (bool)
    {
        require(balances[msg.sender] >= value);
        balances[msg.sender] -= value;
        balances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        uint256 allowances = allowed[from][msg.sender];
        require(balances[msg.sender] >= value && allowances >= value);
        allowed[from][msg.sender] -= value;
        balances[msg.sender] -= value;
        balances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value)
        public
        override
        returns (bool)
    {
        require(spender != msg.sender);
        allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return allowed[owner][spender];
    }

    function balanceOf(address owner) public view override returns (uint256) {
        return balances[owner];
    }
}

contract ICO {
    struct Sale {
        address investor;
        uint256 quantity;
    }

    Sale[] public sales;
    mapping(address => bool) public investors;
    address public token;
    address public admin;
    uint256 public end;
    uint256 public price;
    uint256 public availableTokens;
    uint256 public minPurchase;
    uint256 public maxPurchase;
    bool public released;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _decimals,
        uint256 _totalSupply
    ) {
        token = address(
            new ERC20Token(_name, _symbol, _decimals, _totalSupply)
        );
        admin = msg.sender;
    }

    modifier onlyInvestors() {
        require(investors[msg.sender] == true, " Only investors");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier icoActive() {
        require(
            end > 0 && block.timestamp < end && availableTokens > 0,
            "ICO must be active"
        );
        _;
    }

    modifier icoNotActive() {
        require(end == 0, "ICO should not be active");
        _;
    }

    modifier icoEnded() {
        require(
            end > 0 && (block.timestamp > end || availableTokens == 0),
            "ICO must have ended"
        );
        _;
    }

    modifier tokensNotReleased() {
        require(released == false, "Tokens must not have been released");
        _;
    }

    modifier tokensReleased() {
        require(released == true, "Tokens must have been released");
        _;
    }

    function start(
        uint256 duration,
        uint256 _price,
        uint256 _availableTokens,
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) external onlyAdmin icoNotActive {
        require(duration > 0, "Duration should be > 0");
        uint256 totalSupply = ERC20Token(token).totalSupply();
        require(
            _availableTokens > 0 && _availableTokens <= totalSupply,
            "Available supply should be greater than 0 and less than total supply"
        );
        require(_minPurchase > 0, "Minimum purchase should be greater than 0");
        require(
            _maxPurchase > 0 && _maxPurchase <= _availableTokens,
            "Maximum purchase should be greater than 0 and less than or equal to available tokens"
        );
        end = duration + block.timestamp;
        price = _price;
        availableTokens = _availableTokens;
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
    }

    function whiteList(address investor) external onlyAdmin {
        investors[investor] = true;
    }

    function buy() external payable onlyInvestors icoActive {
        require(msg.value % price == 0, "Have to send a multiple of price");
        require(
            msg.value >= minPurchase && msg.value <= maxPurchase,
            "Have to send between minimum and maximum purchase"
        );
        uint256 quantity = price * msg.value;
        require(quantity <= availableTokens, "Insufficient tokens for sale");
        sales.push(Sale(msg.sender, quantity));
    }

    function release() external onlyAdmin icoEnded tokensNotReleased {
        ERC20Token tokenInstance = ERC20Token(token);
        for (uint256 i = 0; i < sales.length; i++) {
            Sale storage sale = sales[i];
            tokenInstance.transfer(sale.investor, sale.quantity);
        }
    }

    function withdraw(address payable to, uint256 amount)
        external
        onlyAdmin
        icoEnded
        tokensReleased
    {
        to.transfer(amount);
    }
}
