import { Controller, OnInit, OnStart } from "@flamework/core";
import { Players, UserInputService, Workspace } from "@rbxts/services";
import { ArrayTools } from "@rbxts/tool_pack";
import { Events } from "client/network";
import { GameState, LeaderboardEntry } from "shared/network";

@Controller({})
export class GameController implements OnStart, OnInit {
	private currentState: GameState = {
		timeRemaining: 0,
		ingredientsCollected: 0,
		totalIngredients: 0,
	};

	private leaderboard: LeaderboardEntry[] = [];
	private localPlayer = Players.LocalPlayer;
	private character?: Model;
	private humanoid?: Humanoid;
	private rootPart?: BasePart;
	private isTrapped = false;
	private checkRadius = 5; // Radius for ingredient collection

	onInit() {
		Events.updateGameState.connect((state) => {
			this.currentState = state;
			this.onGameStateChanged();
		});

		Events.ingredientCollected.connect((id, playerName) => {
			print(`${playerName} collected ingredient ${id}`);
			this.playCollectionSound();
		});

		Events.updateLeaderboard.connect((leaderboard) => {
			this.leaderboard = leaderboard;
			this.onLeaderboardChanged();
		});

		Events.playerTrapped.connect((playerName) => {
			if (playerName === this.localPlayer.Name) {
				this.onPlayerTrapped();
			}
		});

		this.setupCharacter();
		this.localPlayer.CharacterAdded.Connect(() => this.setupCharacter());
	}

	onStart() {
		// Listen for key presses to start the game
		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;

			if (input.KeyCode === Enum.KeyCode.P) {
				this.startGame();
			}
		});

		// Periodically update server with player position and check for ingredients
		this.startPositionUpdates();
		this.startIngredientCollection();
	}

	public getCurrentState(): GameState {
		return this.currentState;
	}

	public getLeaderboard(): LeaderboardEntry[] {
		return this.leaderboard;
	}

	public startGame() {
		Events.gameStart.fire();
	}

	private setupCharacter() {
		// Wait for character to load if it doesn't exist
		if (!this.localPlayer.Character) {
			const connection = this.localPlayer.CharacterAdded.Connect((char) => {
				this.character = char;
				this.initCharacterParts();
				connection.Disconnect();
			});
		} else {
			this.character = this.localPlayer.Character;
			this.initCharacterParts();
		}
	}

	private initCharacterParts() {
		if (!this.character) return;

		this.humanoid = this.character.FindFirstChildOfClass("Humanoid") as Humanoid;
		this.rootPart = this.character.FindFirstChild("HumanoidRootPart") as BasePart;

		// Reset trapped state when character spawns
		this.isTrapped = false;
	}

	private startPositionUpdates() {
		task.spawn(() => {
			while (true) {
				if (this.rootPart) {
					Events.playerMoved.fire(this.rootPart.Position);
				}
				task.wait(0.5);
			}
		});
	}

	private startIngredientCollection() {
		task.spawn(() => {
			while (true) {
				if (this.rootPart && !this.isTrapped) {
					this.checkNearbyIngredients();
				}
				task.wait(0.1);
			}
		});
	}

	private checkNearbyIngredients() {
		if (!this.rootPart) return;

		// Find ingredients folder
		const ingredientsFolder = Workspace.FindFirstChild("Ingredients");
		if (!ingredientsFolder) return;

		// Use a Region3 to find nearby parts
		const position = this.rootPart.Position;
		const region = new Region3(
			position.sub(new Vector3(this.checkRadius, this.checkRadius, this.checkRadius)),
			position.add(new Vector3(this.checkRadius, this.checkRadius, this.checkRadius)),
		);

		// Find parts in the region that are in the ingredients folder
		const parts = Workspace.FindPartsInRegion3WithWhiteList(region, [ingredientsFolder]);

		for (const part of parts) {
			const id = part.GetAttribute("id") as string;
			const collected = part.GetAttribute("collected") as boolean;

			if (id && !collected) {
				Events.collectIngredient.fire(id);
				part.SetAttribute("collected", true); // Mark as collected locally
			}
		}
	}

	private onPlayerTrapped() {
		if (!this.humanoid || this.isTrapped) return; // Prevent multiple traps at once

		this.isTrapped = true;

		// Slow down player when trapped
		const originalWalkSpeed = this.humanoid.WalkSpeed;
		this.humanoid.WalkSpeed = 0;

		// Visual feedback when trapped
		const character = this.character;
		if (character) {
			// Flash the character red
			for (const part of character.GetChildren()) {
				if (part.IsA("BasePart")) {
					const originalColor = part.Color;
					part.Color = Color3.fromRGB(255, 0, 0);

					task.delay(0.2, () => {
						if (part.Parent) {
							part.Color = originalColor;
						}
					});
				}
			}
		}

		// Play trapped sound
		this.playTrappedSound();

		// Reset after delay
		task.delay(2, () => {
			if (this.humanoid && this.humanoid.Parent) {
				this.humanoid.WalkSpeed = originalWalkSpeed;
				this.isTrapped = false;

				// Tell server we're no longer trapped
				Events.playerFreed.fire();
			}
		});
	}

	private playCollectionSound() {
		const sound = new Instance("Sound");
		sound.SoundId = "rbxassetid://9125712561"; // Use appropriate sound ID
		sound.Volume = 0.5;
		sound.Parent = this.rootPart;
		sound.Play();

		task.delay(1, () => {
			sound.Destroy();
		});
	}

	private playTrappedSound() {
		const sound = new Instance("Sound");
		sound.SoundId = "rbxassetid://142082166"; // Use appropriate sound ID
		sound.Volume = 0.7;
		sound.Parent = this.rootPart;
		sound.Play();

		task.delay(1, () => {
			sound.Destroy();
		});
	}

	private onGameStateChanged() {
		// Check for game state transitions
		if (this.currentState.timeRemaining <= 0 && this.currentState.totalIngredients > 0) {
			// Game ended
			print("Game ended!");

			// Reset trapped state if game ends while trapped
			if (this.isTrapped && this.humanoid) {
				this.isTrapped = false;
				this.humanoid.WalkSpeed = 16;
			}
		}

		// Check if all ingredients are collected
		if (
			this.currentState.ingredientsCollected === this.currentState.totalIngredients &&
			this.currentState.totalIngredients > 0
		) {
			print("All ingredients collected!");
		}
	}

	private onLeaderboardChanged() {
		// Sort leaderboard if needed (should be sorted by server, but double-check)
		this.leaderboard.sort((a, b) => a.score > b.score);

		// Output top 3 players to console for debugging
		const topPlayers = ArrayTools.SubArray(this.leaderboard, 0, 3);
		if (topPlayers.size() > 0) {
			print("Top Players:");
			for (const [index, player] of ipairs(topPlayers)) {
				print(`${index + 1}. ${player.playerName}: ${player.score}`);
			}
		}

		// Check if local player is in top 3
		const localPlayerEntry = this.leaderboard.find(
			(entry) => entry.playerName === this.localPlayer.Name,
		);
		if (localPlayerEntry) {
			const playerRank =
				this.leaderboard.findIndex((entry) => entry.playerName === this.localPlayer.Name) + 1;
			if (playerRank <= 3) {
				print(`Congratulations! You are ranked #${playerRank}!`);
			}
		}
	}
}
