import { Controller, OnInit, OnStart } from "@flamework/core";
import { Lighting, Players, Workspace } from "@rbxts/services";
import { Events } from "client/network";
import { GAME_CONSTANTS } from "shared/module";
import { GameController } from "./GameController";

@Controller({})
export class GameInitController implements OnInit, OnStart {
	constructor(private gameController: GameController) {}
	onInit() {
		// Setup player character settings
		Players.LocalPlayer.CharacterAdded.Connect((character) => {
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) {
				humanoid.WalkSpeed = 16;
				humanoid.JumpPower = 50;
			}
		});

		// Setup lighting for the game atmosphere
		this.setupLighting();

		// Listen for game start
		Events.gameStarted.connect(() => {
			this.onGameStart();
		});

		// Show welcome message
		print("Welcome! Collect ingredients while avoiding sauce pools.");
		// StarterGui.SetCore("SendNotification", {
		// 	Title: GAME_CONSTANTS.TITLE,
		// 	Text: "Welcome! Collect ingredients while avoiding sauce pools.",
		// 	Duration: 5,
		// });
	}

	onStart() {
		// Wait a moment, then show game instructions
		task.delay(3, () => {
			print("Press P to start a new game. Walk over ingredients to collect them.");
			// StarterGui.SetCore("SendNotification", {
			// 	Title: "How to Play",
			// 	Text: "Press P to start a new game. Walk over ingredients to collect them.",
			// 	Duration: 7,
			// });
		});
	}

	private onGameStart() {
		// Reset camera
		const camera = Workspace.CurrentCamera;
		if (camera) {
			camera.CameraType = Enum.CameraType.Custom;
		}

		print(`Collect all ${GAME_CONSTANTS.MAX_INGREDIENTS} ingredients!`);
		// Show game started message
		// StarterGui.SetCore("SendNotification", {
		// 	Title: "Game Started!",
		// 	Text: `Collect all ${GAME_CONSTANTS.MAX_INGREDIENTS} ingredients!`,
		// 	Duration: 3,
		// });
	}

	private setupLighting() {
		// Create a more atmospheric lighting
		Lighting.Ambient = Color3.fromRGB(80, 80, 90);
		Lighting.Brightness = 2;
		Lighting.ClockTime = 14; // Afternoon

		// Add atmospheric effects
		const bloom = new Instance("BloomEffect");
		bloom.Intensity = 0.3;
		bloom.Size = 24;
		bloom.Threshold = 2;
		bloom.Enabled = true;
		bloom.Parent = Lighting;

		const colorCorrection = new Instance("ColorCorrectionEffect");
		colorCorrection.Brightness = 0.05;
		colorCorrection.Contrast = 0.1;
		colorCorrection.Saturation = 0.2;
		colorCorrection.TintColor = Color3.fromRGB(255, 245, 235);
		colorCorrection.Enabled = true;
		colorCorrection.Parent = Lighting;
	}
}
