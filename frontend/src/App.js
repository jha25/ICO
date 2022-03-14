/** @format */

import "./App.css"
import React from "react"
import { Drizzle } from "../node_modules/@drizzle/store"
import { drizzleReactHooks } from "../node_modules/@drizzle/react-plugin"

import drizzleOptions from "./utils/drizzleOptions"
import LoadingContainer from "./components/LoadingContainer"
import ICOInfo from "./components/ICOInfo"
import Investor from "./components/Investor"
import Admin from "./components/Admin"

const drizzle = new Drizzle(drizzleOptions)
console.log(drizzle)
const { DrizzleProvider } = drizzleReactHooks

function App() {
	return (
		<div className='container'>
			<h1>ICO</h1>
			<DrizzleProvider drizzle={drizzle}>
				<LoadingContainer>
					<ICOInfo />
					<Investor />
					<Admin />
				</LoadingContainer>
			</DrizzleProvider>
		</div>
	)
}

export default App
