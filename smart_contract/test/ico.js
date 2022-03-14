/** @format */

const { expectRevert, time } = require("@openzeppelin/test-helpers")
const { web3 } = require("@openzeppelin/test-helpers/src/setup")
const ICO = artifacts.require("ICO")
const Token = artifacts.require("ERC20Token")

contract("ICO", (accounts) => {
	let ico
	let token
	const name = "My Token"
	const symbol = "TKN"
	const decimals = 18
	const initialSupply = web3.utils.toBN(web3.utils.toWei("1000"))

	beforeEach(async () => {
		ico = await ICO.new(name, symbol, decimals, initialSupply)
		const tokenAddress = await ico.token()
		token = await Token.at(tokenAddress)
	})

	it("Should create an ERC20 token", async () => {
		const _name = await token.name()
		const _symbol = await token.symbol()
		const _decimals = await token.decimals()
		const totalSupply = await token.totalSupply()
		assert(_name == name)
		assert(_symbol == symbol)
		assert(_decimals == decimals)
		assert(totalSupply.eq(initialSupply))
	})

	it("Should start the ICO", async () => {
		const duration = 100
		const price = 1
		const availableTokens = web3.utils.toWei("100")
		const minPurchase = web3.utils.toWei("10")
		const maxPurchase = web3.utils.toWei("20")
		const start = parseInt(new Date().getTime() / 1000)
		time.increaseTo(start)
		await ico.start(duration, price, availableTokens, minPurchase, maxPurchase)

		const expectedEnd = start + duration
		const end = await ico.end()
		const actualPrice = await ico.price()
		const actualAvailableTokens = await ico.availableTokens()
		const actualMinPurchase = await ico.minPurchase()
		const actualMaxPurchase = await ico.maxPurchase()
		assert(end.eq(web3.utils.toBN(expectedEnd)))
		assert(actualAvailableTokens.eq(web3.utils.toBN(availableTokens)))
		assert(actualMinPurchase.eq(web3.utils.toBN(minPurchase)))
		assert(actualMaxPurchase.eq(web3.utils.toBN(maxPurchase)))
	})

	it("Should not start the ICO", async () => {
		const duration = 100
		const price = 1
		let availableTokens = web3.utils.toWei("10000")
		const minPurchase = web3.utils.toWei("10")
		let maxPurchase = web3.utils.toWei("20")
		await expectRevert(
			ico.start(duration, price, availableTokens, minPurchase, maxPurchase),
			"Available supply should be > 0 and less than total supply",
		)
		availableTokens = web3.utils.toWei("100")
		maxPurchase = web3.utils.toWei("200")
		await expectRevert(
			ico.start(duration, price, availableTokens, minPurchase, maxPurchase),
			"Max purchase should be > 0 and <= available tokens",
		)
	})

	context("Sale started", async () => {
		let start
		const duration = 100
		const price = 2
		const availableTokens = web3.utils.toWei("30")
		const minPurchase = web3.utils.toWei("1")
		const maxPurchase = web3.utils.toWei("10")
		beforeEach(async () => {
			start = parseInt(new Date().getTime() / 1000)
			time.increaseTo(start)
			await ico.start(
				duration,
				price,
				availableTokens,
				minPurchase,
				maxPurchase,
			)
		})

		it("Should not let non-investors buy", async () => {
			await expectRevert(
				ico.buy({ from: accounts[2], value: web3.utils.toWei("1") }),
				"Only investors",
			)
		})

		it("Should not buy if not exact amount", async () => {
			await ico.whiteList(accounts[2])
			const value = web3.utils
				.toBN(web3.utils.toWei("1"))
				.add(web3.utils.toBN(1))
			await expectRevert(
				ico.buy({ from: accounts[2], value }),
				"Have to send a multiple of price",
			)
		})

		it("Should not buy if not between min and max purchase", async () => {
			await ico.whiteList(accounts[2])
			let value = web3.util.toBN(minPurchase).sub(web3.utils.toBN(2))
			await expectRevert(
				ico.buy({ from: accounts[2], value }),
				"Have to send between min and max purchase",
			)
			value = web3.utils.toBN(maxPurchase).add(web3.utils.toBN(2))
			await expectRevert(
				ico.buy({ from: accounts[2], value }),
				"Have to send between min and max purchase",
			)
		})

		it("Should not buy if not enough tokens left", async () => {
			await ico.whiteList(accounts[2])
			await ico.buy({ from: accounts[2], value: web3.utils.toWei("10") })
			await expectRevert(
				ico.buy({ from: accounts[2], value: web3.utils.toWei("10") }),
				"Not enough tokens left for sale",
			)
		})

		it.only("Full initial coin offering process: investor buys: admin release and withdraw", async () => {
			const [investor1, investor2] = [accounts[1], accounts[2]]
			const [amount1, amount2] = [
				web3.utils.toBN(web3.utils.toWei("1")),
				web3.utils.toBN(web3.utils.toWei("10")),
			]
			await ico.whiteList(investor1)
			await ico.whiteList(investor2)
			await ico.buy({ from: investor1, value: amount1 })
			await ico.buy({ from: investor2, value: amount2 })

			await expectRevert(ico.release({ from: investor1 }), "Only admin")

			await expectRevert(ico.release(), "ICO must have ended")

			await expectRevert(ico.withdraw(accounts[9], 10, "ICO must have ended"))

			time.increaseTo(start + duration + 10)
			await ico.release()
			const balance1 = await token.balanceOf(investor1)
			const balance2 = await token.balanceOf(investor2)
			assert(balance1.eq(amount1.mul(web3.utils.toBN(price))))
			assert(balance2.eq(amount2.mul(web3.utils.toBN(price))))

			await expectRevert(
				ico.withdraw(accounts[9], 10, { from: investor1 }),
				"Only admin",
			)

			const balanceContract = web3.utils.toBN(
				await web3.eth.getBalance(token.address),
			)

			const balanceBefore = web3.utils.toBN(
				await web3.eth.getBalance(accounts[9]),
			)

			await ico.withdraw(accounts[9], balanceContract)

			const balanceAfter = web3.utils.toBN(
				await web3.eth.getBalance(accounts[9]),
			)

			assert(balanceAfter.sub(balanceBefore).eq(balanceContract))
		})
	})
})
