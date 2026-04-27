const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const root = (label) => ethers.keccak256(ethers.toUtf8Bytes(label));

describe("Proof-of-Intelligence contracts", function () {
  async function deployFixture() {
    const [admin, tokenOwner, other] = await ethers.getSigners();

    const DemoINFT = await ethers.getContractFactory("DemoINFT");
    const demoINFT = await DemoINFT.deploy("CodeGuardian iNFT", "CGI", admin.address);

    const Registry = await ethers.getContractFactory("ProofOfIntelligenceRegistry");
    const registry = await Registry.deploy(admin.address);

    const tokenId = 1n;
    const metadataURI = "ipfs://codeguardian/metadata.json";
    const manifestRoot = root("manifest:v1");
    const intelligenceRoot = root("intelligence:v1");
    const memoryRoot = root("memory:v1");
    const runRoot = root("run:v1");

    await expect(demoINFT.mintDemo(tokenOwner.address, metadataURI, manifestRoot))
      .to.emit(demoINFT, "DemoMinted")
      .withArgs(tokenOwner.address, tokenId, manifestRoot, metadataURI);

    return {
      admin,
      tokenOwner,
      other,
      demoINFT,
      registry,
      tokenId,
      metadataURI,
      manifestRoot,
      intelligenceRoot,
      memoryRoot,
      runRoot
    };
  }

  async function registeredFixture() {
    const fixture = await loadFixture(deployFixture);

    await fixture.registry.connect(fixture.tokenOwner).registerPassport(
      await fixture.demoINFT.getAddress(),
      fixture.tokenId,
      16602,
      fixture.manifestRoot,
      fixture.intelligenceRoot,
      fixture.memoryRoot,
      fixture.runRoot,
      fixture.metadataURI
    );

    return fixture;
  }

  it("mints a demo iNFT with owner, metadata URI, and manifest root", async function () {
    const { demoINFT, tokenOwner, tokenId, metadataURI, manifestRoot } = await loadFixture(deployFixture);

    expect(await demoINFT.ownerOf(tokenId)).to.equal(tokenOwner.address);
    expect(await demoINFT.tokenURI(tokenId)).to.equal(metadataURI);
    expect(await demoINFT.manifestRootOf(tokenId)).to.equal(manifestRoot);
    expect(await demoINFT.authorizedUsageOf(tokenId)).to.contain("allowlisted CodeGuardian");
  });

  it("sets and reads ERC-7857-style intelligence roots", async function () {
    const { demoINFT, tokenOwner, tokenId, intelligenceRoot, memoryRoot, runRoot } = await loadFixture(deployFixture);
    const skillHash = root("critic-loop:v0.1.1");

    await expect(demoINFT.connect(tokenOwner).setIntelligenceRoot(tokenId, intelligenceRoot))
      .to.emit(demoINFT, "IntelligenceRootSet")
      .withArgs(tokenId, intelligenceRoot);

    await expect(demoINFT.connect(tokenOwner).updateMemoryRoot(tokenId, memoryRoot))
      .to.emit(demoINFT, "MemoryRootUpdated")
      .withArgs(tokenId, ethers.ZeroHash, memoryRoot);

    await expect(demoINFT.connect(tokenOwner).updateLatestRunRoot(tokenId, runRoot))
      .to.emit(demoINFT, "LatestRunRootUpdated")
      .withArgs(tokenId, ethers.ZeroHash, runRoot);

    await expect(demoINFT.connect(tokenOwner).updateSkillHash(tokenId, "critic-loop", "0.1.1", skillHash))
      .to.emit(demoINFT, "AgentSkillUpgraded")
      .withArgs(tokenId, "critic-loop", "0.1.1", skillHash);

    await expect(demoINFT.connect(tokenOwner).certifyRun(tokenId, runRoot, 7))
      .to.emit(demoINFT, "AgentRunCertified")
      .withArgs(tokenId, runRoot, 7);

    expect(await demoINFT.intelligenceRootOf(tokenId)).to.equal(intelligenceRoot);
    expect(await demoINFT.memoryRootOf(tokenId)).to.equal(memoryRoot);
    expect(await demoINFT.latestRunRootOf(tokenId)).to.equal(runRoot);
    expect(await demoINFT.skillHashOf(tokenId, "critic-loop", "0.1.1")).to.equal(skillHash);
  });

  it("rejects unauthorized iNFT root and skill updates", async function () {
    const { demoINFT, other, tokenId, memoryRoot } = await loadFixture(deployFixture);

    await expect(demoINFT.connect(other).setIntelligenceRoot(tokenId, memoryRoot)).to.be.revertedWithCustomError(
      demoINFT,
      "OwnableUnauthorizedAccount"
    );
    await expect(demoINFT.connect(other).updateMemoryRoot(tokenId, memoryRoot)).to.be.revertedWithCustomError(
      demoINFT,
      "OwnableUnauthorizedAccount"
    );
    await expect(demoINFT.connect(other).updateLatestRunRoot(tokenId, memoryRoot)).to.be.revertedWithCustomError(
      demoINFT,
      "OwnableUnauthorizedAccount"
    );
    await expect(demoINFT.connect(other).updateSkillHash(tokenId, "critic-loop", "0.1.1", memoryRoot)).to.be.revertedWithCustomError(
      demoINFT,
      "OwnableUnauthorizedAccount"
    );
  });

  it("registers a Proof-of-Intelligence passport", async function () {
    const { registry, demoINFT, tokenOwner, tokenId, metadataURI, manifestRoot, intelligenceRoot, memoryRoot, runRoot } =
      await registeredFixture();

    const passport = await registry.getPassport(await demoINFT.getAddress(), tokenId);

    expect(passport.inftContract).to.equal(await demoINFT.getAddress());
    expect(passport.tokenId).to.equal(tokenId);
    expect(passport.chainId).to.equal(16602n);
    expect(passport.tokenOwner).to.equal(tokenOwner.address);
    expect(passport.manifestRoot).to.equal(manifestRoot);
    expect(passport.intelligenceBundleRoot).to.equal(intelligenceRoot);
    expect(passport.memoryRoot).to.equal(memoryRoot);
    expect(passport.latestRunRoot).to.equal(runRoot);
    expect(passport.metadataURI).to.equal(metadataURI);
    expect(passport.registered).to.equal(true);
  });

  it("updates passport roots by token owner", async function () {
    const { registry, demoINFT, tokenOwner, tokenId } = await registeredFixture();
    const nextManifestRoot = root("manifest:v2");
    const nextIntelligenceRoot = root("intelligence:v2");
    const nextMemoryRoot = root("memory:v2");
    const nextRunRoot = root("run:v2");

    await expect(
      registry
        .connect(tokenOwner)
        .updateRoots(await demoINFT.getAddress(), tokenId, nextManifestRoot, nextIntelligenceRoot, nextMemoryRoot, nextRunRoot)
    )
      .to.emit(registry, "RootsUpdated")
      .withArgs(
        await registry.passportId(await demoINFT.getAddress(), tokenId),
        nextManifestRoot,
        nextIntelligenceRoot,
        nextMemoryRoot,
        nextRunRoot
      );

    const passport = await registry.getPassport(await demoINFT.getAddress(), tokenId);
    expect(passport.manifestRoot).to.equal(nextManifestRoot);
    expect(passport.intelligenceBundleRoot).to.equal(nextIntelligenceRoot);
    expect(passport.memoryRoot).to.equal(nextMemoryRoot);
    expect(passport.latestRunRoot).to.equal(nextRunRoot);
  });

  it("issues and reads a certificate", async function () {
    const { registry, demoINFT, tokenOwner, tokenId } = await registeredFixture();
    const proofRoot = root("certificate:v1");
    const proofURI = "ipfs://codeguardian/proof.json";

    await expect(registry.connect(tokenOwner).issueCertificate(await demoINFT.getAddress(), tokenId, proofRoot, proofURI))
      .to.emit(registry, "CertificateIssued")
      .withArgs(
        1n,
        await registry.passportId(await demoINFT.getAddress(), tokenId),
        tokenOwner.address,
        proofRoot,
        proofURI
      );

    const certificate = await registry.getCertificate(1);
    expect(certificate.certificateId).to.equal(1n);
    expect(certificate.inftContract).to.equal(await demoINFT.getAddress());
    expect(certificate.tokenId).to.equal(tokenId);
    expect(certificate.issuedTo).to.equal(tokenOwner.address);
    expect(certificate.issuer).to.equal(tokenOwner.address);
    expect(certificate.proofRoot).to.equal(proofRoot);
    expect(certificate.proofURI).to.equal(proofURI);
  });

  it("rejects unauthorized root updates", async function () {
    const { registry, demoINFT, other, tokenId } = await registeredFixture();

    await expect(
      registry
        .connect(other)
        .updateRoots(await demoINFT.getAddress(), tokenId, root("bad:manifest"), root("bad:intelligence"), root("bad:memory"), root("bad:run"))
    ).to.be.revertedWithCustomError(registry, "NotAuthorized");
  });

  it("allows admin to update roots and issue a certificate", async function () {
    const { registry, demoINFT, admin, tokenOwner, tokenId } = await registeredFixture();
    const nextMemoryRoot = root("admin:memory");
    const proofRoot = root("admin:certificate");

    await registry
      .connect(admin)
      .updateRoots(await demoINFT.getAddress(), tokenId, root("admin:manifest"), root("admin:intelligence"), nextMemoryRoot, root("admin:run"));
    await registry.connect(admin).issueCertificate(await demoINFT.getAddress(), tokenId, proofRoot, "ipfs://admin/proof.json");

    const passport = await registry.getPassport(await demoINFT.getAddress(), tokenId);
    const certificate = await registry.getCertificate(1);

    expect(passport.memoryRoot).to.equal(nextMemoryRoot);
    expect(certificate.issuedTo).to.equal(tokenOwner.address);
    expect(certificate.issuer).to.equal(admin.address);
  });
});
