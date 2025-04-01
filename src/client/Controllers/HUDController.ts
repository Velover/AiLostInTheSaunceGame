import { Controller, OnInit, OnStart, Dependency } from "@flamework/core";
import { Players, StarterGui } from "@rbxts/services";
import { GameController } from "./GameController";
import { Events } from "client/network";
import { formatTime } from "shared/module";

@Controller({})
export class HUDController implements OnInit, OnStart {
	private notificationQueue: string[] = [];
	private processingNotifications = false;

	constructor(private gameController: GameController) {}

	onInit() {
		// Connect to events that should display notifications
		Events.ingredientCollected.connect((id, playerName) => {
			if (playerName === Players.LocalPlayer.Name) {
				this.showNotification(`Ingredient collected!`, 2);
			}
		});

		Events.playerTrapped.connect((playerName) => {
			if (playerName === Players.LocalPlayer.Name) {
				this.showNotification(`Oops! You're trapped in sauce!`, 3);
			}
		});

		Events.updateGameState.connect((state) => {
			if (state.timeRemaining === 10) {
				this.showNotification(`10 seconds remaining!`, 3);
			} else if (state.timeRemaining === 0) {
				this.showNotification(`Game Over!`, 4);
			} else if (
				state.ingredientsCollected === state.totalIngredients &&
				state.totalIngredients > 0
			) {
				this.showNotification(`All ingredients collected!`, 3);
			}
		});
	}

	onStart() {
		// Disable core GUIs that might interfere with our UI
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, true);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Chat, true);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, true);
	}

	private showNotification(message: string, duration = 3): void {
		this.notificationQueue.push(message);

		if (!this.processingNotifications) {
			this.processNotificationQueue();
		}
	}

	private processNotificationQueue(): void {
		if (this.notificationQueue.size() === 0) {
			this.processingNotifications = false;
			return;
		}

		this.processingNotifications = true;
		const message = this.notificationQueue.shift()!;

		StarterGui.SetCore("SendNotification", {
			Title: "Lost in the Sauce",
			Text: message,
			Duration: 3,
		});

		// Wait before showing the next notification
		task.delay(1, () => this.processNotificationQueue());
	}
}
