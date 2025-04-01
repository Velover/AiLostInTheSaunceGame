import { Controller, OnInit, OnStart } from "@flamework/core";
import { Players, Workspace } from "@rbxts/services";
import { Events } from "client/network";

@Controller({})
export class EffectsController implements OnStart, OnInit {
	private localPlayer = Players.LocalPlayer;

	onInit() {
		// Set up event connections
		Events.gameStarted.connect(() => this.onGameStart());
		Events.ingredientCollected.connect((id, playerName) => {
			if (playerName === this.localPlayer.Name) {
				this.onIngredientCollected();
			}
		});
		Events.playerTrapped.connect((playerName) => {
			if (playerName === this.localPlayer.Name) {
				this.onPlayerTrapped();
			}
		});
	}

	onStart() {
		// Nothing specific on start
	}

	private onGameStart() {
		// Flash effect when game starts
		this.createFlashEffect(Color3.fromRGB(255, 255, 255), 0.5, 0.5);
	}

	private onIngredientCollected() {
		// Small camera shake when collecting ingredients
		this.shakeCamera(0.5, 0.5);
	}

	private onPlayerTrapped() {
		// Stronger camera shake and red flash when trapped
		this.shakeCamera(1.5, 1.0);
		this.createFlashEffect(Color3.fromRGB(255, 0, 0), 0.3, 0.5);
	}

	private shakeCamera(intensity: number, duration: number) {
		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		const originalPosition = camera.CFrame.Position;
		const startTime = os.clock();

		task.spawn(() => {
			while (true) {
				const elapsed = os.clock() - startTime;
				if (elapsed > duration) break;

				const remainingTime = duration - elapsed;
				const damping = remainingTime / duration; // Gradually reduce effect

				// Generate random offset
				const xOffset = (math.random() - 0.5) * intensity * damping;
				const yOffset = (math.random() - 0.5) * intensity * damping;
				const zOffset = (math.random() - 0.5) * intensity * damping;

				// Apply offset to camera
				const offset = new Vector3(xOffset, yOffset, zOffset);
				camera.CFrame = new CFrame(originalPosition.add(offset)).mul(
					camera.CFrame.sub(camera.CFrame.Position),
				);

				task.wait(0.01); // Update at high frequency for smooth effect
			}

			// Reset camera position
			camera.CFrame = new CFrame(originalPosition).mul(camera.CFrame.sub(camera.CFrame.Position));
		});
	}

	private createFlashEffect(color: Color3, transparency: number, duration: number) {
		// Create a full-screen color overlay
		const playerGui = this.localPlayer.FindFirstChildOfClass("PlayerGui");
		if (!playerGui) return;

		// Create flash screen GUI
		const flashGui = new Instance("ScreenGui");
		flashGui.Name = "FlashEffect";
		flashGui.IgnoreGuiInset = true;
		flashGui.Parent = playerGui;

		// Create color frame
		const frame = new Instance("Frame");
		frame.Size = UDim2.fromScale(1, 1);
		frame.BackgroundColor3 = color;
		frame.BackgroundTransparency = transparency;
		frame.BorderSizePixel = 0;
		frame.Parent = flashGui;

		// Fade out effect
		task.delay(duration * 0.1, () => {
			const fadeStart = os.clock();
			const fadeTime = duration * 0.9;

			task.spawn(() => {
				while (frame && frame.Parent) {
					const elapsed = os.clock() - fadeStart;
					const alpha = math.clamp(elapsed / fadeTime, 0, 1);

					frame.BackgroundTransparency = transparency + (1 - transparency) * alpha;

					if (alpha >= 1) break;
					task.wait();
				}

				if (flashGui && flashGui.Parent) {
					flashGui.Destroy();
				}
			});
		});
	}
}
