import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { encodeAbiParameters, keccak256, toBytes } from "viem";

// Use ethers helpers from Hardhat runtime via any-cast when needed

describe("AgentProtocol", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // Deployment fixture
  async function deployContractsFixture() {
    // Deploy MockUSDC
    const mockUsdc = await viem.deployContract("MockUSDC");

    // Deploy AgentProtocol with MockUSDC address
    const agentProtocol = await viem.deployContract("AgentProtocol", [mockUsdc.address]);

    // Get wallet clients for different signers (use provider's unlocked accounts)
    const [ownerClient, agentOwnerClient, payerClient, workerClient, otherAccountClient] =
      await viem.getWalletClients();

    const usdcAmount = BigInt(1000 * 10 ** 6); // 1000 USDC

    // Mint USDC for payer
    await mockUsdc.write.mint([payerClient.account.address, usdcAmount]);

    return {
      agentProtocol,
      mockUsdc,
      ownerClient,
      agentOwnerClient,
      payerClient,
      workerClient,
      otherAccountClient,
      usdcAmount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right USDC token address", async function () {
      const fixture = await deployContractsFixture();
      const usdcToken = await fixture.agentProtocol.read.usdcToken();
      assert.equal(usdcToken.toLowerCase(), fixture.mockUsdc.address.toLowerCase());
    });

    it("Should set the right owner", async function () {
      const fixture = await deployContractsFixture();
      const contractOwner = await fixture.agentProtocol.read.owner();
      assert.equal(contractOwner.toLowerCase(), fixture.ownerClient.account.address.toLowerCase());
    });
  });

  describe("Identity & Discovery", function () {
    it("Should allow an agent to be registered", async function () {
      const fixture = await deployContractsFixture();
      const metadataURI = "ipfs://some-hash";

      const hash = await fixture.agentProtocol.write.registerAgent(
        [fixture.agentOwnerClient.account.address, metadataURI],
        { account: fixture.ownerClient.account.address },
      );

      await publicClient.waitForTransactionReceipt({ hash });

      const tokenOwner = await fixture.agentProtocol.read.ownerOf([BigInt(0)]);
      assert.equal(tokenOwner.toLowerCase(), fixture.agentOwnerClient.account.address.toLowerCase());

      const tokenURI = await fixture.agentProtocol.read.tokenURI([BigInt(0)]);
      assert.equal(tokenURI, metadataURI);
    });

    it("Should allow the agent owner to set a worker address", async function () {
      const fixture = await deployContractsFixture();
      await fixture.agentProtocol.write.registerAgent(
        [fixture.agentOwnerClient.account.address, "uri"],
        { account: fixture.ownerClient.account.address },
      );

      const hash = await fixture.agentProtocol.write.setWorkerAddress(
        [BigInt(0), fixture.workerClient.account.address],
        { account: fixture.agentOwnerClient.account.address },
      );

      await publicClient.waitForTransactionReceipt({ hash });

      const workerAddress = await fixture.agentProtocol.read.agentWorkers([BigInt(0)]);
      assert.equal(workerAddress.toLowerCase(), fixture.workerClient.account.address.toLowerCase());
    });

    it("Should prevent non-owners from setting a worker address", async function () {
      const fixture = await deployContractsFixture();
      await fixture.agentProtocol.write.registerAgent(
        [fixture.agentOwnerClient.account.address, "uri"],
        { account: fixture.ownerClient.account.address },
      );

      try {
        await fixture.agentProtocol.write.setWorkerAddress(
          [BigInt(0), fixture.workerClient.account.address],
          { account: fixture.otherAccountClient.account.address },
        );
        assert.fail("Should have reverted");
      } catch (error: any) {
        assert(error.message.includes("Caller is not the agent owner"));
      }
    });

    it("Should allow the agent owner to add services", async function () {
      const fixture = await deployContractsFixture();
      await fixture.agentProtocol.write.registerAgent(
        [fixture.agentOwnerClient.account.address, "uri"],
        { account: fixture.ownerClient.account.address },
      );

      const serviceName = "Data Analysis";
      const servicePrice = BigInt(100 * 10 ** 6); // 100 USDC

      const hash = await fixture.agentProtocol.write.addService(
        [BigInt(0), serviceName, servicePrice],
        { account: fixture.agentOwnerClient.account.address },
      );

      await publicClient.waitForTransactionReceipt({ hash });

      const services = await fixture.agentProtocol.read.getServices([BigInt(0)]);
      assert.equal(services.length, 1);
      assert.equal(services[0].name, serviceName);
      assert.equal(services[0].price, servicePrice);
      assert.equal(services[0].active, true);
    });
  });

  describe("Atomic Settlement Engine", function () {
    async function registeredAgentFixture() {
      const base = await deployContractsFixture();
      const agentId = BigInt(0);
      await base.agentProtocol.write.registerAgent(
        [base.agentOwnerClient.account.address, "ipfs://agent0"],
        { account: base.ownerClient.account.address },
      );
      await base.agentProtocol.write.setWorkerAddress(
        [agentId, base.workerClient.account.address],
        { account: base.agentOwnerClient.account.address },
      );
      return { ...base, agentId };
    }

    async function createTransferAuthSignature(
      mockUsdc: any,
      payerClient: any,
      toAddress: string,
      value: bigint,
      nonce: `0x${string}`,
    ) {
      const blockNumber = await publicClient.getBlockNumber();
      const block = await publicClient.getBlock({ blockNumber });
      const validAfter = BigInt(block.timestamp);
      const validBefore = validAfter + BigInt(60 * 60); // 1 hour

      const domain = {
        name: "Mock USDC",
        version: "1" as const,
        chainId: await publicClient.getChainId(),
        verifyingContract: mockUsdc.address,
      };

      const types = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      };

      const message = {
        from: payerClient.account.address,
        to: toAddress,
        value: value,
        validAfter: validAfter,
        validBefore: validBefore,
        nonce: nonce,
      };

        // Use viem wallet client to sign the typed data (EIP-712)
        const signature = await payerClient.signTypedData({
          domain,
          types,
          primaryType: "TransferWithAuthorization",
          message,
        }) as `0x${string}`;

        const sig = signature as string;
        const r: `0x${string}` = (sig.slice(0, 66)) as `0x${string}`;
        const s: `0x${string}` = ("0x" + sig.slice(66, 130)) as `0x${string}`;
        const v = parseInt(sig.slice(130, 132), 16);

        return { message, v, r, s };
    }

    async function createReputationSignature(
      workerClient: any,
      agentId: bigint,
      score: number,
      paymentNonce: `0x${string}`,
    ) {
      // Build the same 32-byte hash used in the contract: keccak256(abi.encodePacked(agentId, score, paymentNonce))
      const packed = "0x" +
        agentId.toString(16).padStart(64, "0") +
        score.toString(16).padStart(2, "0") +
        paymentNonce.slice(2);
      const messageHash = keccak256(toBytes(packed));

      // Use viem wallet client to sign the message (eth_sign semantics)
      // The message needs to be prefixed with "\x19Ethereum Signed Message:\n32"
      // which signMessage does automatically if you pass a string, but not for raw bytes.
      // We can pass the raw hash to `signMessage` and it will be handled correctly.
      const sig = await workerClient.signMessage({ message: { raw: messageHash } }) as `0x${string}`;

      return sig;
    }

    it("Should successfully settle payment and log feedback", async function () {
      const fixture = await registeredAgentFixture();

      const amount = BigInt(100 * 10 ** 6); // 100 USDC
      const score = 5;
      const paymentNonce = `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}` as `0x${string}`;

      const payData = await createTransferAuthSignature(
        fixture.mockUsdc,
        fixture.payerClient,
        fixture.workerClient.account.address, // This was the bug: The signature must authorize the transfer to the final recipient (the worker)
        amount,
        paymentNonce,
      );

      const repSignature = await createReputationSignature(
        fixture.workerClient,
        fixture.agentId,
        score,
        payData.message.nonce,
      );

      const hash = await fixture.agentProtocol.write.settleAndLog(
        [
          {
            payer: payData.message.from,
            amount: payData.message.value,
            paymentNonce: payData.message.nonce,
            validAfter: payData.message.validAfter,
            validBefore: payData.message.validBefore,
            v: payData.v,
            r: payData.r,
            s: payData.s,
          },
          fixture.agentId,
          score,
          repSignature,
          keccak256(toBytes("test-tag")),
          "ipfs://test-file",
        ],
        { account: fixture.ownerClient.account.address },
      );

      await publicClient.waitForTransactionReceipt({ hash });

      const workerBalance = await fixture.mockUsdc.read.balanceOf([fixture.workerClient.account.address]);
      assert.equal(workerBalance, amount);

      const payerBalance = await fixture.mockUsdc.read.balanceOf([fixture.payerClient.account.address]);
      assert.equal(payerBalance, fixture.usdcAmount - amount);

      const txCount = await fixture.agentProtocol.read.agentTxCount([fixture.agentId]);
      assert.equal(txCount, BigInt(1));
    });

    it("Should revert if worker address is not set", async function () {
      const fixture = await deployContractsFixture();
      const agentId = BigInt(0);
      await fixture.agentProtocol.write.registerAgent(
        [fixture.agentOwnerClient.account.address, "uri"],
        { account: fixture.ownerClient.account.address },
      );

      const paymentNonce = `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}` as `0x${string}`;

      try {
        await fixture.agentProtocol.write.settleAndLog(
          [
            {
              payer: fixture.payerClient.account.address,
              amount: BigInt(1),
              paymentNonce,
              validAfter: BigInt(0),
              validBefore: BigInt(0),
              v: 0,
              r: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
              s: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
            },
            agentId,
            5,
            "0x" as `0x${string}`,
            keccak256(toBytes("test")),
            "ipfs://test",
          ],
          { account: fixture.ownerClient.account.address },
        );
        assert.fail("Should have reverted");
      } catch (error: any) {
        assert(error.message.includes("Agent worker not set"));
      }
    });

    it("Should revert for an invalid score", async function () {
      const fixture = await registeredAgentFixture();

      const paymentNonce = `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}` as `0x${string}`;

      try {
        await fixture.agentProtocol.write.settleAndLog(
          [
            {
              payer: fixture.payerClient.account.address,
              amount: BigInt(0),
              paymentNonce,
              validAfter: BigInt(0),
              validBefore: BigInt(0),
              v: 0,
              r: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
              s: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
            },
            fixture.agentId,
            101, // Invalid score > 100
            "0x" as `0x${string}`,
            keccak256(toBytes("test")),
            "ipfs://test",
          ],
          { account: fixture.ownerClient.account.address },
        );
        assert.fail("Should have reverted");
      } catch (error: any) {
        assert(error.message.includes("Invalid score"));
      }
    });
  });
});