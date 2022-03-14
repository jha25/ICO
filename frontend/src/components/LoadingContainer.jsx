/** @format */

import React from "react"
import { drizzleReactHooks } from "../../node_modules/@drizzle/react-plugin"

const { useDrizzleState } = drizzleReactHooks

const LoadingContainer = ({ children }) => {
	const drizzleStatus = useDrizzleState((state) => state.drizzleStatus)
	console.log(`Drizzle status: ${drizzleStatus}`)
	if (drizzleStatus.initialized === false) {
		return "Loading..."
	}
	return <>{children}</>
}

export default LoadingContainer
