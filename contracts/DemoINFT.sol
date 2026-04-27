// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC7857Like {
    function intelligenceRootOf(uint256 tokenId) external view returns (bytes32);
    function memoryRootOf(uint256 tokenId) external view returns (bytes32);
    function manifestRootOf(uint256 tokenId) external view returns (bytes32);
    function latestRunRootOf(uint256 tokenId) external view returns (bytes32);
    function authorizedUsageOf(uint256 tokenId) external view returns (string memory);
    function updateMemoryRoot(uint256 tokenId, bytes32 newMemoryRoot) external;
    function updateLatestRunRoot(uint256 tokenId, bytes32 newRunRoot) external;
    function updateSkillHash(uint256 tokenId, string calldata skill, string calldata version, bytes32 codeHash) external;
}

contract DemoINFT is ERC721, Ownable, IERC7857Like {
    uint256 private _nextTokenId = 1;

    mapping(uint256 tokenId => bytes32 root) private _manifestRoots;
    mapping(uint256 tokenId => bytes32 root) private _intelligenceRoots;
    mapping(uint256 tokenId => bytes32 root) private _memoryRoots;
    mapping(uint256 tokenId => bytes32 root) private _latestRunRoots;
    mapping(uint256 tokenId => string uri) private _tokenURIs;
    mapping(uint256 tokenId => string usage) private _authorizedUsage;
    mapping(uint256 tokenId => mapping(bytes32 skillKey => bytes32 codeHash)) private _skillHashes;

    event DemoMinted(address indexed to, uint256 indexed tokenId, bytes32 manifestRoot, string metadataURI);
    event ManifestRootUpdated(uint256 indexed tokenId, bytes32 manifestRoot);
    event IntelligenceRootSet(uint256 indexed tokenId, bytes32 root);
    event MemoryRootUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot);
    event LatestRunRootUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot);
    event AgentRunCertified(uint256 indexed tokenId, bytes32 runRoot, uint256 certificateId);
    event AgentSkillUpgraded(uint256 indexed tokenId, string skill, string version, bytes32 codeHash);
    event AuthorizedUsageUpdated(uint256 indexed tokenId, string usage);

    constructor(string memory name_, string memory symbol_, address initialAdmin) ERC721(name_, symbol_) Ownable(initialAdmin) {}

    function mintDemo(address to, string calldata metadataURI, bytes32 manifestRoot) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        _manifestRoots[tokenId] = manifestRoot;
        _authorizedUsage[tokenId] = "Owner may run allowlisted CodeGuardian reviews; public users may verify and replay certified runs.";

        emit DemoMinted(to, tokenId, manifestRoot, metadataURI);
    }

    function setManifestRoot(uint256 tokenId, bytes32 manifestRoot) external {
        _requireTokenOwnerOrAdmin(tokenId);
        _manifestRoots[tokenId] = manifestRoot;
        emit ManifestRootUpdated(tokenId, manifestRoot);
    }

    function setIntelligenceRoot(uint256 tokenId, bytes32 root) external {
        _requireTokenOwnerOrAdmin(tokenId);
        _intelligenceRoots[tokenId] = root;
        emit IntelligenceRootSet(tokenId, root);
    }

    function updateMemoryRoot(uint256 tokenId, bytes32 newMemoryRoot) external {
        _requireTokenOwnerOrAdmin(tokenId);
        bytes32 oldRoot = _memoryRoots[tokenId];
        _memoryRoots[tokenId] = newMemoryRoot;
        emit MemoryRootUpdated(tokenId, oldRoot, newMemoryRoot);
    }

    function updateLatestRunRoot(uint256 tokenId, bytes32 newRunRoot) external {
        _requireTokenOwnerOrAdmin(tokenId);
        bytes32 oldRoot = _latestRunRoots[tokenId];
        _latestRunRoots[tokenId] = newRunRoot;
        emit LatestRunRootUpdated(tokenId, oldRoot, newRunRoot);
    }

    function updateSkillHash(uint256 tokenId, string calldata skill, string calldata version, bytes32 codeHash) external {
        _requireTokenOwnerOrAdmin(tokenId);
        _skillHashes[tokenId][_skillKey(skill, version)] = codeHash;
        emit AgentSkillUpgraded(tokenId, skill, version, codeHash);
    }

    function certifyRun(uint256 tokenId, bytes32 runRoot, uint256 certificateId) external {
        _requireTokenOwnerOrAdmin(tokenId);
        _latestRunRoots[tokenId] = runRoot;
        emit AgentRunCertified(tokenId, runRoot, certificateId);
    }

    function setAuthorizedUsage(uint256 tokenId, string calldata usage) external {
        _requireTokenOwnerOrAdmin(tokenId);
        _authorizedUsage[tokenId] = usage;
        emit AuthorizedUsageUpdated(tokenId, usage);
    }

    function intelligenceRootOf(uint256 tokenId) external view returns (bytes32) {
        ownerOf(tokenId);
        return _intelligenceRoots[tokenId];
    }

    function memoryRootOf(uint256 tokenId) external view returns (bytes32) {
        ownerOf(tokenId);
        return _memoryRoots[tokenId];
    }

    function manifestRootOf(uint256 tokenId) external view returns (bytes32) {
        ownerOf(tokenId);
        return _manifestRoots[tokenId];
    }

    function latestRunRootOf(uint256 tokenId) external view returns (bytes32) {
        ownerOf(tokenId);
        return _latestRunRoots[tokenId];
    }

    function authorizedUsageOf(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        return _authorizedUsage[tokenId];
    }

    function skillHashOf(uint256 tokenId, string calldata skill, string calldata version) external view returns (bytes32) {
        ownerOf(tokenId);
        return _skillHashes[tokenId][_skillKey(skill, version)];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId);
        return _tokenURIs[tokenId];
    }

    function _requireTokenOwnerOrAdmin(uint256 tokenId) private view {
        address tokenOwner = ownerOf(tokenId);
        if (msg.sender != tokenOwner && msg.sender != owner()) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
    }

    function _skillKey(string calldata skill, string calldata version) private pure returns (bytes32) {
        return keccak256(abi.encode(skill, version));
    }
}
