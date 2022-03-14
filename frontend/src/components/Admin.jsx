/** @format */

import React, { useState, useEffect } from "react"
import { drizzleReactHooks } from "../../node_modules/@drizzle/react-plugin"
import { newContextComponents } from "../../node_modules/@drizzle/react-components"

const { useDrizzle, useDrizzleState } = drizzleReactHooks
const { ContractForm } = newContextComponents

const Admin = () => {
	const [isAdmin, setIsAdmin] = useState(false)
	const { drizzle } = useDrizzle()
	const state = useDrizzleState((state) => state)

	useEffect(() => {
		;(async () => {
			const admin = await drizzle.contracts.ICO.methods.admin().call()
			console.log(admin)
			setIsAdmin(admin.toLowerCase() === state.accounts[0].toLowerCase())
		})()
	}, [])

	if (!isAdmin) {
		return null
	}

	return (
		<div className='App'>
			<div>
				<h2>Start</h2>
				<ContractForm drizzle={drizzle} contract='ICO' method='start' />
			</div>
			<div>
				<h2>Whitelist</h2>
				<ContractForm drizzle={drizzle} contract='ICO' method='whitelist' />
			</div>
			<div>
				<h2>Release</h2>
				<ContractForm drizzle={drizzle} contract='ICO' method='release' />
			</div>
			<div>
				<h2>Withdraw</h2>
				<ContractForm drizzle={drizzle} contract='ICO' method='withdraw' />
			</div>
		</div>
	)
}

export default Admin
