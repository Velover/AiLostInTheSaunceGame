import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { GameUI } from "client/Components/UI/GameUI";

@Controller({})
export class UIController implements OnStart {
	private root: ReactRoblox.Root | undefined;

	onStart() {
		const playerGui = Players.LocalPlayer.FindFirstChildOfClass("PlayerGui");
		if (!playerGui) return;

		// Create a container for our React UI
		const container = new Instance("ScreenGui");
		container.Name = "ReactUI";
		container.IgnoreGuiInset = true;
		container.ResetOnSpawn = false;
		container.Parent = playerGui;

		// Create a root for our React tree
		this.root = ReactRoblox.createRoot(container);

		// Render our UI
		this.root.render(React.createElement(GameUI, { visible: true }));
	}
}
